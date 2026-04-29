let globalTasks = [];
let favoriteIds = JSON.parse(localStorage.getItem('userFavorites')) || [];
let totalAnswers = parseInt(localStorage.getItem('totalAnswers')) || 0;
let correctAnswers = parseInt(localStorage.getItem('correctAnswers')) || 0;
let examTimer;

const interfaceTexts = {
    uk: {
        appTitle: "Вивчення англійської", welcomeTitle: "Привіт!", registerButton: "Реєстрація", loginButton: "Вхід", guestButton: "Гість",
        logoutButton: "Вийти", progressTitle: "Прогрес", topicLabel: "Тема:", modeLabel: "Режим:", generateButton: "Старт",
        checkButton: "Перевірити", backButton: "Назад", regUsernamePlaceholder: "Ім'я", regEmailPlaceholder: "Email", regPasswordPlaceholder: "Пароль",
        loginEmailPlaceholder: "Email", loginPasswordPlaceholder: "Пароль", resultTitle: "Результат: [SCORE]/[TOTAL]", 
        topicFood: "Їжа", topicTravel: "Подорожі", topicTechnology: "IT", topicSport: "Спорт", topicNature: "Природа",
        processingText: "Обробка...", dictionaryTitle: "Словник", filterAll: "Всі", filterFavorites: "Улюблені",
        loadingText: "Завантаження даних...", errorFetch: "Дані недоступні.",
        modePractice: "Практика", modeExam: "Іспит", modeAI: "AI Генерація", timeOver: "Час вийшов!"
    },
    en: {
        appTitle: "Learn English", welcomeTitle: "Welcome!", registerButton: "Sign Up", loginButton: "Login", guestButton: "Guest",
        logoutButton: "Logout", progressTitle: "Progress", topicLabel: "Topic:", modeLabel: "Mode:", generateButton: "Start",
        checkButton: "Check", backButton: "Back", regUsernamePlaceholder: "Name", regEmailPlaceholder: "Email", regPasswordPlaceholder: "Password",
        loginEmailPlaceholder: "Email", loginPasswordPlaceholder: "Password", resultTitle: "Result: [SCORE]/[TOTAL]",
        topicFood: "Food", topicTravel: "Travel", topicTechnology: "IT", topicSport: "Sport", topicNature: "Nature",
        processingText: "Processing...", dictionaryTitle: "Vocabulary", filterAll: "All", filterFavorites: "Favorites",
        loadingText: "Loading data...", errorFetch: "Data unavailable.",
        modePractice: "Practice", modeExam: "Exam", modeAI: "AI Generation", timeOver: "Time is up!"
    }
};

let currentLang = localStorage.getItem('userLang') || 'uk';

function updateProgressBar() {
    const progressFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    let percent = totalAnswers === 0 ? 0 : Math.round((correctAnswers / totalAnswers) * 100);
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
}

function navigateTo(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.getElementById('logout-btn').style.display = (id === 'app-screen') ? 'block' : 'none';
    if (id === 'app-screen') {
        loadData();
        updateProgressBar();
    }
}

function updateUI() {
    const texts = interfaceTexts[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(texts[key]) el.innerHTML = el.querySelector('i') ? el.querySelector('i').outerHTML + ' ' + texts[key] : texts[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if(texts[key]) el.placeholder = texts[key];
    });
}

async function loadData() {
    const container = document.getElementById('dictionary-container');
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('error-message');
    container.innerHTML = '';
    errorMsg.style.display = 'none';
    loader.style.display = 'block';
    try {
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const dataArray = await response.json();
        globalTasks = dataArray;
        renderCards(dataArray);
    } catch (error) {
        errorMsg.textContent = interfaceTexts[currentLang].errorFetch;
        errorMsg.style.display = 'block';
    } finally {
        loader.style.display = 'none';
    }
}

function renderCards(dataArray) {
    const container = document.getElementById('dictionary-container');
    container.innerHTML = '';
    dataArray.forEach(item => {
        const isFav = favoriteIds.includes(item.id);
        const heartClass = isFav ? 'fa-solid' : 'fa-regular';
        const activeClass = isFav ? 'is-active' : '';
        const cardHTML = `
            <div class="word-card" data-category="${item.topic}" data-id="${item.id}">
                <div class="word-info">
                    <strong>
                        ${item.q} 
                        <button class="speak-btn" data-word="${item.q}" title="Listen" style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-size:1.1rem; margin-left:8px; padding:0;">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </strong><br>
                    <small style="color: var(--secondary-text-color);">${item.a}</small>
                </div>
                <button class="favorite-btn ${activeClass}" aria-label="Favorite">
                    <i class="${heartClass} fa-heart"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
    
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('is-active'); 
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-regular'); 
            icon.classList.toggle('fa-solid');   
            const cardElement = this.closest('.word-card');
            const wordId = parseInt(cardElement.getAttribute('data-id'));
            if (this.classList.contains('is-active')) {
                if (!favoriteIds.includes(wordId)) favoriteIds.push(wordId);
            } else {
                favoriteIds = favoriteIds.filter(id => id !== wordId);
                const currentFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
                if (currentFilter === 'favorites') cardElement.classList.add('hidden');
            }
            localStorage.setItem('userFavorites', JSON.stringify(favoriteIds));
        });
    });

    document.querySelectorAll('.speak-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const word = this.getAttribute('data-word');
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        });
    });
}

async function generateTasks() {
    const topic = document.getElementById('topic').value;
    const mode = document.getElementById('mode').value;
    const container = document.getElementById('task-container');
    const timerDisplay = document.getElementById('exam-timer');
    
    clearInterval(examTimer);
    container.innerHTML = '';
    timerDisplay.style.display = 'none';

    if (mode === 'ai') {
        // ВИБИРАЄМО СЛОВА З БАЗИ ПЕРЕД ВІДПРАВКОЮ ДО ШІ
        const filteredForAI = globalTasks.filter(t => t.topic === topic);
        const selectedForAI = filteredForAI.sort(() => 0.5 - Math.random()).slice(0, 3);
        const targetWords = selectedForAI.map(t => t.q); // Отримуємо масив ['apple', 'bread', 'cheese']

        container.innerHTML = `<div class="loader"><i class="fas fa-spinner fa-spin"></i> ${interfaceTexts[currentLang].processingText}</div>`;
        try {
            const res = await fetch('http://127.0.0.1:8000/api/generate-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: topic, words: targetWords }) // ПЕРЕДАЄМО СЛОВА НА БЕКЕНД
            });
            const data = await res.json();
            container.innerHTML = '';

            const div = document.createElement('div');
            div.className = 'task screen';
            div.innerHTML = `<p style="line-height: 1.8;">${data.text.replace(/___/g, '<span style="display:inline-block; width:60px; border-bottom:2px solid var(--primary-color);"></span>')}</p>`;

            const btn = document.createElement('button');
            btn.className = 'auth-btn primary-btn';
            btn.textContent = interfaceTexts[currentLang].checkButton;

            data.answers.forEach((_, i) => {
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `ai-ans-${i}`;
                input.placeholder = `...`;
                
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        btn.click();
                    }
                });

                div.appendChild(input);
            });

            container.appendChild(div);

            btn.onclick = async () => {
                btn.disabled = true;
                let score = 0;
                for (let i = 0; i < data.answers.length; i++) {
                    const input = document.getElementById(`ai-ans-${i}`);
                    const userWord = input.value.trim().toLowerCase();
                    const correctWord = data.answers[i].toLowerCase();

                    const checkRes = await fetch('http://127.0.0.1:8000/api/check-answer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_word: userWord, correct_word: correctWord })
                    });
                    const checkData = await checkRes.json();

                    if (checkData.is_correct) {
                        input.style.borderColor = 'var(--success-color)';
                        score++;
                        correctAnswers++;
                    } else {
                        input.style.borderColor = 'var(--fail-color)';
                    }
                    totalAnswers++;
                }
                localStorage.setItem('correctAnswers', correctAnswers);
                localStorage.setItem('totalAnswers', totalAnswers);
                updateProgressBar();
                alert(`${interfaceTexts[currentLang].resultTitle.replace('[SCORE]', score).replace('[TOTAL]', data.answers.length)}\nAnswers: ${data.answers.join(', ')}`);
            };
            container.appendChild(btn);
        } catch (e) {
            container.innerHTML = `<div class="fetch-error">API Error</div>`;
        }
        return;
    }

    const filteredTasks = globalTasks.filter(t => t.topic === topic);
    const selectedTasks = filteredTasks.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    if (mode === 'exam') {
        timerDisplay.style.display = 'block';
        let timeLeft = 60;
        timerDisplay.textContent = timeLeft;
        examTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(examTimer);
                document.getElementById('check-btn').click();
            }
        }, 1000);
    }

    selectedTasks.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'task screen';
        div.innerHTML = `<p>${t.q}</p><input type="text" id="ans-${i}" placeholder="...">`;
        container.appendChild(div);
    });

    const btn = document.createElement('button');
    btn.id = 'check-btn';
    btn.className = 'auth-btn primary-btn';
    btn.textContent = interfaceTexts[currentLang].checkButton;
    
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    btn.onclick = () => {
        clearInterval(examTimer);
        let score = 0;
        selectedTasks.forEach((t, i) => {
            const input = document.getElementById(`ans-${i}`);
            if(input.value.toLowerCase().trim() === t.a.toLowerCase()) {
                input.style.borderColor = 'var(--success-color)';
                score++;
                correctAnswers++;
            } else {
                input.style.borderColor = 'var(--fail-color)';
            }
            totalAnswers++;
        });
        localStorage.setItem('correctAnswers', correctAnswers);
        localStorage.setItem('totalAnswers', totalAnswers);
        updateProgressBar();
        alert(`${interfaceTexts[currentLang].resultTitle.replace('[SCORE]', score).replace('[TOTAL]', selectedTasks.length)}`);
        btn.disabled = true;
    };
    container.appendChild(btn);
}

document.getElementById('register-btn').addEventListener('click', () => {
    const name = document.getElementById('reg-username-input').value.trim();
    const email = document.getElementById('reg-email-input').value.trim();
    const pass = document.getElementById('reg-password-input').value.trim();
    const msg = document.getElementById('reg-message');
    if (name.length < 3 || !email || pass.length < 6) {
        msg.textContent = "Дані некоректні";
        return;
    }
    const mockUser = { name, email, pass };
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    localStorage.setItem('currentUser', name);
    document.getElementById('user-display-name').textContent = name;
    document.getElementById('registration-form').reset();
    navigateTo('app-screen');
});

document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email-input').value.trim();
    const pass = document.getElementById('login-password-input').value.trim();
    const msg = document.getElementById('login-message');
    const savedUserStr = localStorage.getItem('mockUser');
    if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser.email === email && savedUser.pass === pass) {
            localStorage.setItem('currentUser', savedUser.name);
            document.getElementById('user-display-name').textContent = savedUser.name;
            navigateTo('app-screen');
            return;
        }
    }
    msg.textContent = "Невірні дані";
});

document.getElementById('theme-select').addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
    localStorage.setItem('userTheme', e.target.value);
});

document.getElementById('lang-select').addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('userLang', currentLang);
    updateUI();
});

document.getElementById('show-registration-btn').addEventListener('click', () => navigateTo('registration-screen'));
document.getElementById('show-login-btn').addEventListener('click', () => navigateTo('login-screen'));
document.getElementById('back-to-auth-reg-btn').addEventListener('click', () => navigateTo('auth-screen'));
document.getElementById('back-to-auth-login-btn').addEventListener('click', () => navigateTo('auth-screen'));
document.getElementById('guest-btn').addEventListener('click', () => {
    localStorage.setItem('currentUser', 'Guest');
    document.getElementById('user-display-name').textContent = 'Guest';
    navigateTo('app-screen');
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    clearInterval(examTimer);
    navigateTo('auth-screen');
});

document.getElementById('settings-btn').addEventListener('click', () => document.getElementById('settings-modal').style.display = 'flex');
document.getElementById('close-settings-btn').addEventListener('click', () => document.getElementById('settings-modal').style.display = 'none');

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('is-open');
    document.body.classList.toggle('no-scroll');
}
document.getElementById('burger-btn').addEventListener('click', toggleMobileMenu);
document.getElementById('close-menu-btn').addEventListener('click', toggleMobileMenu);

document.getElementById('generate').addEventListener('click', function() {
    const originalText = this.textContent;
    this.textContent = interfaceTexts[currentLang].processingText; 
    this.disabled = true; 
    setTimeout(() => {
        this.textContent = originalText;
        this.disabled = false;
        generateTasks(); 
    }, 800);
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const filterValue = this.getAttribute('data-filter');
        document.querySelectorAll('.word-card').forEach(card => {
            const category = card.getAttribute('data-category');
            const isFav = card.querySelector('.favorite-btn').classList.contains('is-active');
            if (filterValue === 'all' || (filterValue === 'favorites' && isFav) || category === filterValue) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
});

const savedTheme = localStorage.getItem('userTheme');
if(savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-select').value = savedTheme;
}
document.getElementById('lang-select').value = currentLang;
updateUI();
const activeUser = localStorage.getItem('currentUser');
if (activeUser) {
    document.getElementById('user-display-name').textContent = activeUser;
    navigateTo('app-screen');
} else {
    navigateTo('auth-screen');
}