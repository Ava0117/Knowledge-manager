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
let studyData = {
    mastered: [],
    learning: [],
    weak: [],
    examDate: null
};

window.onerror = function(msg, url, line) {
    console.error('JavaScript Error:', msg, 'at line', line);
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('AI智能学习助手 loaded');
    loadStudyData();
    initVoices();
    initEventListeners();
    updateCountdown();
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
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });

    document.getElementById('settings-btn').addEventListener('click', function() {
        document.getElementById('settings-modal').classList.add('show');
    });

    document.getElementById('close-settings').addEventListener('click', function() {
        document.getElementById('settings-modal').classList.remove('show');
    });

    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');

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

    document.getElementById('prev-page').addEventListener('click', prevPage);
    document.getElementById('next-page').addEventListener('click', nextPage);
    document.getElementById('zoom-in').addEventListener('click', zoomIn);
    document.getElementById('zoom-out').addEventListener('click', zoomOut);
    document.getElementById('close-viewer').addEventListener('click', closeViewer);
    document.getElementById('toggle-spotlight').addEventListener('click', toggleSpotlight);

    document.getElementById('voice-select').addEventListener('change', updateVoice);
    document.getElementById('speed-slider').addEventListener('input', updateSpeed);
    document.getElementById('spotlight-slider').addEventListener('input', updateSpotlight);

    document.getElementById('play-btn').addEventListener('click', togglePlay);
    document.getElementById('stop-btn').addEventListener('click', stopSpeech);
    document.getElementById('replay-btn').addEventListener('click', replaySpeech);

    document.getElementById('start-quiz').addEventListener('click', startQuiz);
    document.getElementById('submit-answer').addEventListener('click', submitAnswer);
    document.getElementById('skip-question').addEventListener('click', skipQuestion);
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);

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

    document.getElementById('analyze-question').addEventListener('click', analyzeQuestion);

    const imageUploadZone = document.getElementById('image-upload-zone');
    const imageInput = document.getElementById('image-input');

    imageUploadZone.addEventListener('click', function() {
        imageInput.click();
    });

    imageInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleImageUpload(this.files[0]);
        }
    });

    document.getElementById('remove-image').addEventListener('click', function() {
        document.getElementById('image-preview').classList.add('hidden');
        document.getElementById('image-upload-zone').classList.remove('hidden');
        imageInput.value = '';
    });

    document.getElementById('save-exam-date').addEventListener('click', saveExamDate);
    document.getElementById('generate-plan').addEventListener('click', generateReviewPlan);

    document.getElementById('clear-data').addEventListener('click', clearAllData);
    document.getElementById('export-data').addEventListener('click', exportData);

    document.getElementById('auto-play-toggle').addEventListener('change', function() {
        localStorage.setItem('autoPlay', this.checked);
    });

    document.getElementById('spotlight-toggle').addEventListener('change', function() {
        localStorage.setItem('spotlightEnabled', this.checked);
    });

    loadSettings();
}

function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.nav-tab').forEach(tab => {
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
        document.getElementById('interactive-area').classList.remove('hidden');
        document.getElementById('ai-message').innerHTML = '<p>PPT文件已加载！</p><p>点击播放按钮，AI将为您讲解PPT内容。</p>';
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
            document.getElementById('content-viewer').classList.remove('hidden');
            document.getElementById('ai-message').innerHTML = '<p>PDF文件已加载！</p><p>共 ' + totalPages + ' 页</p><p>点击播放按钮，AI将为您阅读当前页面内容。</p>';
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

async function playCurrentContent() {
    if (!currentFile) {
        document.getElementById('ai-message').innerHTML = '<p>请先上传PDF或PPT文件</p>';
        return;
    }

    const text = await extractTextFromPDF();
    if (text) {
        speakText(text);
        isPlaying = true;
        document.getElementById('play-btn').innerHTML = '<i class="fas fa-pause"></i>';
        document.querySelector('.waveform').classList.remove('paused');
        document.getElementById('speaking-text').textContent = '阅读中...';
    }
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
    document.getElementById('image-input-area').classList.toggle('hidden', method !== 'image');
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

function analyzeQuestion() {
    const method = document.querySelector('.method-btn.active').dataset.method;
    let content = '';

    if (method === 'text') {
        content = document.getElementById('question-text-input').value;
    } else {
        content = '[图片题目]';
    }

    if (!content.trim()) {
        alert('请输入题目内容');
        return;
    }

    const result = document.getElementById('analysis-result');
    result.innerHTML = `
        <div class="analysis-content">
            <h3>📝 题目分析</h3>
            <p>${content}</p>
            <div class="analysis-section">
                <h4>💡 知识点解析</h4>
                <p>这道题考察的是相关知识点的理解和应用。</p>
            </div>
            <div class="analysis-section">
                <h4>📖 解题思路</h4>
                <p>1. 认真审题，理解题意<br>2. 回忆相关知识点<br>3. 应用公式或方法解决问题</p>
            </div>
            <div class="analysis-section">
                <h4>✅ 正确答案</h4>
                <p>正确答案取决于具体题目的条件。</p>
            </div>
        </div>
    `;

    addToHistory(content);
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
