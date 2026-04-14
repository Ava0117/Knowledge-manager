let currentTab = 'learning';
let currentPage = 1;
let totalPages = 1;
let currentZoom = 100;
let currentSpotlightSize = 150;
let isPlaying = false;
let currentFile = null;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let voices = [];
let quizQuestions = [];
let currentQuestionIndex = 0;
let quizScore = 0;
let quizStartTime = null;
let questionHistory = [];
let currentDocumentText = '';
let currentAIGeneratedExplanation = '';
let glossaryList = [];
let answerHistory = [];
let reviewTopics = [];
let studyData = {
    mastered: [],
    learning: [],
    weak: [],
    examDate: null
};

let isInitialized = false;

window.onerror = function(msg, url, line) {
    console.error('JavaScript Error:', msg, 'at line', line);
};

document.addEventListener('DOMContentLoaded', function() {
    if (isInitialized) return;
    isInitialized = true;
    console.log('AI智能学习助手 loaded');
    loadStudyData();
    loadGlossary();
    loadAnswerHistory();
    loadReviewTopics();
    initVoices();
    initEventListeners();
    updateCountdown();
    renderReviewSummary();
    setInterval(updateCountdown, 60000);
});

function initVoices() {
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = function() {
            voices = speechSynthesis.getVoices();
            console.log('Voices loaded:', voices.length);
        };
    }
    voices = speechSynthesis.getVoices();
}

function initEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', function() {
            settingsModal.classList.remove('hidden');
        });
    }
    if (closeSettings && settingsModal) {
        closeSettings.addEventListener('click', function() {
            settingsModal.classList.add('hidden');
        });
    }

    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');

    if (uploadZone && fileInput) {
        uploadZone.addEventListener('click', function() {
            fileInput.click();
        });

        uploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleFile(this.files[0]);
            }
        });
    }

    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const closeViewerBtn = document.getElementById('close-viewer');
    const toggleSpotlightBtn = document.getElementById('toggle-spotlight');

    if (prevPageBtn) prevPageBtn.addEventListener('click', prevPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', nextPage);
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    if (closeViewerBtn) closeViewerBtn.addEventListener('click', closeViewer);
    if (toggleSpotlightBtn) toggleSpotlightBtn.addEventListener('click', toggleSpotlight);

    const voiceSelect = document.getElementById('voice-select');
    const speedSlider = document.getElementById('speed-slider');
    const spotlightSlider = document.getElementById('spotlight-slider');

    if (voiceSelect) voiceSelect.addEventListener('change', updateVoice);
    if (speedSlider) speedSlider.addEventListener('input', updateSpeed);
    if (spotlightSlider) spotlightSlider.addEventListener('input', updateSpotlight);

    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const replayBtn = document.getElementById('replay-btn');

    if (playBtn) playBtn.addEventListener('click', togglePlay);
    if (stopBtn) stopBtn.addEventListener('click', stopSpeech);
    if (replayBtn) replayBtn.addEventListener('click', replaySpeech);

    const startQuizBtn = document.getElementById('start-quiz');
    const submitAnswerBtn = document.getElementById('submit-answer');
    if (startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
    if (submitAnswerBtn) submitAnswerBtn.addEventListener('click', submitAnswer);

    document.querySelectorAll('.interactive-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const type = this.dataset.interactive;
            switchInteractiveTab(type);
        });
    });

    document.querySelectorAll('.sim-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.sim;
            switchSimulator(type);
        });
    });

    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const method = this.dataset.method;
            switchQuestionInputMethod(method);
        });
    });

    const analyzeQuestion = document.getElementById('analyze-question');
    if (analyzeQuestion) analyzeQuestion.addEventListener('click', analyzeQuestion);

    const questionFileZone = document.getElementById('question-file-zone');
    const questionFileInput = document.getElementById('question-file-input');
    const removeQuestionFile = document.getElementById('remove-question-file');

    if (questionFileZone && questionFileInput) {
        questionFileZone.addEventListener('click', function() {
            questionFileInput.click();
        });

        questionFileZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        questionFileZone.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });

        questionFileZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleQuestionFile(e.dataTransfer.files[0]);
            }
        });

        questionFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleQuestionFile(this.files[0]);
            }
        });
    }

    if (removeQuestionFile) {
        removeQuestionFile.addEventListener('click', function() {
            const filePreview = document.getElementById('question-file-preview');
            const fileZone = document.getElementById('question-file-zone');
            if (filePreview) filePreview.classList.add('hidden');
            if (fileZone) fileZone.classList.remove('hidden');
            if (questionFileInput) questionFileInput.value = '';
        });
    }

    const answerFileZone = document.getElementById('answer-file-zone');
    const answerFileInput = document.getElementById('answer-file-input');
    const removeAnswerFile = document.getElementById('remove-answer-file');

    if (answerFileZone && answerFileInput) {
        answerFileZone.addEventListener('click', function() {
            answerFileInput.click();
        });

        answerFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleAnswerFile(this.files[0]);
            }
        });
    }

    if (removeAnswerFile) {
        removeAnswerFile.addEventListener('click', function() {
            const filePreview = document.getElementById('answer-file-preview');
            const fileZone = document.getElementById('answer-file-zone');
            if (filePreview) filePreview.classList.add('hidden');
            if (fileZone) fileZone.classList.remove('hidden');
            if (answerFileInput) answerFileInput.value = '';
        });
    }

    const imageUploadZone = document.getElementById('image-upload-zone');
    const imageInput = document.getElementById('image-input');

    if (imageUploadZone && imageInput) {
        imageUploadZone.addEventListener('click', function() {
            imageInput.click();
        });

        imageInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleImageUpload(this.files[0]);
            }
        });
    }

    const removeImage = document.getElementById('remove-image');
    if (removeImage) {
        removeImage.addEventListener('click', function() {
            const imagePreview = document.getElementById('image-preview');
            const imageUploadZone = document.getElementById('image-upload-zone');
            if (imagePreview) imagePreview.classList.add('hidden');
            if (imageUploadZone) imageUploadZone.classList.remove('hidden');
            if (imageInput) imageInput.value = '';
        });
    }

    const saveExamDate = document.getElementById('save-exam-date');
    const generatePlan = document.getElementById('generate-plan');
    if (saveExamDate) saveExamDate.addEventListener('click', saveExamDate);
    if (generatePlan) generatePlan.addEventListener('click', generateReviewPlan);

    const clearData = document.getElementById('clear-data');
    const exportData = document.getElementById('export-data');
    if (clearData) clearData.addEventListener('click', clearAllData);
    if (exportData) exportData.addEventListener('click', exportData);

    const autoPlayToggle = document.getElementById('auto-play-toggle');
    const spotlightToggle = document.getElementById('spotlight-toggle');
    if (autoPlayToggle) {
        autoPlayToggle.addEventListener('change', function() {
            localStorage.setItem('autoPlay', this.checked);
        });
    }
    if (spotlightToggle) {
        spotlightToggle.addEventListener('change', function() {
            localStorage.setItem('spotlightEnabled', this.checked);
        });
    }

    loadSettings();
}

function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName + '-tab');
    });
}

function handleFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
        currentFile = file;
        loadPDF(file);
    } else if (extension === 'pptx') {
        currentFile = file;
        document.getElementById('upload-zone').classList.add('hidden');
        document.getElementById('viewer-toolbar').classList.remove('hidden');
        document.getElementById('viewer-container').classList.remove('hidden');
        alert('PPT文件已加载！您可以查看幻灯片内容。');
    } else {
        alert('仅支持PDF和PPTX文件');
    }
}

function loadPDF(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const typedarray = new Uint8Array(reader.result);
        pdfjsLib.getDocument(typedarray).promise.then(function(pdf) {
            totalPages = pdf.numPages;
            currentPage = 1;
            document.getElementById('total-pages').textContent = totalPages;
            renderPage(pdf, currentPage);
            document.getElementById('upload-zone').classList.add('hidden');
            document.getElementById('viewer-toolbar').classList.remove('hidden');
            document.getElementById('viewer-container').classList.remove('hidden');
            alert('PDF已加载，共 ' + totalPages + ' 页！');
        });
    };
    reader.readAsArrayBuffer(file);
}

async function renderPage(pdf, pageNum) {
    const page = await pdf.getPage(pageNum);
    const scale = currentZoom / 100;
    const viewport = page.getViewport({ scale: scale });

    const canvas = document.getElementById('content-canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
        canvasContext: context,
        viewport: viewport
    }).promise;

    document.getElementById('current-page').textContent = pageNum;

    if (document.getElementById('spotlight-toggle').checked) {
        setupSpotlight();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadCurrentPage();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadCurrentPage();
    }
}

async function loadCurrentPage() {
    const typedarray = new Uint8Array(await currentFile.arrayBuffer());
    const pdf = await pdfjsLib.getDocument(typedarray).promise;
    renderPage(pdf, currentPage);
}

function zoomIn() {
    if (currentZoom < 200) {
        currentZoom += 25;
        document.getElementById('zoom-level').textContent = currentZoom + '%';
        loadCurrentPage();
    }
}

function zoomOut() {
    if (currentZoom > 50) {
        currentZoom -= 25;
        document.getElementById('zoom-level').textContent = currentZoom + '%';
        loadCurrentPage();
    }
}

function closeViewer() {
    document.getElementById('content-viewer').classList.add('hidden');
    document.getElementById('upload-zone').classList.remove('hidden');
    currentFile = null;
}

function toggleSpotlight() {
    const overlay = document.getElementById('spotlight-overlay');
    overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
}

function setupSpotlight() {
    const overlay = document.getElementById('spotlight-overlay');
    const wrapper = document.getElementById('content-wrapper');

    wrapper.addEventListener('mousemove', function(e) {
        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        overlay.style.setProperty('--spotlight-x', x + '%');
        overlay.style.setProperty('--spotlight-y', y + '%');
        overlay.style.setProperty('background', `radial-gradient(circle ${currentSpotlightSize}px at ${x}% ${y}%, transparent 0%, rgba(0,0,0,0.8) 100%)`);
    });
}

function updateVoice() {
    const voiceSelect = document.getElementById('voice-select');
    const selectedIndex = parseInt(voiceSelect.value);
    localStorage.setItem('selectedVoice', selectedIndex);
}

function updateSpeed() {
    const speed = document.getElementById('speed-slider').value;
    document.getElementById('speed-value').textContent = speed + 'x';
    localStorage.setItem('speechSpeed', speed);
}

function updateSpotlight() {
    currentSpotlightSize = parseInt(document.getElementById('spotlight-slider').value);
    document.getElementById('spotlight-value').textContent = currentSpotlightSize + 'px';
    localStorage.setItem('spotlightSize', currentSpotlightSize);
}

function togglePlay() {
    if (isPlaying) {
        pauseSpeech();
    } else {
        playCurrentContent();
    }
}

function playCurrentContent() {
    if (!currentFile) {
        document.getElementById('ai-message').innerHTML = '<p>请先上传PDF或PPT文件</p>';
        return;
    }

    document.getElementById('ai-message').innerHTML = '<p><i class="fas fa-brain"></i> AI正在分析文档内容，生成讲解...</p>';
    document.getElementById('speaking-text').textContent = 'AI分析中...';
    document.querySelector('.waveform').classList.add('active');

    generateAIExplanation().then(function(explanation) {
        currentAIGeneratedExplanation = explanation;
        speakText(explanation);
        isPlaying = true;
        document.getElementById('play-btn').innerHTML = '<i class="fas fa-pause"></i>';
        document.querySelector('.waveform').classList.remove('paused');
        document.getElementById('speaking-text').textContent = 'AI讲解中...';
    }).catch(function(error) {
        console.error('AI讲解生成失败:', error);
        document.getElementById('ai-message').innerHTML = '<p>AI讲解生成失败，将直接阅读文档内容。</p>';
        speakText('抱歉，AI讲解生成失败。请检查网络连接后重试。');
    });
}

async function generateAIExplanation() {
    const text = await extractTextFromPDF();

    if (!text || text.trim().length < 10) {
        return '文档内容较少，建议您直接阅读PDF文件内容进行学习。';
    }

    const pageText = await extractCurrentPageText();
    const topic = analyzeTopic(pageText);
    const explanation = generateExplanation(pageText, topic);

    glossaryList = extractGlossary(pageText, topic);
    displayGlossary();

    return explanation;
}

function extractGlossary(text, topic) {
    const glossaryMap = {
        '函数': [
            { en: 'Function', zh: '函数', definition: '描述两个变量之间对应关系的基本概念' },
            { en: 'Domain', zh: '定义域', definition: '函数有意义的自变量取值范围' },
            { en: 'Range', zh: '值域', definition: '函数所有可能输出的集合' },
            { en: 'Monotonic', zh: '单调性', definition: '函数随自变量增加时的增减趋势' },
            { en: 'Parity', zh: '奇偶性', definition: '函数的对称性质' },
            { en: 'Even Function', zh: '偶函数', definition: '满足f(-x)=f(x)的函数' },
            { en: 'Odd Function', zh: '奇函数', definition: '满足f(-x)=-f(x)的函数' },
            { en: 'Linear Function', zh: '一次函数', definition: '形如f(x)=ax+b的函数' },
            { en: 'Quadratic Function', zh: '二次函数', definition: '形如f(x)=ax²+bx+c的函数' }
        ],
        '极限': [
            { en: 'Limit', zh: '极限', definition: '描述变量趋近于某值时的趋势' },
            { en: 'Convergent', zh: '收敛', definition: '数列或函数趋向于某一有限值' },
            { en: 'Divergent', zh: '发散', definition: '数列或函数不趋向于有限值' },
            { en: 'Infinity', zh: '无穷', definition: '没有界限的数量概念' },
            { en: 'Approach', zh: '趋近', definition: '变量无限接近某值的过程' },
            { en: 'Left-hand Limit', zh: '左极限', definition: '从左侧趋近时的极限值' },
            { en: 'Right-hand Limit', zh: '右极限', definition: '从右侧趋近时的极限值' }
        ],
        '导数': [
            { en: 'Derivative', zh: '导数', definition: '函数瞬时变化率的极限' },
            { en: 'Differential', zh: '微分', definition: '函数增量的线性主部' },
            { en: 'Chain Rule', zh: '链式法则', definition: '复合函数求导的法则' },
            { en: 'Product Rule', zh: '乘积法则', definition: '函数乘积的求导法则' },
            { en: 'Quotient Rule', zh: '商法则', definition: '函数商的求导法则' },
            { en: 'Extreme Value', zh: '极值', definition: '函数的局部最大或最小值' },
            { en: 'Critical Point', zh: '驻点', definition: '导数为零或不存在的点' },
            { en: 'Inflection Point', zh: '拐点', definition: '函数凹凸性改变的点' }
        ],
        '积分': [
            { en: 'Integral', zh: '积分', definition: '微分的逆运算' },
            { en: 'Antiderivative', zh: '原函数', definition: '导数为给定函数的函数' },
            { en: 'Definite Integral', zh: '定积分', definition: '有上下限的积分,表示面积' },
            { en: 'Indefinite Integral', zh: '不定积分', definition: '没有上下限的积分,结果含常数' },
            { en: 'Integration by Parts', zh: '分部积分', definition: '积分的一种基本方法' },
            { en: 'Substitution', zh: '换元积分', definition: '通过变量替换来计算积分' },
            { en: 'Area', zh: '面积', definition: '平面图形的大小' }
        ],
        '概率': [
            { en: 'Probability', zh: '概率', definition: '事件发生的可能性度量' },
            { en: 'Random Variable', zh: '随机变量', definition: '取随机值的变量' },
            { en: 'Expectation', zh: '期望', definition: '随机变量的平均值' },
            { en: 'Variance', zh: '方差', definition: '随机变量偏离期望的程度' },
            { en: 'Standard Deviation', zh: '标准差', definition: '方差的平方根' },
            { en: 'Distribution', zh: '分布', definition: '随机变量取值的概率规律' },
            { en: 'Normal Distribution', zh: '正态分布', definition: '一种常见的连续分布' },
            { en: 'Conditional Probability', zh: '条件概率', definition: '在某条件下事件发生的概率' }
        ],
        '数列': [
            { en: 'Sequence', zh: '数列', definition: '按一定顺序排列的一列数' },
            { en: 'Arithmetic Sequence', zh: '等差数列', definition: '相邻两项之差相等的数列' },
            { en: 'Geometric Sequence', zh: '等比数列', definition: '相邻两项之比相等的数列' },
            { en: 'General Term', zh: '通项', definition: '数列第n项的表达式' },
            { en: 'Series', zh: '级数', definition: '数列各项之和' },
            { en: 'Arithmetic Mean', zh: '等差中项', definition: '等差数列中间的一项' },
            { en: 'Geometric Mean', zh: '等比中项', definition: '等比数列中间的一项' }
        ],
        '几何': [
            { en: 'Geometry', zh: '几何', definition: '研究空间图形性质的学科' },
            { en: 'Triangle', zh: '三角形', definition: '三条线段围成的图形' },
            { en: 'Circle', zh: '圆', definition: '到定点距离相等的点的集合' },
            { en: 'Area', zh: '面积', definition: '平面图形的大小' },
            { en: 'Volume', zh: '体积', definition: '立体图形所占空间的大小' },
            { en: 'Angle', zh: '角度', definition: '两条射线之间的夹角' },
            { en: 'Pythagorean Theorem', zh: '勾股定理', definition: '直角三角形三边的关系' },
            { en: 'Congruent', zh: '全等', definition: '形状和大小完全相同' },
            { en: 'Similar', zh: '相似', definition: '形状相同但大小成比例' }
        ],
        '代数': [
            { en: 'Algebra', zh: '代数', definition: '用字母表示数进行运算的数学分支' },
            { en: 'Equation', zh: '方程', definition: '含有未知数的等式' },
            { en: 'Inequality', zh: '不等式', definition: '表示大小关系的式子' },
            { en: 'Polynomial', zh: '多项式', definition: '多个单项式的和' },
            { en: 'Root', zh: '根', definition: '方程的解' },
            { en: 'Factor', zh: '因式', definition: '能整除多项式的表达式' },
            { en: 'Factoring', zh: '因式分解', definition: '把多项式化成因式乘积的过程' },
            { en: 'Quadratic Equation', zh: '二次方程', definition: '未知数最高次数为2的方程' }
        ]
    };

    const topicGlossary = glossaryMap[topic] || glossaryMap['函数'];
    glossaryList = topicGlossary;
    saveGlossary();
    return topicGlossary;
}

function displayGlossary() {
    if (!glossaryList || glossaryList.length === 0) return;

    const aiMessage = document.getElementById('ai-message');
    const glossaryHTML = `
        <div class="glossary-container">
            <h4 class="glossary-title"><i class="fas fa-book"></i> 本章重要名词中英对照</h4>
            <table class="glossary-table">
                <thead>
                    <tr>
                        <th>英文</th>
                        <th>中文</th>
                        <th>定义</th>
                    </tr>
                </thead>
                <tbody>
                    ${glossaryList.map(item => `
                        <tr>
                            <td><strong>${item.en}</strong></td>
                            <td>${item.zh}</td>
                            <td>${item.definition}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    aiMessage.innerHTML += glossaryHTML;
}

function saveGlossary() {
    localStorage.setItem('glossaryList', JSON.stringify(glossaryList));
}

function loadGlossary() {
    const saved = localStorage.getItem('glossaryList');
    if (saved) {
        glossaryList = JSON.parse(saved);
    }
}

async function extractCurrentPageText() {
    if (!currentFile) return '';

    try {
        const typedarray = new Uint8Array(await currentFile.arrayBuffer());
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const page = await pdf.getPage(currentPage);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        return pageText;
    } catch (error) {
        console.error('Error extracting page text:', error);
        return '';
    }
}

function analyzeTopic(text) {
    const keywords = {
        '函数': ['函数', 'f(x)', 'y=', '定义域', '值域', '单调', '奇偶'],
        '极限': ['极限', 'lim', '趋近', '无穷', '收敛', '发散'],
        '导数': ['导数', '微分', '求导', 'dy/dx', '导函数', '极值'],
        '积分': ['积分', '不定积分', '定积分', '原函数', '面积', '微积分'],
        '概率': ['概率', '随机', '期望', '方差', '分布', '统计'],
        '数列': ['数列', '通项', '求和', '等差', '等比', '递推'],
        '几何': ['几何', '图形', '面积', '体积', '角度', '证明'],
        '代数': ['代数', '方程', '不等式', '多项式', '因式', '根']
    };

    let maxCount = 0;
    let detectedTopic = '基础知识';

    for (const [topic, words] of Object.entries(keywords)) {
        let count = 0;
        for (const word of words) {
            if (text.includes(word)) count++;
        }
        if (count > maxCount) {
            maxCount = count;
            detectedTopic = topic;
        }
    }

    return detectedTopic;
}

function generateExplanation(text, topic) {
    const templates = {
        '函数': `欢迎学习函数内容！

本页面讲解的是【${topic}】相关的知识。

首先，让我们理解这个概念的核心要点：

第一点：定义与基本性质
函数是数学中最基本的概念之一，它描述了两个变量之间的对应关系。理解函数的定义是学习高等数学的基础。

第二点：重要性质
在学习函数时，需要掌握以下几个重要性质：
- 定义域：函数有意义的x的取值范围
- 值域：函数所有可能取值的集合
- 单调性：函数随自变量增加时的增减趋势
- 奇偶性：函数的对称性质

第三点：实际应用
函数在实际生活中有广泛应用，比如物理中的运动方程、经济学中的成本函数等。

第四点：学习建议
建议您：
1. 理解概念定义，不要死记硬背
2. 多做练习题来巩固理解
3. 注意归纳总结各类题型的解法
4. 建立知识点之间的联系

现在请集中注意力，我来为您详细讲解每个知识点...`,

        '极限': `欢迎学习极限内容！

本页面讲解的是【${topic}】相关的知识。

极限是高等数学最基本的概念之一，它是微分和积分的基础。

第一点：极限的概念
极限描述的是当自变量趋近于某个值时，函数值的趋近趋势。理解极限的 epsilon-delta 定义很重要。

第二点：极限的运算法则
极限有以下几个重要运算法则：
- 加减法：lim(f+g) = lim f + lim g
- 乘法：lim(f·g) = lim f · lim g
- 除法：lim(f/g) = lim f / lim g（分母极限不为零）

第三点：常见极限类型
需要掌握几种常见的极限类型：
- 多项式函数的极限
- 分式函数的极限
- 根式函数的极限
- 三角函数的极限

第四点：学习技巧
学习极限的建议：
1. 理解概念本质，而不是机械计算
2. 掌握化简技巧，如因式分解、有理化等
3. 注意极限存在与不存在的区别
4.多做典型例题来加深理解

让我们开始详细讲解...`,

        '导数': `欢迎学习导数内容！

本页面讲解的是【${topic}】相关的知识。

导数是微积分的核心概念之一，它描述了函数的瞬时变化率。

第一点：导数的定义
导数是函数值增量与自变量增量之比的极限，即：
f'(x) = lim(Δx→0) [f(x+Δx) - f(x)] / Δx
这反映了函数的瞬时变化速率。

第二点：求导法则
常用求导法则包括：
- 基本求导公式：幂函数、指数函数、对数函数、三角函数等
- 四则运算求导：和差积商的求导规则
- 复合函数求导：链式法则

第三点：导数的应用
导数在实际中有广泛应用：
- 求函数的极值和最值
- 解决优化问题
- 分析函数图像的性质
- 物理中的瞬时速度和加速度

第四点：学习建议
1. 熟记基本求导公式
2. 多练习复合函数的求导
3. 理解导数的几何意义（切线斜率）
4. 注意导数存在与连续的关系

让我们开始详细讲解...`,

        '积分': `欢迎学习积分内容！

本页面讲解的是【${topic}】相关的知识。

积分是微积分的另一个核心概念，它与导数互为逆运算。

第一点：不定积分
不定积分是求原函数的过程：
∫f(x)dx = F(x) + C
其中F'(x) = f(x)，C为常数。

第二点：定积分
定积分计算的是曲线下的面积：
∫[a,b] f(x)dx = F(b) - F(a)
这有明确的几何和物理意义。

第三点：积分方法
常用积分方法包括：
- 直接积分法
- 换元积分法
- 分部积分法
- 有理函数积分

第四点：积分的应用
积分在实际中应用广泛：
- 计算不规则图形的面积
- 计算旋转体的体积
- 物理中的功和能
- 概率论中的分布函数

第五点：学习建议
1. 理解积分与导数的逆关系
2. 熟记基本积分公式
3. 多做练习，熟练掌握各种积分技巧
4. 注意定积分与不定积分的区别

让我们开始详细讲解...`,

        '概率': `欢迎学习概率论内容！

本页面讲解的是【${topic}】相关的知识。

概率论是研究随机现象数量规律的一门学科。

第一点：基本概念
概率论中有几个基本概念：
- 随机实验：具有明确结果集的实验
- 样本空间：所有可能结果的集合
- 事件：样本空间的子集
- 概率：事件发生的可能性度量

第二点：概率的计算
概率的计算遵循以下法则：
- 加法公式：P(A∪B) = P(A) + P(B) - P(A∩B)
- 乘法公式：P(AB) = P(A)P(B|A)
- 条件概率：P(A|B) = P(AB)/P(B)

第三点：随机变量
随机变量是将随机实验结果数量化的函数：
- 离散型随机变量：取值可数的随机变量
- 连续型随机变量：取值在区间的随机变量

第四点：数字特征
重要的数字特征包括：
- 数学期望：随机变量的平均值
- 方差：随机变量偏离期望的程度
- 标准差：方差的平方根

第五点：学习建议
1. 理解概率的本质意义
2. 掌握概率论的基本公式
3. 学会用概率论思维分析问题
4. 多做实际应用题

让我们开始详细讲解...`,

        '数列': `欢迎学习数列内容！

本页面讲解的是【${topic}】相关的知识。

数列是按一定规律排列的一列数，是数学中的重要概念。

第一点：数列的概念
数列是定义在自然数集上的函数：
a₁, a₂, a₃, ..., aₙ, ...
数列的通项公式给出了第n项与n的关系。

第二点：等差数列
等差数列的特点是相邻两项之差相等：
aₙ₊₁ - aₙ = d（公差）
通项公式：aₙ = a₁ + (n-1)d
前n项和：Sₙ = n(a₁+aₙ)/2

第三点：等比数列
等比数列的特点是相邻两项之比相等：
aₙ₊₁/aₙ = q（公比）
通项公式：aₙ = a₁·qⁿ⁻¹
前n项和：Sₙ = a₁(1-qⁿ)/(1-q)（q≠1）

第四点：数列极限
数列极限描述的是数列的趋势：
lim aₙ = a (n→∞)
收敛数列一定有界，但有界数列不一定收敛。

第五点：学习建议
1. 熟练掌握等差数列和等比数列的公式
2. 学会根据已知条件求通项公式
3. 注意区分不同类型的数列
4. 多做综合题提高解题能力

让我们开始详细讲解...`,

        '几何': `欢迎学习几何内容！

本页面讲解的是【${topic}】相关的知识。

几何学研究的是空间图形的性质和关系。

第一点：平面几何基础
平面几何研究平面上的图形：
- 点、线、面的基本性质
- 角度的测量和计算
- 三角形的全等和相似
- 圆的性质

第二点：重要定理
几何学中有几个重要定理：
- 勾股定理：直角三角形三边的关系
- 三角形内角和定理
- 平行线判定定理
- 圆周角定理

第三点：面积和周长
平面图形的重要计算：
- 矩形：面积=长×宽
- 三角形：面积=底×高÷2
- 圆形：面积=πr²，周长=2πr
- 梯形、平行四边形等特殊图形

第四点：立体几何
立体几何研究三维空间图形：
- 长方体、正方体、圆柱、圆锥、球
- 体积和表面积的计算
- 空间中直线与平面的关系

第五点：学习建议
1. 理解和记忆基本定理
2. 掌握常见图形的性质
3. 多画图帮助理解
4. 注重定理的应用条件

让我们开始详细讲解...`,

        '代数': `欢迎学习代数内容！

本页面讲解的是【${topic}】相关的知识。

代数是数学的重要分支，用字母和符号表示数进行运算。

第一点：方程与方程组
代数研究的核心内容之一：
- 一元一次方程：一元二次方程
- 二元一次方程组
- 一元二次方程：ax²+bx+c=0
- 方程的解法：配方法、公式法、因式分解法

第二点：不等式
不等式描述的是数量的大小关系：
- 一元一次不等式
- 一元二次不等式
- 不等式的性质：传递性、加减性、乘法性
- 不等式与方程的联系和区别

第三点：多项式
多项式是代数的重要内容：
- 多项式的加减乘除运算
- 因式分解的方法
- 余数定理和因式定理
- 多项式的根与系数的关系

第四点：学习建议
1. 熟练掌握各类方程的解法
2. 注意方程与不等式的区别
3. 多做练习提高计算能力
4. 学会归纳总结解题方法

让我们开始详细讲解...`
    };

    const baseExplanation = templates[topic] || `欢迎开始学习！

本页面讲解的是【${topic}】相关的知识。

现在让我们来详细学习这个内容。

首先，请仔细阅读页面上的内容。这是学习的核心材料，包含了需要掌握的基本概念和重要知识点。

在学习过程中，建议您注意以下几点：

第一：理解基本概念
每一个数学概念都有其形成的背景和意义，理解这些背景可以帮助您更好地掌握概念的本质。

第二：掌握基本公式和定理
数学学习离不开公式和定理，需要在理解的基础上熟记，并在解题中灵活运用。

第三：多做练习
数学能力的提高离不开大量的练习，通过做题可以加深对知识的理解，发现自己的薄弱环节。

第四：及时总结
每学完一个知识点，要及时总结归纳，形成自己的知识体系。

现在，请跟随我的讲解，一起深入学习这个内容...`;

    return baseExplanation;
}

async function extractTextFromPDF() {
    if (!currentFile) return '';

    try {
        const typedarray = new Uint8Array(await currentFile.arrayBuffer());
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            text += pageText + '\n\n';
        }

        return text;
    } catch (error) {
        console.error('Error extracting text:', error);
        return '无法提取PDF内容，请尝试手动阅读';
    }
}

function speakText(text) {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    currentUtterance = new SpeechSynthesisUtterance(text);

    const voiceSelect = document.getElementById('voice-select');
    const selectedIndex = parseInt(voiceSelect.value);
    if (voices[selectedIndex]) {
        currentUtterance.voice = voices[selectedIndex];
    }

    currentUtterance.rate = parseFloat(document.getElementById('speed-slider').value);
    currentUtterance.pitch = 1;

    currentUtterance.onend = function() {
        isPlaying = false;
        document.getElementById('play-btn').innerHTML = '<i class="fas fa-play"></i>';
        document.querySelector('.waveform').classList.add('paused');
        document.getElementById('speaking-text').textContent = '已完成';
    };

    currentUtterance.onerror = function() {
        isPlaying = false;
        document.getElementById('speaking-text').textContent = '播放出错';
    };

    speechSynthesis.speak(currentUtterance);
}

function pauseSpeech() {
    if (speechSynthesis.speaking) {
        speechSynthesis.pause();
        isPlaying = false;
        document.getElementById('play-btn').innerHTML = '<i class="fas fa-play"></i>';
        document.querySelector('.waveform').classList.add('paused');
        document.getElementById('speaking-text').textContent = '已暂停';
    }
}

function stopSpeech() {
    speechSynthesis.cancel();
    isPlaying = false;
    document.getElementById('play-btn').innerHTML = '<i class="fas fa-play"></i>';
    document.querySelector('.waveform').classList.add('paused');
    document.getElementById('speaking-text').textContent = '已停止';
}

function replaySpeech() {
    stopSpeech();
    playCurrentContent();
}

function switchInteractiveTab(type) {
    document.querySelectorAll('.interactive-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.interactive === type);
    });
    document.getElementById('flowchart-container').classList.toggle('hidden', type !== 'flowchart');
    document.getElementById('simulator-container').classList.toggle('hidden', type !== 'simulator');

    if (type === 'flowchart') {
        initFlowchart();
    }
}

function initFlowchart() {
    const canvas = document.getElementById('flowchart-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '14px Noto Sans SC';
    ctx.fillStyle = '#f1f5f9';

    const centerX = canvas.width / 2;
    let y = 50;

    ctx.beginPath();
    ctx.roundRect(centerX - 100, y, 200, 40, 8);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('开始学习', centerX, y + 25);

    y += 70;
    ctx.beginPath();
    ctx.roundRect(centerX - 100, y, 200, 40, 8);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('上传PDF/PPT', centerX, y + 25);

    y += 70;
    ctx.beginPath();
    ctx.roundRect(centerX - 100, y, 200, 40, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('AI讲解内容', centerX, y + 25);

    y += 70;
    ctx.beginPath();
    ctx.roundRect(centerX - 100, y, 200, 40, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('做练习测验', centerX, y + 25);

    y += 70;
    ctx.beginPath();
    ctx.roundRect(centerX - 100, y, 200, 40, 8);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('复习薄弱点', centerX, y + 25);
}

function switchSimulator(type) {
    document.querySelectorAll('.sim-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sim === type);
    });

    const panel = document.getElementById('simulator-panel');

    if (type === 'function') {
        panel.innerHTML = `
            <div class="sim-input">
                <label>输入函数（例如：x^2, sin(x), cos(2x）</label>
                <input type="text" id="function-input" placeholder="输入数学函数" value="x^2">
                <button class="btn-primary" onclick="drawFunction()">绘制</button>
            </div>
            <canvas id="function-canvas" width="600" height="300"></canvas>
        `;
        drawFunction();
    } else {
        panel.innerHTML = `
            <div class="calculator-sim">
                <p>基础计算模拟器</p>
                <input type="text" id="calc-input" placeholder="输入表达式">
                <button class="btn-primary" onclick="calculate()">计算</button>
                <div id="calc-result"></div>
            </div>
        `;
    }
}

function drawFunction() {
    const input = document.getElementById('function-input');
    if (!input) return;

    const expr = input.value;
    const canvas = document.getElementById('function-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.lineWidth = 2;

    for (let x = 0; x < canvas.width; x++) {
        const xVal = (x - canvas.width / 2) / 20;
        try {
            const yVal = eval(expr.replace(/x/g, '(' + xVal + ')'));
            const y = canvas.height / 2 - yVal * 20;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        } catch (e) {}
    }
    ctx.stroke();
}

function calculate() {
    const input = document.getElementById('calc-input');
    const result = document.getElementById('calc-result');
    if (!input || !result) return;

    try {
        const answer = eval(input.value);
        result.textContent = '= ' + answer;
    } catch (e) {
        result.textContent = '无效表达式';
    }
}

function startQuiz() {
    const count = parseInt(document.getElementById('question-count').value);
    const types = Array.from(document.querySelectorAll('.checkbox-label input:checked')).map(cb => cb.value);

    quizQuestions = generateQuestions(count, types);
    currentQuestionIndex = 0;
    quizScore = 0;
    quizStartTime = Date.now();

    document.getElementById('quiz-stats').classList.remove('show');
    document.getElementById('quiz-start-screen').classList.add('hidden');
    document.getElementById('quiz-question').classList.remove('hidden');
    document.getElementById('quiz-question').classList.add('show');
    document.getElementById('quiz-feedback').classList.remove('show');

    showQuestion();
}

function generateQuestions(count, types) {
    const questions = [];
    const sampleTopics = ['函数', '极限', '导数', '积分', '概率', '数列', '几何', '代数'];

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        questions.push({
            type: type,
            topic: sampleTopics[Math.floor(Math.random() * sampleTopics.length)],
            content: generateQuestionContent(type),
            options: generateOptions(type),
            answer: 0
        });
    }

    return questions;
}

function generateQuestionContent(type) {
    const templates = {
        single: [
            '下列关于函数的性质说法正确的是？',
            '极限存在的前提条件是？',
            '导数的几何意义是？',
            '积分的基本性质是？'
        ],
        multiple: [
            '下列哪些是求导的常用法则？（多选）',
            '函数连续的条件包括？（多选）',
            '下列哪些属于不定积分的性质？（多选）'
        ],
        judge: [
            '函数在某点可导则一定在该点连续。',
            '所有函数都有原函数。',
            '极限运算法则适用于所有情况。'
        ],
        blank: [
            '函数f(x)在x₀处的导数定义为________。',
            '定积分的几何意义是________。',
            '概率的加法公式适用于________事件。'
        ]
    };

    const templatesForType = templates[type] || templates.single;
    return templatesForType[Math.floor(Math.random() * templatesForType.length)];
}

function generateOptions(type) {
    if (type === 'single' || type === 'multiple') {
        return [
            { letter: 'A', text: '选项A的内容', correct: true },
            { letter: 'B', text: '选项B的内容', correct: false },
            { letter: 'C', text: '选项C的内容', correct: false },
            { letter: 'D', text: '选项D的内容', correct: false }
        ];
    }
    return [];
}

function showQuestion() {
    const question = quizQuestions[currentQuestionIndex];
    document.getElementById('question-number').textContent = '第 ' + (currentQuestionIndex + 1) + ' 题';
    document.getElementById('question-type').textContent = getQuestionTypeName(question.type);
    document.getElementById('question-score').textContent = '10分';
    document.getElementById('question-content').textContent = question.content;

    const optionsContainer = document.getElementById('question-options');
    optionsContainer.innerHTML = '';

    if (question.type === 'blank') {
        optionsContainer.innerHTML = '<input type="text" class="blank-input" placeholder="请输入答案">';
    } else {
        question.options.forEach((option, index) => {
            const div = document.createElement('div');
            div.className = 'option-item';
            div.innerHTML = '<span class="option-letter">' + option.letter + '</span><span class="option-text">' + option.text + '</span>';
            div.addEventListener('click', function() {
                selectOption(index);
            });
            optionsContainer.appendChild(div);
        });
    }
}

function getQuestionTypeName(type) {
    const names = {
        single: '单选题',
        multiple: '多选题',
        judge: '判断题',
        blank: '填空题'
    };
    return names[type] || '单选题';
}

function selectOption(index) {
    document.querySelectorAll('.option-item').forEach((item, i) => {
        item.classList.toggle('selected', i === index);
    });
}

function submitAnswer() {
    const question = quizQuestions[currentQuestionIndex];
    let isCorrect = false;

    if (question.type === 'blank') {
        const input = document.querySelector('.blank-input');
        isCorrect = input && input.value.trim() !== '';
    } else {
        const selected = document.querySelector('.option-item.selected');
        if (selected) {
            const selectedIndex = Array.from(document.querySelectorAll('.option-item')).indexOf(selected);
            isCorrect = question.options[selectedIndex]?.correct;
        }
    }

    showFeedback(isCorrect, question);
}

function showFeedback(isCorrect, question) {
    document.getElementById('quiz-question').classList.remove('show');
    document.getElementById('quiz-feedback').classList.add('show');
    document.getElementById('quiz-feedback').classList.add('show');

    const icon = document.getElementById('feedback-icon');
    icon.className = 'feedback-icon ' + (isCorrect ? 'correct' : 'incorrect');
    icon.innerHTML = isCorrect ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>';

    document.getElementById('feedback-title').textContent = isCorrect ? '回答正确！' : '回答错误';
    document.getElementById('feedback-text').textContent = isCorrect ? '太棒了！继续下一题。' : '别灰心，复习一下相关知识点吧。';

    if (isCorrect) {
        quizScore += 10;
    }
}

function skipQuestion() {
    nextQuestion();
}

function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex >= quizQuestions.length) {
        finishQuiz();
    } else {
        document.getElementById('quiz-question').classList.add('show');
        document.getElementById('quiz-question').classList.remove('hidden');
        document.getElementById('quiz-feedback').classList.remove('show');
        showQuestion();
    }
}

function finishQuiz() {
    const totalTime = Math.floor((Date.now() - quizStartTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;

    document.getElementById('quiz-question').classList.add('hidden');
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('quiz-start-screen').classList.remove('hidden');

    document.getElementById('quiz-stats').classList.add('show');
    document.getElementById('accuracy-value').textContent = Math.round((quizScore / (quizQuestions.length * 10)) * 100) + '%';
    document.getElementById('time-value').textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

    updateStudyData();
}

function updateStudyData() {
    studyData.weak = quizQuestions.filter((q, i) => {
        return true;
    }).map(q => q.topic);

    saveStudyData();
}

function switchQuestionInputMethod(method) {
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });
    document.getElementById('text-input-area').classList.toggle('hidden', method !== 'text');
    document.getElementById('file-input-area').classList.toggle('hidden', method !== 'file');
}

function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('uploaded-image').src = e.target.result;
        document.getElementById('image-preview').classList.remove('hidden');
        document.getElementById('image-upload-zone').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

let currentQuestionFile = null;

function handleQuestionFile(file) {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        alert('仅支持 PDF 和 Word (.docx) 文件');
        return;
    }

    currentQuestionFile = file;
    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(1);

    document.getElementById('question-file-name').textContent = fileName + ' (' + fileSize + 'KB)';
    document.getElementById('question-file-preview').classList.remove('hidden');
    document.getElementById('question-file-zone').classList.add('hidden');
}

let currentAnswerFile = null;

function handleAnswerFile(file) {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        alert('仅支持 PDF 和 Word (.docx) 文件');
        return;
    }

    currentAnswerFile = file;
    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(1);

    document.getElementById('answer-file-name').textContent = fileName + ' (' + fileSize + 'KB)';
    document.getElementById('answer-file-preview').classList.remove('hidden');
    document.getElementById('answer-file-zone').classList.add('hidden');

    extractTextFromAnswerFile(file).then(answerText => {
        if (answerText) {
            const answerInput = document.getElementById('answer-key-input');
            if (answerInput) {
                answerInput.placeholder = '已从答案文件中提取: ' + answerText.substring(0, 50) + '...';
                answerInput.value = answerText;
            }
        }
    });
}

async function extractTextFromAnswerFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            return fullText;
        } catch (error) {
            console.error('PDF解析失败:', error);
            return null;
        }
    } else if (extension === 'docx') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const unziped = await JSZip.loadAsync(arrayBuffer);
            const documentXml = await unziped.file('word/document.xml').async('text');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
            const textNodes = xmlDoc.getElementsByTagName('w:t');
            let text = '';

            for (let i = 0; i < textNodes.length; i++) {
                text += textNodes[i].textContent + ' ';
            }

            return text;
        } catch (error) {
            console.error('Word解析失败:', error);
            return null;
        }
    }

    return null;
}

async function extractTextFromQuestionFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            return fullText;
        } catch (error) {
            console.error('PDF解析失败:', error);
            return null;
        }
    } else if (extension === 'docx') {
        return await extractTextFromDocx(file);
    }

    return null;
}

async function extractTextFromDocx(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const unziped = await JSZip.loadAsync(arrayBuffer);
        const documentXml = await unziped.file('word/document.xml').async('text');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
        const textNodes = xmlDoc.getElementsByTagName('w:t');
        let text = '';

        for (let i = 0; i < textNodes.length; i++) {
            text += textNodes[i].textContent + ' ';
        }

        return text;
    } catch (error) {
        console.error('Word解析失败:', error);
        return null;
    }
}

async function analyzeQuestion() {
    const method = document.querySelector('.method-btn.active').dataset.method;
    let content = '';
    let userAnswer = '';
    let answerKey = '';

    if (method === 'text') {
        content = document.getElementById('question-text-input').value.trim();
        userAnswer = document.getElementById('answer-input')?.value.trim() || '';
    } else if (method === 'file') {
        if (!currentQuestionFile) {
            alert('请先上传题目文件');
            return;
        }

        const resultDiv = document.getElementById('analysis-result');
        resultDiv.innerHTML = `
            <div class="analysis-content">
                <h3><i class="fas fa-spinner fa-spin"></i> 正在解析文件...</h3>
                <p>请稍候，正在从 ${currentQuestionFile.name} 提取题目内容</p>
            </div>
        `;

        const extractedText = await extractTextFromQuestionFile(currentQuestionFile);
        if (!extractedText) {
            alert('文件解析失败，请确保文件是有效的PDF或Word文档');
            return;
        }

        content = extractedText;
        answerKey = document.getElementById('answer-key-input')?.value.trim() || '';
    }

    if (!content.trim()) {
        alert('请输入题目内容或上传题目文件');
        return;
    }

    const result = document.getElementById('analysis-result');
    const topic = analyzeTopic(content);
    const hasUserAnswer = userAnswer.length > 0;
    const hasAnswerKey = answerKey.length > 0;

    let userAnswerSection = '';
    if (hasUserAnswer) {
        userAnswerSection = `
            <div class="answer-input-section" style="margin-top: 16px;">
                <h4><i class="fas fa-user"></i> 您的答案:</h4>
                <p style="padding: 12px; background: var(--surface-light); border-radius: 8px; margin: 8px 0;">${userAnswer}</p>
            </div>
        `;
    } else {
        userAnswerSection = `
            <div class="answer-input-section" style="margin-top: 16px;">
                <h4><i class="fas fa-edit"></i> 请输入您的答案</h4>
                <textarea id="user-answer-input" placeholder="在这里输入您的答案..."></textarea>
            </div>
        `;
    }

    let answerKeySection = '';
    if (hasAnswerKey) {
        answerKeySection = `
            <div style="margin-top: 12px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                <h5 style="color: var(--success);"><i class="fas fa-key"></i> 正确答案:</h5>
                <p style="margin-top: 4px;">${answerKey}</p>
            </div>
        `;
    }

    result.innerHTML = `
        <div class="analysis-content">
            <h3><i class="fas fa-pencil-alt"></i> 题目分析</h3>
            <div class="question-display">
                <p class="question-text" style="white-space: pre-wrap; line-height: 1.8;">${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}</p>
            </div>
            ${userAnswerSection}
            ${answerKeySection}
            <button class="btn btn-primary" onclick="checkAnswer('${escapeHtml(content.substring(0, 500))}', '${escapeHtml(userAnswer)}', '${escapeHtml(answerKey)}')" style="margin-top: 16px;">
                <i class="fas fa-check"></i> 开始分析
            </button>
            <div id="answer-feedback"></div>
        </div>
    `;

    addToHistory(content.substring(0, 100));
}

function escapeHtml(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function checkAnswer(question, userAnswerParam, answerKeyParam) {
    const userAnswer = userAnswerParam || document.getElementById('user-answer-input')?.value.trim() || '';
    const answerKey = answerKeyParam || '';

    if (!userAnswer && !answerKey) {
        alert('请输入您的答案或提供正确答案');
        return;
    }

    const feedback = document.getElementById('answer-feedback');
    const topic = analyzeTopic(question);
    let correctAnswer = answerKey || generateCorrectAnswer(question);
    let isCorrect = false;

    if (answerKey && userAnswer) {
        isCorrect = compareAnswers(userAnswer, answerKey);
    } else {
        isCorrect = evaluateAnswer(userAnswer, correctAnswer, topic);
    }

    const resultClass = isCorrect ? 'correct' : 'incorrect';
    const resultIcon = isCorrect ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
    const resultTitle = isCorrect ? '回答正确！🎉' : '回答有误';
    const resultText = isCorrect ?
        '您的答案正确！很好！' :
        '您的答案与参考答案不完全一致，请查看下面的详细分析和相关知识点。';

    let comparisonSection = '';
    if (userAnswer && answerKey) {
        comparisonSection = `
            <div class="answer-comparison">
                <div class="comparison-item">
                    <h5><i class="fas fa-user"></i> 您的答案:</h5>
                    <p style="color: ${isCorrect ? 'var(--success)' : 'var(--error)'};">${userAnswer}</p>
                </div>
                <div class="comparison-item">
                    <h5><i class="fas fa-key"></i> 正确答案:</h5>
                    <p style="color: var(--success);">${answerKey}</p>
                </div>
            </div>
        `;
    } else if (userAnswer) {
        comparisonSection = `
            <div class="answer-comparison">
                <div class="comparison-item">
                    <h5><i class="fas fa-user"></i> 您的答案:</h5>
                    <p>${userAnswer}</p>
                </div>
                <div class="comparison-item">
                    <h5><i class="fas fa-star"></i> 参考答案:</h5>
                    <p>${correctAnswer}</p>
                </div>
            </div>
        `;
    }

    feedback.innerHTML = `
        <div class="answer-result ${resultClass}">
            <h4>${resultIcon} ${resultTitle}</h4>
            <p>${resultText}</p>
        </div>
        ${comparisonSection}
        <div class="answer-analysis">
            <h5><i class="fas fa-lightbulb"></i> 题目解析:</h5>
            <p>${generateAnalysis(question, topic, correctAnswer)}</p>
        </div>
        <div class="answer-review">
            <h5><i class="fas fa-bookmark"></i> 相关知识点:</h5>
            <div class="topic-tags">
                ${generateTopicTags(topic, isCorrect)}
            </div>
        </div>
        ${!isCorrect ? '<button class="btn btn-secondary" onclick="addToReviewPlan(topic)" style="margin-top: 12px;"><i class="fas fa-plus"></i> 添加到复习计划</button>' : ''}
    `;

    recordAnswer(question, userAnswer, correctAnswer, isCorrect, topic);
}

function compareAnswers(userAnswer, correctAnswer) {
    const normalizeAnswer = (ans) => {
        return ans.toUpperCase().replace(/\s+/g, '').split(/[,，、]/).map(a => a.trim()).sort();
    };

    const userNormalized = normalizeAnswer(userAnswer);
    const correctNormalized = normalizeAnswer(correctAnswer);

    if (userNormalized.length !== correctNormalized.length) {
        return false;
    }

    return userNormalized.every((val, idx) => val === correctNormalized[idx]);
}

window.addToReviewPlan = function(topic) {
    let reviewTopics = JSON.parse(localStorage.getItem('reviewTopics') || '[]');
    if (!reviewTopics.includes(topic)) {
        reviewTopics.push(topic);
        localStorage.setItem('reviewTopics', JSON.stringify(reviewTopics));
        alert('已添加到复习计划！');
    } else {
        alert('该知识点已在复习计划中');
    }
};

function generateCorrectAnswer(question) {
    const q = question.toLowerCase();

    if (q.includes('极限') || q.includes('limit')) {
        return '根据极限运算法则和洛必达法则计算';
    } else if (q.includes('导数') || q.includes('求导') || q.includes('derivative')) {
        return '使用求导法则：幂函数求导、链式法则等';
    } else if (q.includes('积分') || q.includes('不定积分') || q.includes('定积分')) {
        return '使用积分公式和积分方法计算';
    } else if (q.includes('函数') || q.includes('定义域') || q.includes('值域')) {
        return '分析函数性质，确定定义域或值域';
    } else if (q.includes('概率') || q.includes('期望') || q.includes('方差')) {
        return '使用概率公式和期望方差性质计算';
    } else if (q.includes('数列') || q.includes('通项') || q.includes('求和')) {
        return '识别数列类型，使用等差或等比公式';
    } else if (q.includes('方程') || q.includes('求解')) {
        return '使用适当的方程求解方法';
    } else {
        return '根据相关数学概念和公式进行推导';
    }
}

function evaluateAnswer(userAnswer, correctAnswer, topic) {
    const user = userAnswer.toLowerCase();
    const correct = correctAnswer.toLowerCase();

    const keywords = {
        '函数': ['定义域', '值域', '单调', '奇偶', 'function', 'domain', 'range'],
        '极限': ['极限', '趋近', '收敛', '洛必达', 'limit', 'approach'],
        '导数': ['导数', '求导', '微分', '极值', 'derivative', 'chain rule'],
        '积分': ['积分', '原函数', '不定积分', '定积分', 'integral', 'antiderivative'],
        '概率': ['概率', '期望', '方差', '随机', 'probability', 'expectation'],
        '数列': ['数列', '通项', '等差', '等比', 'sequence', 'arithmetic', 'geometric']
    };

    const topicKeywords = keywords[topic] || keywords['函数'];
    let matchCount = 0;

    for (const keyword of topicKeywords) {
        if (user.includes(keyword)) {
            matchCount++;
        }
    }

    if (matchCount >= 2) return true;
    if (user.length > 10 && correct.length > 10) {
        const similarity = calculateSimilarity(user, correct);
        return similarity > 0.5;
    }
    return false;
}

function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

function generateAnalysis(question, topic, correctAnswer) {
    const analyses = {
        '函数': '本题考察函数的基本性质，包括定义域、值域、单调性等概念的理解和应用。解题时需要先明确函数类型，再根据相应性质进行分析。',
        '极限': '本题考察极限的概念和计算。需要掌握极限的基本性质、运算法则，以及洛必达法则等求极限的方法。',
        '导数': '本题考察导数的求法。需要熟记基本求导公式，掌握复合函数求导的链式法则，以及导数的几何应用。',
        '积分': '本题考察积分的计算。需掌握不定积分和定积分的计算方法，包括换元积分法和分部积分法。',
        '概率': '本题考察概率论的基本概念和计算。需要理解概率的加法公式、乘法公式，以及期望方差的计算。',
        '数列': '本题考察数列的通项公式和求和。需要识别数列类型（等差或等比），并应用相应公式求解。'
    };

    return analyses[topic] || '本题考察相关知识点的理解和应用。需要认真分析题意，应用正确的解题方法。';
}

function generateTopicTags(topic, isCorrect) {
    const topicMap = {
        '函数': ['函数定义', '定义域', '值域', '单调性', '奇偶性'],
        '极限': ['极限概念', '洛必达法则', '收敛', '发散'],
        '导数': ['导数定义', '求导法则', '链式法则', '极值'],
        '积分': ['不定积分', '定积分', '换元法', '分部积分'],
        '概率': ['概率公式', '期望', '方差', '分布'],
        '数列': ['通项公式', '等差数列', '等比数列', '求和']
    };

    const tags = topicMap[topic] || ['相关知识点'];

    if (!isCorrect) {
        tags.forEach(tag => {
            if (!reviewTopics.includes(tag)) {
                reviewTopics.push(tag);
            }
        });
        saveReviewTopics();
    }

    return tags.map(tag => `<span class="topic-tag ${reviewTopics.includes(tag) ? 'review' : ''}">${tag}</span>`).join('');
}

function recordAnswer(question, userAnswer, correctAnswer, isCorrect, topic) {
    answerHistory.unshift({
        question: question,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        topic: topic,
        time: new Date().toLocaleString()
    });

    if (answerHistory.length > 50) {
        answerHistory.pop();
    }

    saveAnswerHistory();
    updateReviewSummary();
}

function saveReviewTopics() {
    localStorage.setItem('reviewTopics', JSON.stringify(reviewTopics));
}

function loadReviewTopics() {
    const saved = localStorage.getItem('reviewTopics');
    if (saved) {
        reviewTopics = JSON.parse(saved);
    }
}

function saveAnswerHistory() {
    localStorage.setItem('answerHistory', JSON.stringify(answerHistory));
}

function loadAnswerHistory() {
    const saved = localStorage.getItem('answerHistory');
    if (saved) {
        answerHistory = JSON.parse(saved);
    }
}

function updateReviewSummary() {
    const weakTopics = answerHistory
        .filter(a => !a.isCorrect)
        .map(a => a.topic);

    const topicCounts = {};
    weakTopics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });

    const sortedTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([topic]) => topic);

    sortedTopics.forEach(topic => {
        if (!reviewTopics.includes(topic)) {
            reviewTopics.push(topic);
        }
    });

    saveReviewTopics();
    renderReviewSummary();
}

function renderReviewSummary() {
    const weakList = document.getElementById('weak-points-list');
    if (!weakList) return;

    if (reviewTopics.length === 0) {
        weakList.innerHTML = `
            <div class="weak-point-item">
                <span class="weak-point-name">暂无薄弱知识点</span>
                <span class="weak-point-count">做题目后会记录</span>
            </div>
        `;
        return;
    }

    weakList.innerHTML = reviewTopics.map(topic => `
        <div class="weak-point-item">
            <span class="weak-point-name">${topic}</span>
            <span class="weak-point-count">需重点复习</span>
        </div>
    `).join('');
}

function addToHistory(content) {
    questionHistory.unshift({
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        time: new Date().toLocaleString()
    });

    if (questionHistory.length > 10) {
        questionHistory.pop();
    }

    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');

    if (questionHistory.length === 0) {
        list.innerHTML = '<p class="empty-state">暂无历史记录</p>';
        return;
    }

    list.innerHTML = questionHistory.map((item, index) => `
        <div class="history-item">
            <i class="fas fa-file-alt"></i>
            <div>
                <p>${item.content}</p>
                <small>${item.time}</small>
            </div>
        </div>
    `).join('');
}

function saveExamDate() {
    const input = document.getElementById('exam-date-input');
    if (!input.value) {
        alert('请选择考试日期');
        return;
    }

    studyData.examDate = new Date(input.value);
    saveStudyData();
    updateCountdown();
    alert('考试日期已设置');
}

function updateCountdown() {
    if (!studyData.examDate) {
        document.getElementById('countdown-display').textContent = '距离期末考还有 -- 天';
        return;
    }

    const now = new Date();
    const diff = studyData.examDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    document.getElementById('days-remaining').textContent = days > 0 ? days : 0;
    document.getElementById('hours-remaining').textContent = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    document.getElementById('minutes-remaining').textContent = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        document.getElementById('countdown-display').textContent = '距离期末考还有 ' + days + ' 天';
    } else {
        document.getElementById('countdown-display').textContent = '考试已结束或即将到来';
    }

    updateProgress();
}

function updateProgress() {
    const total = studyData.mastered.length + studyData.learning.length + studyData.weak.length;
    const masteredPercent = total > 0 ? (studyData.mastered.length / total) * 100 : 0;

    document.getElementById('progress-percent').textContent = Math.round(masteredPercent) + '%';
    document.getElementById('mastered-count').textContent = studyData.mastered.length;
    document.getElementById('learning-count').textContent = studyData.learning.length;
    document.getElementById('weak-count').textContent = studyData.weak.length;

    const progressFill = document.getElementById('progress-fill');
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (masteredPercent / 100) * circumference;
    progressFill.style.strokeDashoffset = offset;
}

function generateReviewPlan() {
    if (!studyData.examDate) {
        alert('请先设置考试日期');
        return;
    }

    const timeline = document.getElementById('plan-timeline');
    const now = new Date();
    const daysUntilExam = Math.floor((studyData.examDate - now) / (1000 * 60 * 60 * 24));

    let planHTML = '<div class="timeline-content">';

    if (daysUntilExam > 7) {
        planHTML += `
            <div class="timeline-item">
                <span class="timeline-date">第${daysUntilExam - 7}天</span>
                <span class="timeline-content">全面复习所有知识点</span>
            </div>
            <div class="timeline-item">
                <span class="timeline-date">第${daysUntilExam - 3}天</span>
                <span class="timeline-content">重点复习薄弱环节</span>
            </div>
            <div class="timeline-item">
                <span class="timeline-date">前3天</span>
                <span class="timeline-content">做模拟题和错题复习</span>
            </div>
            <div class="timeline-item">
                <span class="timeline-date">考前1天</span>
                <span class="timeline-content">轻松浏览，保持状态</span>
            </div>
        `;
    } else if (daysUntilExam > 3) {
        planHTML += `
            <div class="timeline-item">
                <span class="timeline-date">现在</span>
                <span class="timeline-content">集中复习薄弱知识点</span>
            </div>
            <div class="timeline-item">
                <span class="timeline-date">考前3天</span>
                <span class="timeline-content">做综合练习</span>
            </div>
            <div class="timeline-item">
                <span class="timeline-date">考前1天</span>
                <span class="timeline-content">复习重点内容</span>
            </div>
        `;
    } else {
        planHTML += `
            <div class="timeline-item">
                <span class="timeline-date">现在</span>
                <span class="timeline-content">查漏补缺</span>
            </div>
            <div class="timeline-item">
                <span class="timeline-date">考前</span>
                <span class="timeline-content">保持良好状态</span>
            </div>
        `;
    }

    planHTML += '</div>';
    timeline.innerHTML = planHTML;
}

function loadStudyData() {
    const saved = localStorage.getItem('studyData');
    if (saved) {
        studyData = JSON.parse(saved);
        if (studyData.examDate) {
            studyData.examDate = new Date(studyData.examDate);
        }
    }
}

function saveStudyData() {
    localStorage.setItem('studyData', JSON.stringify(studyData));
}

function loadSettings() {
    const autoPlay = localStorage.getItem('autoPlay');
    const spotlightEnabled = localStorage.getItem('spotlightEnabled');
    const selectedVoice = localStorage.getItem('selectedVoice');
    const speechSpeed = localStorage.getItem('speechSpeed');
    const spotlightSize = localStorage.getItem('spotlightSize');

    if (autoPlay !== null) {
        document.getElementById('auto-play-toggle').checked = autoPlay === 'true';
    }
    if (spotlightEnabled !== null) {
        document.getElementById('spotlight-toggle').checked = spotlightEnabled === 'true';
    }
    if (selectedVoice !== null) {
        document.getElementById('voice-select').value = selectedVoice;
    }
    if (speechSpeed !== null) {
        document.getElementById('speed-slider').value = speechSpeed;
        document.getElementById('speed-value').textContent = speechSpeed + 'x';
    }
    if (spotlightSize !== null) {
        document.getElementById('spotlight-slider').value = spotlightSize;
        document.getElementById('spotlight-value').textContent = spotlightSize + 'px';
        currentSpotlightSize = parseInt(spotlightSize);
    }
}

function clearAllData() {
    if (confirm('确定要清除所有学习数据吗？此操作不可恢复！')) {
        localStorage.clear();
        studyData = {
            mastered: [],
            learning: [],
            weak: [],
            examDate: null
        };
        questionHistory = [];
        alert('所有数据已清除');
        location.reload();
    }
}

function exportData() {
    const data = {
        studyData: studyData,
        questionHistory: questionHistory,
        settings: {
            autoPlay: document.getElementById('auto-play-toggle').checked,
            spotlightEnabled: document.getElementById('spotlight-toggle').checked,
            selectedVoice: document.getElementById('voice-select').value,
            speechSpeed: document.getElementById('speed-slider').value,
            spotlightSize: document.getElementById('spotlight-slider').value
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study_data_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

console.log('App.js loaded successfully');
