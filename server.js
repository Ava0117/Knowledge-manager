const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');

const KIMI_API_KEY = 'sk-e6QDPrC1f5f5Qr4zmCSMMmg7qP31apEdZ2LckDo3CjJ7rmkd';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/summarize', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: '请提供text参数' });
        }

        const aiResult = await callKimAI(text);
        if (aiResult) {
            return res.json(aiResult);
        }

        const summary = generateSummary(text);
        const keywords = extractKeywords(text);
        const category = determineCategory(text, keywords);
        const contentType = detectContentType(text);
        const sentiment = analyzeSentiment(text);
        const keyPoints = extractKeyPoints(text);
        const suggestions = generateSuggestions(text, category);
        const quality = assessQuality(text);

        res.json({
            summary,
            title: generateTitle(text, keywords),
            keywords,
            category,
            contentType,
            sentiment,
            keyPoints,
            suggestions,
            quality,
            wordCount: text.length,
            estimatedReadTime: Math.max(1, Math.ceil(text.length / 400)),
            tags: generateTags(keywords, category),
            autoGroup: suggestGroup(keywords, category)
        });
    } catch (error) {
        console.error('Summarize error:', error);
        res.status(500).json({ error: '总结失败' });
    }
});

async function callKimAI(text) {
    return new Promise((resolve, reject) => {
        const prompt = `你是一个内容分析专家。请分析以下内容并提取关键信息。

内容：
${text.substring(0, 4000)}

分析要求：
1. 根据内容生成一个合适的标题
2. 用自己的话总结核心内容（2-3句话）
3. 提取3-5个关键要点，包括具体方法、步骤、技巧
4. 根据内容给出4-6个具体可执行的行动建议，建议要多样化，包括：思考类、行动类、分享类、整理类等

JSON格式（必须包含所有字段）：
{
  "title": "标题",
  "summary": "总结内容",
  "keywords": ["关键词1","关键词2","关键词3"],
  "category": "学习/娱乐/健康/工作/生活",
  "contentType": "知识讲解/经验分享/观点表达/技巧干货/情感共鸣",
  "keyPoints": [
    {"title": "要点1", "content": "详细内容"},
    {"title": "要点2", "content": "详细内容"}
  ],
  "suggestions": ["建议类型1:具体建议", "建议类型2:具体建议", "建议类型3:具体建议", "建议类型4:具体建议"]
}`;

        const requestBody = JSON.stringify({
            model: 'moonshot-v1-8k',
            messages: [
                { role: 'system', content: '你是一个经验丰富的知识管理专家，擅长深度理解内容并给出有价值的分析。你会真正思考内容，而不是机械提取。你给出的建议都是具体可执行的。' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8
        });

        const options = {
            hostname: 'api.moonshot.cn',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_API_KEY}`
            },
            timeout: 30000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) {
                        console.error('Kimi API error:', parsed.error);
                        resolve(null);
                        return;
                    }
                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
                        const content = parsed.choices[0].message.content;
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const result = JSON.parse(jsonMatch[0]);
                            resolve({
                                title: result.title || '无标题',
                                summary: result.summary || '暂无摘要',
                                keywords: result.keywords || [],
                                category: mapCategory(result.category),
                                contentType: { type: result.contentType || '一般内容', icon: '📝' },
                                sentiment: { sentiment: '中性客观', icon: '😐', type: 'neutral' },
                                keyPoints: (result.keyPoints || []).map((p, i) => ({
                                    title: p.title || `要点${i+1}`,
                                    content: p.content || '',
                                    icon: '📌'
                                })),
                                suggestions: result.suggestions || [],
                                quality: assessQuality(text),
                                wordCount: text.length,
                                estimatedReadTime: Math.max(1, Math.ceil(text.length / 400)),
                                tags: result.keywords ? result.keywords.slice(0, 8) : [],
                                autoGroup: suggestGroup(result.keywords || [], mapCategory(result.category))
                            });
                            return;
                        }
                    }
                    console.error('Kimi response unexpected format:', content.substring(0, 200));
                    resolve(null);
                } catch (e) {
                    console.error('Parse error:', e.message);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error('Kimi API error:', e.message);
            resolve(null);
        });

        req.on('timeout', () => {
            console.error('Kimi API timeout');
            req.destroy();
            resolve(null);
        });

        req.write(requestBody);
        req.end();
    });
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message) {
            return res.status(400).json({ error: '请提供message参数' });
        }

        const result = await callChatKimAI(message, history);
        if (result) {
            return res.json({ success: true, response: result });
        }
        res.status(500).json({ error: 'AI响应失败' });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: '聊天失败' });
    }
});

async function callChatKimAI(message, history) {
    return new Promise((resolve, reject) => {
        const messages = [
            { role: 'system', content: '你是一个专业的AI学习助手，擅长回答学习相关的问题。你应该给出详细、有条理、有深度的回答，并鼓励用户思考和追问。' }
        ];

        history.forEach(h => {
            messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content });
        });

        messages.push({ role: 'user', content: message });

        const requestBody = JSON.stringify({
            model: 'moonshot-v1-8k',
            messages: messages,
            temperature: 0.8
        });

        const options = {
            hostname: 'api.moonshot.cn',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_API_KEY}`,
                'Content-Length': Buffer.byteLength(requestBody)
            },
            timeout: 60000
        };

        console.log('Calling Kimi API...');

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log('Kimi API response status:', res.statusCode);
                    if (parsed.error) {
                        console.error('Kimi API error:', parsed.error);
                        resolve(null);
                        return;
                    }
                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
                        console.log('Kimi API success, response length:', parsed.choices[0].message.content.length);
                        resolve(parsed.choices[0].message.content);
                    } else {
                        console.error('Kimi API unexpected response:', JSON.stringify(parsed).substring(0, 200));
                        resolve(null);
                    }
                } catch (e) {
                    console.error('Parse error:', e.message, 'Data:', data.substring(0, 200));
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error('Kimi Chat API error:', e.message);
            resolve(null);
        });

        req.on('timeout', () => {
            console.error('Kimi API timeout');
            req.destroy();
            resolve(null);
        });

        req.write(requestBody);
        req.end();
    });
}

function mapCategory(cat) {
    const map = {
        '学习': { category: 'study', label: '📚 学习' },
        '娱乐': { category: 'entertainment', label: '🎬 娱乐' },
        '健康': { category: 'health', label: '💪 健康' },
        '工作': { category: 'work', label: '💼 工作' },
        '生活': { category: 'life', label: '🏠 生活' }
    };
    return map[cat] || { category: 'study', label: '📚 学习' };
}

app.post('/api/fetch', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !url.includes('://')) {
            return res.json({ success: false, error: '链接格式不正确' });
        }

        const platform = detectPlatform(url);

        if (platform === 'douyin') {
            return res.json({ success: false, error: '抖音链接请复制视频下方的文字描述粘贴分析' });
        } else if (platform === 'weibo') {
            return res.json({ success: false, error: '微博内容需要登录后才能获取，请复制微博文字内容粘贴分析' });
        } else if (platform === 'bilibili') {
            try {
                const result = await Promise.race([
                    fetchBilibiliContent(url),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
                ]);
                return res.json(result);
            } catch (e) {
                return res.json({ success: false, error: 'B站内容获取超时，请复制视频标题描述粘贴分析' });
            }
        } else if (platform === 'douban') {
            try {
                const result = await Promise.race([
                    fetchDoubanContent(url),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
                ]);
                return res.json(result);
            } catch (e) {
                return res.json({ success: false, error: '豆瓣内容获取超时' });
            }
        } else {
            try {
                const content = await Promise.race([
                    fetchUrlContent(url),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
                ]);
                if (content && content.length > 50) {
                    return res.json({ success: true, content, platform });
                } else {
                    return res.json({ success: false, error: '无法获取网页内容，请复制文字后分析' });
                }
            } catch (e) {
                console.error('Fetch error:', e.message);
                return res.json({ success: false, error: '获取失败，请复制网页文字内容粘贴分析' });
            }
        }
    } catch (error) {
        console.error('Fetch error:', error);
        res.json({ success: false, error: '获取失败: ' + error.message });
    }
});

async function fetchDouyinContent(url) {
    try {
        const content = await fetchUrlContent(url);
        if (content && content.length > 30) {
            const cleaned = content.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
            return { success: true, content: cleaned.substring(0, 5000), platform: 'douyin' };
        }
        return { success: false, error: '抖音链接请复制视频下方的文字描述粘贴分析' };
    } catch (e) {
        return { success: false, error: '抖音链接请复制视频文字描述粘贴分析' };
    }
}

async function fetchWeiboContent(url) {
    try {
        const content = await fetchUrlContent(url);
        if (content && content.length > 30) {
            const cleaned = content.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
            return { success: true, content: cleaned.substring(0, 5000), platform: 'weibo' };
        }
        return { success: false, error: '微博链接请复制微博文字内容粘贴分析' };
    } catch (e) {
        return { success: false, error: '微博链接请复制微博文字内容粘贴分析' };
    }
}

async function fetchBilibiliContent(url) {
    try {
        const content = await fetchUrlContent(url);
        if (content && content.length > 50) {
            const cleaned = content.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
            const titleMatch = content.match(/"title":"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : '';
            const descMatch = content.match(/"description":"([^"]+)"/);
            const description = descMatch ? descMatch[1] : '';
            const finalContent = title + ' ' + description;
            return { success: true, content: (finalContent.length > 50 ? finalContent : cleaned).substring(0, 5000), platform: 'bilibili' };
        }
        return { success: false, error: 'B站内容获取失败，请复制视频标题描述粘贴分析' };
    } catch (e) {
        return { success: false, error: 'B站内容获取失败' };
    }
}

async function fetchDoubanContent(url) {
    try {
        const content = await fetchUrlContent(url);
        if (content && content.length > 50) {
            const cleaned = content.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
            return { success: true, content: cleaned.substring(0, 5000), platform: 'douban' };
        }
        return { success: false, error: '豆瓣内容获取失败' };
    } catch (e) {
        return { success: false, error: '豆瓣内容获取失败' };
    }
}

app.post('/api/analyze', async (req, res) => {
    try {
        const { text, url } = req.body;
        let content = text || '';
        let originalUrl = url || '';
        let fetchSuccess = false;
        let fetchError = null;

        if (url && url.includes('://')) {
            try {
                const fetchedContent = await fetchUrlContent(url);
                if (fetchedContent && fetchedContent.length > 50) {
                    content = fetchedContent;
                    fetchSuccess = true;
                }
            } catch (err) {
                fetchError = err.message;
                console.log('URL fetch failed, using URL as content:', err.message);
            }
        }

        if (!content || content.length < 20) {
            content = url || text || '';
        }

        const aiResult = await callKimAI(content);
        if (aiResult) {
            aiResult.platform = detectPlatform(url);
            aiResult.fetchSuccess = fetchSuccess;
            aiResult.fetchError = fetchError;
            aiResult.originalUrl = url;
            aiResult.analysisNote = fetchSuccess ? '已提取网页内容' : (fetchError ? '无法获取网页内容，基于链接分析' : '基于输入内容分析');
            return res.json(aiResult);
        }

        const summary = generateSummary(content);
        const keywords = extractKeywords(content);
        const category = determineCategory(content, keywords);
        const contentType = detectContentType(content);
        const sentiment = analyzeSentiment(content);
        const keyPoints = extractKeyPoints(content);
        const suggestions = generateSuggestions(content, category);
        const quality = assessQuality(content);
        const platform = detectPlatform(url);

        res.json({
            platform,
            fetchSuccess,
            fetchError,
            summary,
            title: generateTitle(content, keywords),
            keywords,
            category,
            contentType,
            sentiment,
            keyPoints,
            suggestions,
            quality,
            wordCount: content.length,
            estimatedReadTime: Math.max(1, Math.ceil(content.length / 400)),
            tags: generateTags(keywords, category),
            autoGroup: suggestGroup(keywords, category),
            originalUrl: url,
            analysisNote: fetchSuccess ? '已提取网页内容' : (fetchError ? '无法获取网页内容，基于链接分析' : '基于输入内容分析')
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: '分析失败' });
    }
});

function fetchUrlContent(url) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const protocol = isHttps ? https : http;
        const timeout = 5000;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            }
        };

        if (isHttps) {
            options.rejectUnauthorized = false;
        }

        const req = protocol.get(url, options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrlContent(res.headers.location).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }

            let data = '';
            const timer = setTimeout(() => {
                req.destroy();
                reject(new Error('Timeout'));
            }, timeout);

            res.on('data', chunk => {
                data += chunk;
                if (data.length > 50000) {
                    clearTimeout(timer);
                    req.destroy();
                }
            });

            res.on('end', () => {
                clearTimeout(timer);
                try {
                    const text = extractTextFromHtml(data);
                    resolve(text);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

function extractTextFromHtml(html) {
    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

    const chineseMatch = text.match(/[\u4e00-\u9fa5]+[^\u0000-\u007f]*/g);
    if (chineseMatch && chineseMatch.length > 0) {
        text = chineseMatch.join(' ').substring(0, 8000);
    } else {
        text = text.substring(0, 8000);
    }

    return text;
}

function generateSummary(text) {
    if (!text || text.length < 10) return '内容过短，无法总结';

    const cleaned = text.replace(/\s+/g, ' ').trim();
    const sentences = cleaned.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 5);

    if (sentences.length === 0) {
        return cleaned.substring(0, 300);
    }

    const scored = sentences.map(s => {
        let score = 0;
        const t = s.trim();

        const importantPatterns = [
            /关键|重要|核心|本质|重点|要点/,
            /方法|技巧|步骤|流程|过程|阶段/,
            /原因|因为|所以|因此|导致/,
            /结果|效果|作用|意义|价值/,
            /经验|总结|分享|体会|感悟/
        ];

        importantPatterns.forEach(p => { if (p.test(t)) score += 2; });

        if (t.length >= 15 && t.length <= 200) score += 1;

        if (/[0-9]{3,}/.test(t)) score += 1;
        if (/第一|第二|第三|首先|然后|最后/.test(t)) score += 1;

        return { sentence: t, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3).map(s => s.sentence);

    let summary = top3.join('。');
    if (summary.length > 500) summary = summary.substring(0, 500) + '...';

    return summary || cleaned.substring(0, 200);
}

function generateTitle(text, keywords) {
    if (!text) return '无标题';

    const cleaned = text.replace(/\s+/g, ' ').trim();

    const titlePatterns = [
        /([\u4e00-\u9fa5]{4,30}(?:分享|教程|指南|方法|技巧|攻略|总结|经验))/,
        /([\u4e00-\u9fa5]{2,20}(?:干货|秘诀|妙招|心得))/,
        /关于([\u4e00-\u9fa5]{2,15})(?:分享|经验|技巧|方法)/,
        /([\u4e00-\u9fa5]{4,25})/
    ];

    for (const pattern of titlePatterns) {
        const match = cleaned.match(pattern);
        if (match && match[1]) return match[1].substring(0, 40);
    }

    const urlMatch = cleaned.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        const url = urlMatch[0];
        if (url.includes('zhihu')) return '知乎内容精选';
        if (url.includes('douyin')) return '抖音内容';
        if (url.includes('weibo')) return '微博内容';
        if (url.includes('bilibili')) return 'B站内容';
    }

    if (keywords && keywords.length >= 2) {
        return `关于${keywords.slice(0, 2).join('和')}的分享`;
    }

    return cleaned.substring(0, 25) + (cleaned.length > 25 ? '...' : '');
}

function extractKeywords(text) {
    const stopWords = new Set(['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '这个', '什么', '怎么', '如果', '因为', '所以', '但是', '可以', '我们', '已经', '现在', '时候', '然后', '还是', '只是', '应该', '需要', '开始', '一些', '这些', '那些']);

    const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const freq = {};
    words.forEach(w => {
        if (!stopWords.has(w) && w.length >= 2) freq[w] = (freq[w] || 0) + 1;
    });

    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w]) => w);
}

function determineCategory(text, keywords) {
    const cats = {
        study: { keywords: ['学习', '知识', '教程', '课程', '编程', '开发', 'python', 'ai', '人工智能', '技术', '面试', '技能', '方法', '思维', '干货', '科学', '考试', '考研', '考证', '英语', '数学', '物理', '化学', '论文', '研究', '理论', '原理', '概念'], label: '📚 学习' },
        entertainment: { keywords: ['电影', '音乐', '综艺', '搞笑', '游戏', '追星', '明星', '电视剧', '美食', '旅行', '时尚', '美妆', '宠物', '视频', '抖音', 'B站', '追剧', '动漫', '小说'], label: '🎬 娱乐' },
        health: { keywords: ['健康', '健身', '减肥', '运动', '瑜伽', '冥想', '饮食', '营养', '睡眠', '心理', '养生', '中医', '康复', '增肌', '减脂', '跑步'], label: '💪 健康' },
        work: { keywords: ['工作', '职场', '公司', '领导', '项目', '客户', '业务', '销售', '运营', '管理', '团队', '职业', '简历', '面试', '薪资', '晋升', '创业', '副业', '赚钱'], label: '💼 工作' },
        life: { keywords: ['生活', '日常', '家居', '购物', '理财', '消费', '房子', '装修', '汽车', '保险', '育儿', '孩子', '旅行', '结婚', '社交', '情感', '恋爱'], label: '🏠 生活' }
    };

    let maxScore = 0;
    let best = 'study';

    for (const [key, data] of Object.entries(cats)) {
        let score = 0;
        const allText = text + keywords.join('');
        for (const kw of data.keywords) {
            if (allText.includes(kw)) score++;
        }
        if (score > maxScore) { maxScore = score; best = key; }
    }

    return { category: best, label: cats[best].label, score: maxScore };
}

function detectContentType(text) {
    const types = [
        { type: '知识讲解', patterns: [/教程/, /讲解/, /原理/, /方法/, /技巧/, /课程/, /教学/] },
        { type: '经验分享', patterns: [/经历/, /故事/, /分享/, /我的/, /曾经/] },
        { type: '产品评测', patterns: [/测评/, /评测/, /体验/, /对比/, /推荐/] },
        { type: '干货技巧', patterns: [/干货/, /秘诀/, /技巧/, /妙招/, /实用/] },
        { type: '情感心理', patterns: [/感情/, /恋爱/, /心理/, /情绪/, /压力/] },
        { type: '娱乐内容', patterns: [/搞笑/, /娱乐/, /综艺/, /追星/] },
        { type: '健康养生', patterns: [/健康/, /养生/, /健身/, /减肥/, /饮食/] }
    ];

    for (const { type, patterns } of types) {
        if (patterns.some(p => p.test(text))) return { type, icon: '📖' };
    }
    return { type: '一般内容', icon: '📝' };
}

function analyzeSentiment(text) {
    const positive = [/好/, /棒/, /赞/, /喜欢/, /优秀/, /精彩/, /推荐/, /值得/];
    const negative = [/差/, /烂/, /失望/, /糟糕/, /垃圾/, /后悔/];

    let score = 0;
    positive.forEach(p => { if (p.test(text)) score++; });
    negative.forEach(p => { if (p.test(text)) score--; });

    if (score > 0) return { sentiment: '积极正面', icon: '😊', type: 'positive' };
    if (score < 0) return { sentiment: '消极负面', icon: '😞', type: 'negative' };
    return { sentiment: '中性客观', icon: '😐', type: 'neutral' };
}

function extractKeyPoints(text) {
    const points = [];
    const cleaned = text.replace(/\s+/g, ' ').trim();

    if (cleaned.length < 20) return points;

    const sentences = cleaned.split(/[。！？]+/).filter(s => s.trim().length > 10);

    if (sentences.length <= 3) {
        sentences.forEach((s, i) => {
            if (s.trim().length > 10) {
                points.push({
                    title: `要点${i + 1}`,
                    icon: '📌',
                    content: s.trim().substring(0, 150)
                });
            }
        });
        return points.slice(0, 4);
    }

    const keyIndicators = [
        { pattern: /关键|重要|核心|本质|重点/, title: '核心要点' },
        { pattern: /方法|技巧|步骤|流程|操作/, title: '方法步骤' },
        { pattern: /原因|因为|所以|导致|由于/, title: '原因分析' },
        { pattern: /注意|提醒|建议|警告|须知/, title: '注意事项' },
        { pattern: /优势|好处|价值|作用|效果/, title: '价值意义' },
        { pattern: /经验|总结|心得|体会|感悟/, title: '经验总结' }
    ];

    const seen = new Set();

    keyIndicators.forEach(({ pattern, title }) => {
        if (pattern.test(cleaned)) {
            const matched = sentences.find(s => pattern.test(s));
            if (matched && matched.trim().length > 10) {
                const key = matched.trim().substring(0, 30);
                if (!seen.has(key)) {
                    seen.add(key);
                    points.push({
                        title,
                        icon: '📌',
                        content: matched.trim().substring(0, 150)
                    });
                }
            }
        }
    });

    if (points.length < 2) {
        const midIndex = Math.floor(sentences.length / 2);
        if (sentences[midIndex] && sentences[midIndex].trim().length > 10) {
            points.push({
                title: '主要内容',
                icon: '📌',
                content: sentences[midIndex].trim().substring(0, 150)
            });
        }
        if (sentences[sentences.length - 1] && sentences[sentences.length - 1].trim().length > 10) {
            points.push({
                title: '总结',
                icon: '📌',
                content: sentences[sentences.length - 1].trim().substring(0, 150)
            });
        }
    }

    return points.slice(0, 5);
}

function generateSuggestions(text, category) {
    const suggestions = [];
    const catKey = category?.category || 'study';
    const catLabel = category?.label || '学习';

    const actionVerbs = ['开始', '行动', '执行', '实践', '尝试', '制定'];
    const hasAction = actionVerbs.some(v => text.includes(v));

    const questionWords = ['如何', '怎么', '怎样', '为什么', '为何'];
    const isQuestion = questionWords.some(w => text.includes(w));

    const numberList = text.match(/[0-9]+[.、,，][^。！？]{5,30}/g);
    const hasSteps = numberList && numberList.length >= 2;

    const tipWords = ['技巧', '方法', '秘诀', '妙招', '干货'];
    const hasTips = tipWords.some(w => text.includes(w));

    if (hasSteps) {
        suggestions.push('按步骤逐一执行');
    }

    if (isQuestion && !hasAction) {
        suggestions.push('带着问题深入思考');
    }

    if (hasTips) {
        suggestions.push('记录实用技巧');
    }

    if (text.includes('学习') || text.includes('知识')) {
        suggestions.push('收藏到学习笔记');
    }

    if (text.includes('工作') || text.includes('职场')) {
        suggestions.push('收藏到工作待办');
    }

    if (text.includes('健康') || text.includes('健身') || text.includes('运动')) {
        suggestions.push('加入健康计划');
    }

    if (!hasAction && !isQuestion && !hasSteps) {
        suggestions.push('收藏备用');
    }

    return [...new Set(suggestions)].slice(0, 4);
}

function assessQuality(text) {
    let score = 0;
    if (text.length > 100) score++;
    if (text.length > 500) score++;
    if (/第一|其次|最后|首先/.test(text)) score++;
    if (/数据|研究|案例|具体/.test(text)) score++;
    if (/如何|方法|步骤|建议/.test(text)) score++;

    if (score >= 4) return { level: '高质量', icon: '🌟', score };
    if (score >= 2) return { level: '中等质量', icon: '⭐', score };
    return { level: '一般内容', icon: '📄', score };
}

function generateTags(keywords, category) {
    const catKey = category?.category || 'study';
    const baseTags = { study: ['学习', '知识'], entertainment: ['娱乐'], health: ['健康'], work: ['工作'], life: ['生活'] };
    return [...new Set([...(baseTags[catKey] || []), ...keywords.slice(0, 5)])].slice(0, 8);
}

function suggestGroup(keywords, category) {
    const catKey = category?.category || 'study';
    const groups = {
        study: [['学习方法', ['学习', '记忆', '效率', '时间管理']], ['编程开发', ['编程', '代码', 'Python', '开发']], ['考研考证', ['考研', '考证', '考试']]],
        entertainment: [['影视', ['电影', '电视', '综艺']], ['游戏', ['游戏', '电竞']]],
        health: [['健身', ['健身', '运动', '增肌']], ['饮食', ['饮食', '减肥', '健康']]],
        work: [['职场', ['职场', '工作', '技能']], ['求职', ['简历', '面试', '跳槽']]],
        life: [['理财', ['理财', '投资', '省钱']], ['生活', ['生活', '日常']]]
    };

    const catGroups = groups[catKey] || [];
    for (const [group, kws] of catGroups) {
        if (kws.some(k => keywords.includes(k))) {
            return { suggested: true, groupName: group, alternatives: catGroups.map(([g]) => g) };
        }
    }

    return { suggested: false, groupName: category?.label?.replace(/[📚🎬💪💼🏠]/g, '').trim() || '未分类', alternatives: [] };
}

function detectPlatform(url) {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.includes('weibo')) return 'weibo';
    if (u.includes('douyin')) return 'douyin';
    if (u.includes('bilibili')) return 'bilibili';
    if (u.includes('douban')) return 'douban';
    if (u.includes('xiaohongshu')) return 'xiaohongshu';
    if (u.includes('zhihu')) return 'zhihu';
    return 'other';
}

app.get('/extracted', (req, res) => {
    try {
        const { data } = req.query;
        if (!data) {
            return res.send('<html><body style="font-family:sans-serif;padding:20px;"><h2>❌ 没有收到数据</h2><p>请从网页中选中内容后再点击书签</p><a href="/">返回主页</a></body></html>');
        }

        const parsed = JSON.parse(decodeURIComponent(data));
        const { title, text, url } = parsed;

        const summary = generateSummary(text);
        const keywords = extractKeywords(text);
        const category = determineCategory(text, keywords);
        const contentType = detectContentType(text);
        const sentiment = analyzeSentiment(text);
        const keyPoints = extractKeyPoints(text);
        const suggestions = generateSuggestions(text, category);
        const quality = assessQuality(text);

        const result = {
            success: true,
            title: generateTitle(text, keywords),
            summary,
            keywords,
            category,
            contentType,
            sentiment,
            keyPoints,
            suggestions,
            quality,
            wordCount: text.length,
            estimatedReadTime: Math.max(1, Math.ceil(text.length / 400)),
            tags: generateTags(keywords, category),
            autoGroup: suggestGroup(keywords, category),
            originalUrl: url,
            originalTitle: title,
            analysisNote: '书签提取内容分析完成'
        };

        res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>内容分析完成</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #eee; padding: 20px; max-width: 800px; margin: 0 auto; }
        .card { background: #16213e; border-radius: 12px; padding: 20px; margin-bottom: 15px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; margin-right: 8px; font-size: 0.85rem; }
        .study { background: rgba(16,185,129,0.2); color: #10b981; }
        .entertainment { background: rgba(236,72,153,0.2); color: #ec4899; }
        .health { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .summary { background: #0f172a; padding: 15px; border-radius: 8px; line-height: 1.6; margin: 10px 0; }
        .tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag { background: rgba(99,102,241,0.2); padding: 4px 10px; border-radius: 15px; font-size: 0.8rem; color: #818cf8; }
        .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
        .btn:hover { background: #4338ca; }
        .success { color: #10b981; font-size: 1.5rem; }
        h2 { margin: 0 0 10px 0; }
        .meta { color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px; }
    </style>
</head>
<body>
    <h2 class="success">✅ 内容分析完成</h2>
    <p class="meta">来源: ${escapeHtml(title || url || '未知')}</p>

    <div class="card">
        <span class="badge ${category.category}">${category.label}</span>
        <span class="badge" style="background: rgba(148,163,184,0.2); color: #94a3b8;">${contentType?.type || '一般'}</span>
        <span class="badge" style="background: rgba(16,185,129,0.2); color: #10b981;">${sentiment?.sentiment || '中性'}</span>
    </div>

    <div class="card">
        <h3>📌 摘要</h3>
        <div class="summary">${escapeHtml(summary)}</div>
    </div>

    <div class="card">
        <h3>🏷️ 标签</h3>
        <div class="tags">${result.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
    </div>

    ${keyPoints.length > 0 ? `
    <div class="card">
        <h3>💡 关键要点</h3>
        ${keyPoints.map(p => `<p>• ${escapeHtml(p.title)}: ${escapeHtml(p.content)}</p>`).join('')}
    </div>
    ` : ''}

    <div class="card">
        <h3>📊 内容信息</h3>
        <p>字数: ${result.wordCount} | 预计阅读: ${result.estimatedReadTime}分钟 | 关键词: ${keywords.length}个</p>
    </div>

    <a href="/" class="btn">打开知识管理系统 →</a>
</body>
</html>`);
    } catch (error) {
        console.error('Extracted error:', error);
        res.send('<html><body style="font-family:sans-serif;padding:20px;"><h2>❌ 分析失败</h2><a href="/">返回主页</a></body></html>');
    }
});

function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/extract', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'extract.html'));
});

app.get('/bookmarklet', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'bookmarklet.html'));
});

app.get('/learning.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'learning.html'));
});

app.get('/learning-v2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'learning-v2.html'));
});

app.get('/learning-simple.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'learning-simple.html'));
});

app.get('/learning-fixed.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'learning-fixed.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n===========================================\n`);
    console.log(`   知识收藏管理系统 AI版 已启动`);
    console.log(`   访问地址: http://localhost:${PORT}`);
    console.log(`   书签工具: http://localhost:${PORT}/bookmarklet`);
    console.log(`===========================================\n`);
});
