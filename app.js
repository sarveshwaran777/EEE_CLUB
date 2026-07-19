// Application State
const state = {
  activeView: 'view-portal-select',
  currentUserType: null, // 'student', 'staff', 'organiser'
  
  // Student active session
  student: {
    name: '',
    phone: '',
    regId: '',
    gmail: '',
    year: '',
    dept: '',
    questions: []
  },
  
  // Quiz Active State
  quiz: {
    currentIdx: 0,
    answers: [], // holds A, B, C, D or null
    marked: [],  // holds booleans
    timerInterval: null,
    totalSeconds: 3600, // 60 minutes
    elapsedSeconds: 0
  },
  
  // Admin Portal State
  admin: {
    results: [], // array of submission objects
    activeTab: 'leaderboard',
    sortKey: 'rank',
    sortAscending: true,
    activeCandidateResult: null,
    activeDetailFilter: 'all',
    filters: {
      search: '',
      dept: 'ALL',
      earlyOnly: false,
      topOnly: false
    }
  }
};

// Constant Default Credentials
const ADMIN_CREDS = {
  staff: { username: 'staff', password: 'admin123' },
  organiser: { username: 'eeeclub', password: '2026@electrical' }
};

// Helper functions for shuffling questions & options for each student
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateShuffledQuestions(pool, count = 60) {
  if (!pool || pool.length === 0) return [];
  const selectedPool = shuffleArray(pool).slice(0, Math.min(count, pool.length));
  return selectedPool.map((q, idx) => {
    const optEntries = Object.entries(q.options);
    const correctText = q.options[q.answer];
    const shuffledOpts = shuffleArray(optEntries);
    const keys = ['A', 'B', 'C', 'D'];
    const newOptions = {};
    let newAnswer = 'A';
    
    shuffledOpts.forEach(([oldKey, text], i) => {
      const newKey = keys[i];
      newOptions[newKey] = text;
      if (text === correctText) {
        newAnswer = newKey;
      }
    });
    
    return {
      ...q,
      shuffledId: idx + 1,
      options: newOptions,
      answer: newAnswer
    };
  });
}

// Central Cloud Database Endpoint for global submission synchronization
const CLOUD_DB_URL = 'https://jsonblob.com/api/jsonBlob/019f7ad1-4db9-71e3-bf2c-afadd3850dfa';

function mergeDatabaseRecords(localList, remoteList) {
  const map = new Map();
  (localList || []).forEach(r => {
    if (r && r.regId) map.set(r.regId, r);
  });

  (remoteList || []).forEach(r => {
    if (!r || !r.regId) return;
    const existing = map.get(r.regId);
    if (!existing) {
      map.set(r.regId, r);
    } else {
      if (r.status === 'Completed' && existing.status !== 'Completed') {
        map.set(r.regId, r);
      } else if (r.status === existing.status && (r.timestamp || 0) >= (existing.timestamp || 0)) {
        map.set(r.regId, r);
      }
    }
  });

  return Array.from(map.values());
}

// DOM Elements cache helper
const $ = (id) => document.getElementById(id);

// App Initializer
window.addEventListener('DOMContentLoaded', () => {
  app.init();
});

const app = {
  init() {
    // Load local & fetch central cloud submissions
    this.loadDatabase();
    this.syncCloudDatabase();

    // Auto-sync cloud submissions every 8 seconds when Organiser dashboard is active
    setInterval(() => {
      if (state.activeView === 'view-admin-dashboard') {
        this.syncCloudDatabase();
      }
    }, 8000);

    // Network reconnection listener: auto-push pending results as soon as internet reconnects
    window.addEventListener('online', () => {
      console.log('Network reconnected! Syncing pending test results to cloud...');
      this.saveDatabase();
      this.syncCloudDatabase();
    });
    
    // Setup Navigation Listeners
    window.addEventListener('beforeunload', (e) => {
      if (state.activeView === 'view-exam') {
        e.preventDefault();
        e.returnValue = 'Your exam is currently in progress. Refreshing will submit your assessment.';
      }
    });
    
    // Render initial selector
    this.showView('view-portal-select');
  },
  
  // Load local results
  loadDatabase() {
    const raw = localStorage.getItem('eee_portal_results');
    if (raw) {
      try {
        state.admin.results = JSON.parse(raw);
      } catch (e) {
        state.admin.results = [];
      }
    }
  },
  
  saveDatabase() {
    localStorage.setItem('eee_portal_results', JSON.stringify(state.admin.results));

    // 1. Try Express backend REST API first
    fetch('/api/results/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.admin.results)
    }).then(res => {
      if (res.ok) return res.json();
      throw new Error('Local API unavailable');
    }).then(data => {
      if (data && Array.isArray(data.data)) {
        state.admin.results = data.data;
        localStorage.setItem('eee_portal_results', JSON.stringify(data.data));
      }
    }).catch(() => {
      // 2. Fallback to Cloud Database Endpoint
      fetch(CLOUD_DB_URL, { cache: 'no-cache' })
        .then(res => res.ok ? res.json() : [])
        .then(remoteData => {
          const merged = mergeDatabaseRecords(state.admin.results, Array.isArray(remoteData) ? remoteData : []);
          state.admin.results = merged;
          localStorage.setItem('eee_portal_results', JSON.stringify(merged));

          return fetch(CLOUD_DB_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(merged)
          });
        })
        .catch(err => console.warn("Cloud push warning:", err));
    });
  },

  // Fetch live global submissions from backend API or central cloud
  async syncCloudDatabase() {
    // 1. Try Express Backend API first
    try {
      const serverRes = await fetch('/api/results', { cache: 'no-cache' });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (Array.isArray(serverData)) {
          const merged = mergeDatabaseRecords(state.admin.results, serverData);
          state.admin.results = merged;
          localStorage.setItem('eee_portal_results', JSON.stringify(merged));

          if (state.activeView === 'view-admin-dashboard') {
            this.updateDashboardMetrics();
            this.populateDeptFilter();
            this.renderLeaderboard();
          }
          return;
        }
      }
    } catch (err) {
      // Fallthrough to Cloud Endpoint
    }

    // 2. Fallback to Cloud Database Endpoint
    try {
      const res = await fetch(CLOUD_DB_URL, { cache: 'no-cache' });
      if (res.ok) {
        const remoteData = await res.json();
        if (Array.isArray(remoteData)) {
          const merged = mergeDatabaseRecords(state.admin.results, remoteData);
          state.admin.results = merged;
          localStorage.setItem('eee_portal_results', JSON.stringify(merged));

          if (state.activeView === 'view-admin-dashboard') {
            this.updateDashboardMetrics();
            this.populateDeptFilter();
            this.renderLeaderboard();
          }
        }
      }
    } catch (e) {
      console.warn("Cloud sync warning:", e);
    }
  },
  
  // Router
  showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    
    // Show viewId
    const target = $(viewId);
    if (target) {
      target.classList.add('active');
      state.activeView = viewId;
    }
    
    // Configure Header actions
    this.updateHeader();
  },
  
  updateHeader() {
    const actions = $('header-actions');
    actions.innerHTML = '';
    
    if (state.activeView === 'view-portal-select') {
      actions.innerHTML = `<span class="time-badge font-outfit"><span class="material-icons">event</span> EEE CHALLENGE 2026</span>`;
    } else if (state.activeView === 'view-exam') {
      actions.innerHTML = `<span class="exam-status-pill"><span class="badge-dot dot-answered"></span> ASSESSMENT LIVE</span>`;
    } else if (state.activeView === 'view-admin-dashboard') {
      actions.innerHTML = `
        <span class="user-role-pill font-outfit">
          <span class="material-icons">shield</span> ${state.currentUserType.toUpperCase()}
        </span>
      `;
    } else {
      actions.innerHTML = `
        <button class="btn-secondary" onclick="app.logout()">
          <span class="material-icons">home</span> Exit Portal
        </button>
      `;
    }
  },
  
  // Login flow
  showLogin(type) {
    state.currentUserType = type;
    const titleArea = $('login-title-area');
    const inputsArea = $('login-inputs');
    
    // Reset form
    $('login-form').reset();
    
    // Show/hide info panel and adjust layout based on login type
    const infoPanel = $('login-info-panel');
    const splitContainer = document.querySelector('.login-split-container');
    if (type === 'student') {
      if (infoPanel) infoPanel.style.display = '';
      if (splitContainer) splitContainer.classList.remove('single-col');
    } else {
      if (infoPanel) infoPanel.style.display = 'none';
      if (splitContainer) splitContainer.classList.add('single-col');
    }
    
    if (type === 'student') {
      titleArea.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">
          <span class="material-icons text-cyan" style="font-size:2rem;">school</span>
          <h2 class="font-outfit text-cyan" style="font-size:1.6rem; margin:0;">Student Registration</h2>
        </div>
        <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:1rem;">Fill in your details to begin the 60 MCQ Assessment</p>
      `;
      inputsArea.innerHTML = `
        <div class="form-group">
          <label for="student-name">Full Name</label>
          <input type="text" id="student-name" required placeholder="e.g. John Doe">
        </div>
        <div class="form-group">
          <label for="student-phone">Phone Number</label>
          <input type="tel" id="student-phone" required placeholder="e.g. 9876543210" pattern="[0-9]{10}" title="Enter a valid 10-digit phone number">
        </div>
        <div class="form-group">
          <label for="student-regid">Register Number</label>
          <input type="text" id="student-regid" required placeholder="e.g. 951222105001" pattern="[a-zA-Z0-9]{5,20}" title="Enter a valid Register Number (5-20 alphanumeric characters)">
        </div>
        <div class="form-group">
          <label for="student-gmail">Gmail Address</label>
          <input type="email" id="student-gmail" required placeholder="e.g. john@gmail.com" pattern="[a-zA-Z0-9._%+-]+@gmail\\.com" title="Enter a valid Gmail address (ending in @gmail.com)">
        </div>
        <div class="form-group">
          <label for="student-year">Year of Study</label>
          <select id="student-year" required>
            <option value="" disabled selected>Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
        <div class="form-group">
          <label for="student-dept">Department</label>
          <select id="student-dept" required>
            <option value="" disabled selected>Select Department</option>
            <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
            <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
            <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
            <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
            <option value="Computer Science and Engineering">Computer Science and Engineering</option>
            <option value="Computer Science and Business Systems">Computer Science and Business Systems</option>
            <option value="Biotechnology">Biotechnology</option>
            <option value="Chemical Engineering">Chemical Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
            <option value="Biomedical Engineering">Biomedical Engineering</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Computer and Communication Engineering">Computer and Communication Engineering</option>
          </select>
        </div>
      `;
    } else {
      const isOrganiser = type === 'organiser';
      const colorClass = isOrganiser ? 'text-warning' : 'text-purple';
      const icon = isOrganiser ? 'admin_panel_settings' : 'badge';
      
      titleArea.innerHTML = `
        <div style="text-align:center; margin-bottom: 0.5rem;">
          <span class="material-icons text-warning" style="font-size: 3rem;">admin_panel_settings</span>
        </div>
        <h2 class="font-outfit text-warning" style="text-align:center;">Organiser Portal</h2>
        <p style="text-align:center; color: var(--text-muted); margin-top:0.5rem;">Enter your administrator credentials to access the dashboard</p>
      `;
      inputsArea.innerHTML = `
        <div class="form-group">
          <label for="admin-user">Username</label>
          <input type="text" id="admin-user" required placeholder="Enter admin username" autocomplete="username">
        </div>
        <div class="form-group">
          <label for="admin-pass">Password</label>
          <input type="password" id="admin-pass" required placeholder="••••••••" autocomplete="current-password">
        </div>
      `;
    }
    
    this.showView('view-login');
  },
  
  handleLoginSubmit(e) {
    e.preventDefault();
    
    if (state.currentUserType === 'student') {
      state.student.name = $('student-name').value.trim();
      state.student.phone = $('student-phone').value.trim();
      state.student.regId = $('student-regid').value.trim().toUpperCase();
      state.student.gmail = $('student-gmail').value.trim();
      state.student.year = $('student-year').value;
      state.student.dept = $('student-dept').value;
      
      // Check if student already finished the exam to avoid multiple submissions
      const alreadyTaken = state.admin.results.find(r => r.regId === state.student.regId);
      if (alreadyTaken && alreadyTaken.status === 'Completed') {
        alert(`Candidate with Register ID ${state.student.regId} has already submitted the assessment. Scores cannot be overwritten.`);
        return;
      }
      
      // If candidate is already in database (In Progress), restore their session details
      if (alreadyTaken && alreadyTaken.status === 'In Progress') {
        state.student.name = alreadyTaken.name;
        state.student.phone = alreadyTaken.phone || '';
        state.student.gmail = alreadyTaken.gmail || '';
        state.student.year = alreadyTaken.year || '1st Year';
        state.student.dept = alreadyTaken.dept;
        state.student.questions = alreadyTaken.questions || generateShuffledQuestions(QUIZ_QUESTIONS, 60);
      } else {
        // Generate candidate's unique shuffled question set
        const studentQuestions = generateShuffledQuestions(QUIZ_QUESTIONS, 60);
        state.student.questions = studentQuestions;

        // Register a new "In Progress" session record
        const regRecord = {
          name: state.student.name,
          phone: state.student.phone,
          regId: state.student.regId,
          gmail: state.student.gmail,
          year: state.student.year,
          dept: state.student.dept,
          questions: studentQuestions,
          answers: Array(studentQuestions.length).fill(null),
          score: 0,
          percent: 0.00,
          timeTakenSeconds: 0,
          timeTakenStr: "00:00",
          isEarly: false,
          status: "In Progress",
          submittedAt: "In Progress",
          timestamp: Date.now()
        };
        state.admin.results.push(regRecord);
        this.saveDatabase();
      }
      
      // Prepare instructions screen
      $('instruction-student-badge').innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.5rem; text-align:left; width:100%;">
          <div><strong>Name:</strong> ${state.student.name}</div>
          <div><strong>Phone:</strong> ${state.student.phone}</div>
          <div><strong>Register Number:</strong> ${state.student.regId}</div>
          <div><strong>Gmail:</strong> ${state.student.gmail}</div>
          <div><strong>Year of Study:</strong> ${state.student.year}</div>
          <div><strong>Department:</strong> ${state.student.dept}</div>
        </div>
      `;
      this.showView('view-instructions');
    } else {
      const user = $('admin-user').value.trim();
      const pass = $('admin-pass').value;
      
      const expected = ADMIN_CREDS[state.currentUserType];
      if (user === expected.username && pass === expected.password) {
        this.enterAdminPortal();
      } else {
        alert('Invalid credentials. Please use default username and password.');
      }
    }
  },
  
  // Enter Admin panel
  enterAdminPortal(type) {
    if (type) state.currentUserType = type;
    $('admin-role-badge').innerText = `Logged in as: ${state.currentUserType.toUpperCase()}`;
    
    // Hide/show delete actions based on organiser
    const organiserBlocks = document.querySelectorAll('.organiser-actions-block, .organiser-th-delete');
    organiserBlocks.forEach(el => {
      if (state.currentUserType === 'organiser') {
        el.style.display = 'block';
        if (el.tagName === 'TH') el.style.display = 'table-cell';
      } else {
        el.style.display = 'none';
      }
    });
    
    this.showView('view-admin-dashboard');
    this.switchAdminTab('leaderboard');
    this.updateDashboardMetrics();
    this.populateDeptFilter();
    this.renderLeaderboard();
  },
  
  // EXAM CONTROLLER FLOW
  startAssessment() {
    // Check if there is an in-progress record for this candidate to restore progress
    const existing = state.admin.results.find(r => r.regId === state.student.regId && r.status === 'In Progress');
    
    if (existing && existing.questions) {
      state.student.questions = existing.questions;
    } else if (!state.student.questions || state.student.questions.length === 0) {
      state.student.questions = generateShuffledQuestions(QUIZ_QUESTIONS, 60);
    }
    const questions = state.student.questions;

    // Initialize Quiz variables
    state.quiz.currentIdx = 0;
    state.quiz.answers = existing ? [...existing.answers] : Array(questions.length).fill(null);
    state.quiz.marked = Array(questions.length).fill(false);
    state.quiz.elapsedSeconds = existing ? existing.timeTakenSeconds : 0;
    
    // Set headers
    $('exam-cand-name').innerText = state.student.name;
    $('exam-cand-sub').innerText = `ID: ${state.student.regId} | Year: ${state.student.year || '1st Year'} | Dept: ${state.student.dept}`;
    
    // Render side dots
    this.renderProgressGrid();
    
    // Load first question
    this.renderQuestion();
    
    // Start Ticking timer
    if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);
    state.quiz.timerInterval = setInterval(() => this.tickTimer(), 1000);
    
    this.showView('view-exam');
  },
  
  renderProgressGrid() {
    const container = $('question-grid-container');
    container.innerHTML = '';
    const questions = state.student.questions || QUIZ_QUESTIONS;
    
    for (let i = 0; i < questions.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'q-dot';
      dot.id = `q-dot-${i}`;
      dot.innerText = String(i + 1).padStart(2, '0');
      dot.onclick = () => this.jumpToQuestion(i);
      container.appendChild(dot);
    }
    
    this.updateProgressGridColors();
  },
  
  updateProgressGridColors() {
    const questions = state.student.questions || QUIZ_QUESTIONS;
    for (let i = 0; i < questions.length; i++) {
      const dot = $(`q-dot-${i}`);
      if (!dot) continue;
      
      dot.className = 'q-dot'; // reset
      
      if (i === state.quiz.currentIdx) {
        dot.classList.add('active');
      }
      
      if (state.quiz.answers[i] !== null) {
        dot.classList.add('answered');
      }
      
      if (state.quiz.marked[i]) {
        dot.classList.add('marked');
      }
    }
    
    // Update Stats counters
    const answeredCount = state.quiz.answers.filter(a => a !== null).length;
    const markedCount = state.quiz.marked.filter(m => m === true).length;
    $('stat-answered').innerText = answeredCount;
    $('stat-marked').innerText = markedCount;
  },
  
  renderQuestion() {
    const questions = state.student.questions || QUIZ_QUESTIONS;
    const q = questions[state.quiz.currentIdx];
    if (!q) return;
    
    $('q-number-tag').innerText = `Question ${String(state.quiz.currentIdx + 1).padStart(2, '0')} of ${questions.length}`;
    $('q-category-tag').innerText = q.category;
    $('q-text').innerText = q.question;
    
    const optionsContainer = $('q-options-container');
    optionsContainer.innerHTML = '';
    
    // Populate A, B, C, D option cards
    Object.entries(q.options).forEach(([key, text]) => {
      const card = document.createElement('div');
      card.className = 'option-label-card';
      if (state.quiz.answers[state.quiz.currentIdx] === key) {
        card.classList.add('selected');
      }
      card.onclick = () => this.selectOption(key);
      
      card.innerHTML = `
        <div class="option-indicator">${key}</div>
        <div class="option-text">${text}</div>
        <input type="radio" name="exam-option" value="${key}" ${state.quiz.answers[state.quiz.currentIdx] === key ? 'checked' : ''}>
      `;
      optionsContainer.appendChild(card);
    });
    
    // Configure Prev/Next actions
    $('btn-prev').disabled = state.quiz.currentIdx === 0;
    $('btn-next').innerText = state.quiz.currentIdx === questions.length - 1 ? 'Finish Test' : 'Next';
    
    // Set active review flag button status
    const flagBtn = $('btn-flag-review');
    if (state.quiz.marked[state.quiz.currentIdx]) {
      flagBtn.innerHTML = `<span class="material-icons text-warning">turned_in</span> Flagged`;
    } else {
      flagBtn.innerHTML = `<span class="material-icons">turned_in_not</span> Mark for Review`;
    }
    
    this.updateProgressGridColors();
  },
  
  selectOption(optKey) {
    state.quiz.answers[state.quiz.currentIdx] = optKey;
    
    // Trigger highlight updates immediately on option cards
    const cards = document.querySelectorAll('.option-label-card');
    cards.forEach(card => {
      const radio = card.querySelector('input');
      if (radio.value === optKey) {
        card.classList.add('selected');
        radio.checked = true;
      } else {
        card.classList.remove('selected');
        radio.checked = false;
      }
    });
    
    // Save live progress in database
    const record = state.admin.results.find(r => r.regId === state.student.regId && r.status === 'In Progress');
    if (record) {
      record.answers = [...state.quiz.answers];
      record.timeTakenSeconds = state.quiz.elapsedSeconds;
      record.timeTakenStr = this.formatTime(state.quiz.elapsedSeconds);
      this.saveDatabase();
    }
    
    this.updateProgressGridColors();
  },
  
  clearCurrentAnswer() {
    state.quiz.answers[state.quiz.currentIdx] = null;
    
    // Uncheck UI cards
    const cards = document.querySelectorAll('.option-label-card');
    cards.forEach(card => {
      card.classList.remove('selected');
      const radio = card.querySelector('input');
      radio.checked = false;
    });
    
    // Save live progress in database
    const record = state.admin.results.find(r => r.regId === state.student.regId && r.status === 'In Progress');
    if (record) {
      record.answers = [...state.quiz.answers];
      record.timeTakenSeconds = state.quiz.elapsedSeconds;
      record.timeTakenStr = this.formatTime(state.quiz.elapsedSeconds);
      this.saveDatabase();
    }
    
    this.updateProgressGridColors();
  },
  
  toggleFlagReview() {
    state.quiz.marked[state.quiz.currentIdx] = !state.quiz.marked[state.quiz.currentIdx];
    this.renderQuestion();
  },
  
  jumpToQuestion(idx) {
    state.quiz.currentIdx = idx;
    this.renderQuestion();
  },
  
  nextQuestion() {
    const questions = state.student.questions || QUIZ_QUESTIONS;
    if (state.quiz.currentIdx < questions.length - 1) {
      state.quiz.currentIdx++;
      this.renderQuestion();
    } else {
      // It was the last question, open submission dialog
      this.confirmSubmitExam();
    }
  },
  
  prevQuestion() {
    if (state.quiz.currentIdx > 0) {
      state.quiz.currentIdx--;
      this.renderQuestion();
    }
  },
  
  // Tick Timer
  tickTimer() {
    state.quiz.elapsedSeconds++;
    const remaining = state.quiz.totalSeconds - state.quiz.elapsedSeconds;
    
    if (remaining <= 0) {
      // Auto Submit on timeout
      clearInterval(state.quiz.timerInterval);
      this.submitExam(true);
      return;
    }
    
    // Format Display
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    $('exam-timer').innerText = timeStr;
    
    // Fill Progress
    const fillPercent = (remaining / state.quiz.totalSeconds) * 100;
    $('timer-progress-fill').style.width = `${fillPercent}%`;
    
    // Warning under 5 minutes (300 seconds)
    if (remaining < 300) {
      $('exam-timer').classList.add('timer-warning');
    }
    
    // Update in-memory candidate status and save every 30 seconds to minimize I/O overhead
    const record = state.admin.results.find(r => r.regId === state.student.regId && r.status === 'In Progress');
    if (record) {
      record.timeTakenSeconds = state.quiz.elapsedSeconds;
      record.timeTakenStr = this.formatTime(state.quiz.elapsedSeconds);
      if (state.quiz.elapsedSeconds % 30 === 0) {
        this.saveDatabase();
      }
    }
  },
  
  confirmSubmitExam() {
    const questions = state.student.questions || QUIZ_QUESTIONS;
    const answeredCount = state.quiz.answers.filter(a => a !== null).length;
    const unansweredCount = questions.length - answeredCount;
    
    const overlay = $('confirm-modal');
    $('modal-title').innerText = 'Submit Assessment?';
    $('modal-body').innerHTML = `
      You have answered <strong>${answeredCount}</strong> out of ${questions.length} questions.<br>
      ${unansweredCount > 0 ? `<span class="text-danger">Warning: You have ${unansweredCount} unanswered questions!</span><br>` : ''}
      Are you sure you want to finish and submit the assessment now?
    `;
    
    overlay.classList.add('active');
    
    $('modal-confirm-btn').onclick = () => {
      overlay.classList.remove('active');
      this.submitExam();
    };
    
    $('modal-cancel-btn').onclick = () => {
      overlay.classList.remove('active');
    };
  },
  
  submitExam(autoTimeout = false) {
    // Clear timer
    if (state.quiz.timerInterval) {
      clearInterval(state.quiz.timerInterval);
    }
    
    const questions = state.student.questions || QUIZ_QUESTIONS;
    // Calculate Score
    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
      if (state.quiz.answers[i] === questions[i].answer) {
        correctCount++;
      }
    }
    
    const percentage = parseFloat(((correctCount / questions.length) * 100).toFixed(2));
    
    // Detect Finished Early (Finished in under 30 minutes / 1800 seconds)
    const earlyThreshold = 1800; // 30 minutes
    const isEarly = state.quiz.elapsedSeconds < earlyThreshold;
    const timeSaved = Math.max(0, state.quiz.totalSeconds - state.quiz.elapsedSeconds);
    
    const submission = {
      name: state.student.name,
      phone: state.student.phone,
      regId: state.student.regId,
      gmail: state.student.gmail,
      year: state.student.year || '1st Year',
      dept: state.student.dept,
      questions: questions,
      answers: state.quiz.answers,
      score: correctCount,
      percent: percentage,
      timeTakenSeconds: state.quiz.elapsedSeconds,
      timeTakenStr: this.formatTime(state.quiz.elapsedSeconds),
      isEarly: isEarly,
      timeRemainingSeconds: timeSaved,
      timeRemainingStr: this.formatTime(timeSaved),
      status: "Completed",
      submittedAt: new Date().toLocaleString(),
      timestamp: Date.now()
    };
    
    // Find the student's existing In Progress record and update it
    const recordIdx = state.admin.results.findIndex(r => r.regId === state.student.regId && r.status === 'In Progress');
    if (recordIdx !== -1) {
      state.admin.results[recordIdx] = submission;
    } else {
      state.admin.results.push(submission);
    }
    this.saveDatabase();
    
    // Pop receipt view
    $('receipt-name').innerText = submission.name;
    $('receipt-id').innerText = submission.regId;
    $('receipt-time').innerText = `${submission.timeTakenStr} (${isEarly ? 'Finished Early' : 'Standard'})`;
    $('receipt-status').innerText = autoTimeout ? 'Time Expired (Auto Submitted)' : 'Completed';
    
    this.showView('view-thankyou');
    this.startConfetti();
  },
  
  formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  startConfetti() {
    const canvas = $('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    
    const colors = ['#00f2fe', '#4facfe', '#00ff87', '#f5a623', '#9b51e0', '#ff2a2a'];
    const particleCount = 150;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.08 + 0.03,
        tiltAngle: 0,
        speed: Math.random() * 4 + 3
      });
    }
    
    let animationFrameId;
    const startTime = Date.now();
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.speed;
        p.x += Math.sin(p.tiltAngle) * 0.5;
        p.tilt = Math.sin(p.tiltAngle - i / 3) * 12;
        
        if (p.y < canvas.height) {
          alive = true;
        } else {
          // Recycle particles to the top for a continuous waterfall effect during the active window
          if (Date.now() - startTime < 4500) {
            p.y = -10;
            p.x = Math.random() * canvas.width;
            alive = true;
          }
        }
        
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      }
      
      if (alive && Date.now() - startTime < 6000) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    // Auto-handle resizing during animation
    const resizeHandler = () => {
      if (canvas) {
        canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
        canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
      }
    };
    window.addEventListener('resize', resizeHandler);
    
    // Clean up resize listener on completion
    setTimeout(() => {
      window.removeEventListener('resize', resizeHandler);
    }, 6100);
    
    draw();
  },
  
  // Logout reset
  logout() {
    state.currentUserType = null;
    state.student = { name: '', regId: '', dept: '' };
    if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);
    this.showView('view-portal-select');
  },
  
  // ADMIN DASHBOARD CONTROLLER
  switchAdminTab(tabId) {
    state.admin.activeTab = tabId;
    
    // Toggle active menu class
    document.querySelectorAll('.admin-menu .menu-item').forEach(m => m.classList.remove('active'));
    const activeMenuItem = Array.from(document.querySelectorAll('.admin-menu .menu-item')).find(m => m.innerText.toLowerCase().includes(tabId));
    if (activeMenuItem) activeMenuItem.classList.add('active');
    
    // Toggle tab divisions
    $('tab-leaderboard').classList.remove('active');
    $('tab-analytics').classList.remove('active');
    
    if (tabId === 'leaderboard') {
      $('tab-leaderboard').classList.add('active');
      this.renderLeaderboard();
    } else {
      $('tab-analytics').classList.add('active');
      this.renderAnalytics();
    }
  },
  
  updateDashboardMetrics() {
    const list = state.admin.results;
    const total = list.length; // Total Registered Candidates
    
    const completedList = list.filter(r => r.status === 'Completed');
    const inProgressList = list.filter(r => r.status === 'In Progress');
    
    $('metric-total-students').innerText = total;
    $('metric-completed-assessments').innerText = completedList.length;
    $('metric-active-students').innerText = inProgressList.length;
    
    if (completedList.length > 0) {
      const sum = completedList.reduce((a, b) => a + b.percent, 0);
      $('metric-average-score').innerText = `${(sum / completedList.length).toFixed(1)}%`;
      
      const maxScore = Math.max(...completedList.map(r => r.score));
      $('metric-top-score').innerText = `${maxScore}/${QUIZ_QUESTIONS.length}`;
    } else {
      $('metric-average-score').innerText = "0.0%";
      $('metric-top-score').innerText = "0/60";
    }
  },
  
  populateDeptFilter() {
    const filter = $('filter-dept');
    // Clear and keep first ALL option
    filter.innerHTML = '<option value="ALL">All Departments</option>';
    
    const depts = [...new Set(state.admin.results.map(r => r.dept))];
    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.innerText = d;
      filter.appendChild(opt);
    });
    
    // Reset inputs
    $('search-input').value = state.admin.filters.search;
    $('filter-dept').value = state.admin.filters.dept;
    $('filter-early-checkbox').checked = state.admin.filters.earlyOnly;
    $('filter-top-checkbox').checked = state.admin.filters.topOnly;
  },
  
  filterResults() {
    state.admin.filters.search = $('search-input').value.trim().toLowerCase();
    state.admin.filters.dept = $('filter-dept').value;
    state.admin.filters.earlyOnly = $('filter-early-checkbox').checked;
    state.admin.filters.topOnly = $('filter-top-checkbox').checked;
    
    this.renderLeaderboard();
  },
  
  setSortKey(key) {
    if (state.admin.sortKey === key) {
      state.admin.sortAscending = !state.admin.sortAscending;
    } else {
      state.admin.sortKey = key;
      state.admin.sortAscending = key !== 'score'; // default descending for score
    }
    
    // Reset column headers indicators
    const icons = document.querySelectorAll('.leaderboard-table th span');
    icons.forEach(ico => ico.innerText = 'unfold_more');
    
    const activeIcon = $(`sort-${key}`);
    if (activeIcon) {
      activeIcon.innerText = state.admin.sortAscending ? 'expand_less' : 'expand_more';
    }
    
    this.renderLeaderboard();
  },
  
  renderLeaderboard() {
    this.updateDashboardMetrics();
    
    // Sort raw completed records to calculate true Rank
    const completedRecords = [...state.admin.results]
      .filter(r => r.status === 'Completed')
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.timeTakenSeconds - b.timeTakenSeconds;
      });
      
    // Create mapping of regId -> Rank
    const rankMap = {};
    completedRecords.forEach((rec, idx) => {
      rankMap[rec.regId] = idx + 1;
    });
    
    // Apply filters
    const search = state.admin.filters.search;
    const dept = state.admin.filters.dept;
    const early = state.admin.filters.earlyOnly;
    const top = state.admin.filters.topOnly;
    
    let filtered = state.admin.results.filter(rec => {
      // Search matches
      const matchSearch = rec.name.toLowerCase().includes(search) || 
                          rec.regId.toLowerCase().includes(search) || 
                          rec.dept.toLowerCase().includes(search);
      // Dept matches
      const matchDept = dept === 'ALL' || rec.dept === dept;
      // Early finished matches (only completed can be early)
      const matchEarly = !early || (rec.status === 'Completed' && rec.isEarly);
      // Top Performer matches (only completed can be top performers)
      const matchTop = !top || (rec.status === 'Completed' && rec.percent >= 80);
      
      return matchSearch && matchDept && matchEarly && matchTop;
    });
    
    // Sort filtered subset for viewing sorting
    const key = state.admin.sortKey;
    const asc = state.admin.sortAscending;
    
    filtered.sort((a, b) => {
      // Always keep Completed above In Progress
      if (a.status !== b.status) {
        return a.status === 'Completed' ? -1 : 1;
      }
      
      if (a.status === 'In Progress') {
        // Sort In-Progress by registration name
        return a.name.localeCompare(b.name);
      }
      
      let valA, valB;
      if (key === 'rank') {
        valA = rankMap[a.regId] || 9999;
        valB = rankMap[b.regId] || 9999;
      } else {
        valA = a[key];
        valB = b[key];
      }
      
      if (typeof valA === 'string') {
        return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return asc ? valA - valB : valB - valA;
      }
    });
    
    // Render list
    const tbody = $('leaderboard-tbody');
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
      $('empty-table-msg').style.display = 'flex';
      $('leaderboard-table').style.display = 'none';
      return;
    } else {
      $('empty-table-msg').style.display = 'none';
      $('leaderboard-table').style.display = 'table';
    }
    
    filtered.forEach(rec => {
      const row = document.createElement('tr');
      row.onclick = () => this.viewCandidateDetails(rec.regId);
      
      const isComp = rec.status === 'Completed';
      
      // Determine rank badges classes
      let rankContent = `<span class="text-muted">—</span>`;
      if (isComp) {
        const trueRank = rankMap[rec.regId];
        rankContent = `<span class="rank-badge">${trueRank}</span>`;
        if (trueRank === 1) rankContent = `<span class="rank-badge rank-1"><span class="material-icons" style="font-size:0.9rem; vertical-align:middle;">emoji_events</span></span>`;
        else if (trueRank === 2) rankContent = `<span class="rank-badge rank-2">2</span>`;
        else if (trueRank === 3) rankContent = `<span class="rank-badge rank-3">3</span>`;
      }
      
      // Score presentation
      const scoreContent = isComp 
        ? `<span class="text-cyan font-outfit" style="font-weight: 700;">${rec.score}/60 (${rec.percent}%)</span>`
        : `<span class="text-muted font-outfit">—</span>`;
        
      // Status badge
      const statusBadge = isComp
        ? `<span class="status-badge-complete"><span class="badge-dot" style="background:var(--accent-green);"></span> Completed</span>`
        : `<span class="status-badge-progress"><span class="badge-dot" style="background:var(--accent-amber);"></span> Writing</span>`;
      
      // Finished early badge
      const earlyBadge = isComp 
        ? (rec.isEarly ? `<span class="early-badge"><span class="material-icons" style="font-size:0.8rem;">bolt</span> YES (${rec.timeRemainingStr} early)</span>` : `<span class="text-muted">Standard</span>`)
        : `<span class="text-muted">—</span>`;
        
      // Submission Time column
      const submissionContent = isComp ? rec.submittedAt : `<span class="text-warning" style="font-weight:600;">Active (${rec.timeTakenStr})</span>`;
      
      // Delete button for organiser (stops click bubbling up to open modal)
      const actionTd = state.currentUserType === 'organiser' ? `
        <td>
          <button class="delete-row-btn" onclick="event.stopPropagation(); app.deleteSubmission('${rec.regId}')" title="Delete Candidate">
            <span class="material-icons">delete</span>
          </button>
        </td>
      ` : '';
      
      row.innerHTML = `
        <td>${rankContent}</td>
        <td><strong>${rec.name}</strong></td>
        <td><code>${rec.regId}</code></td>
        <td><span class="dept-lbl font-outfit">${rec.dept} (${rec.year || '1st Year'})</span></td>
        <td>${scoreContent}</td>
        <td>${isComp ? rec.timeTakenStr : `Active (${rec.timeTakenStr})`}</td>
        <td>${statusBadge}</td>
        <td>${earlyBadge}</td>
        <td style="font-size: 0.72rem; color: var(--text-muted);">${submissionContent}</td>
        ${actionTd}
      `;
      tbody.appendChild(row);
    });
  },
  
  deleteSubmission(regId) {
    if (confirm(`Are you sure you want to delete candidate ${regId} from results?`)) {
      state.admin.results = state.admin.results.filter(r => r.regId !== regId);
      this.saveDatabase();
      this.renderLeaderboard();
      this.updateDashboardMetrics();
    }
  },
  
  // Analytics Renderers
  renderAnalytics() {
    const list = state.admin.results;
    if (list.length === 0) {
      $('score-distribution-chart').innerHTML = '<p class="text-center text-muted" style="width: 100%; margin-top: 100px;">No attendee data available for charts.</p>';
      $('dept-performance-chart').innerHTML = '<p class="text-center text-muted" style="width: 100%; margin-top: 100px;">No attendee data available.</p>';
      return;
    }
    
    // 1. Score Distribution SVG render
    // Brackets: 0-10, 11-20, 21-30, 31-40, 41-50, 51-60
    const brackets = [0, 0, 0, 0, 0, 0];
    list.forEach(r => {
      const idx = Math.min(5, Math.floor(r.score / 10));
      brackets[idx]++;
    });
    
    const maxVal = Math.max(...brackets, 1);
    const bracketLabels = ["0-10", "11-20", "21-30", "31-40", "41-50", "51-60"];
    
    let svgContent = `<svg class="bar-svg" viewBox="0 0 500 240">`;
    // Draw columns
    for (let i = 0; i < 6; i++) {
      const count = brackets[i];
      const barHeight = (count / maxVal) * 140;
      const x = 40 + i * 75;
      const y = 180 - barHeight;
      
      // Bar with gradient cyan/purple
      svgContent += `
        <rect x="${x}" y="${y}" width="40" height="${barHeight}" rx="4" fill="url(#barGrad)" filter="url(#glowFilter)" />
        <text x="${x + 20}" y="${y - 8}" text-anchor="middle" fill="#00f2fe" font-size="10" font-weight="bold">${count}</text>
        <text x="${x + 20}" y="200" text-anchor="middle" fill="#94a3b8" font-size="9">${bracketLabels[i]}</text>
      `;
    }
    // Gradients definitions
    svgContent += `
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00f2fe" />
          <stop offset="100%" stop-color="#9b51e0" />
        </linearGradient>
        <filter id="glowFilter" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#00f2fe" flood-opacity="0.3" />
        </filter>
      </defs>
    </svg>`;
    
    $('score-distribution-chart').innerHTML = svgContent;
    
    // 2. Department performance bars render
    const deptSums = {};
    const deptCounts = {};
    list.forEach(r => {
      deptSums[r.dept] = (deptSums[r.dept] || 0) + r.percent;
      deptCounts[r.dept] = (deptCounts[r.dept] || 0) + 1;
    });
    
    let deptHtml = `<div class="dept-chart-list">`;
    Object.keys(deptCounts).forEach(deptName => {
      const avg = parseFloat((deptSums[deptName] / deptCounts[deptName]).toFixed(1));
      deptHtml += `
        <div class="dept-chart-row">
          <div class="dept-name-lbl">${deptName}</div>
          <div class="dept-bar-track">
            <div class="dept-bar-fill" style="width: ${avg}%"></div>
          </div>
          <div class="dept-score-lbl">${avg}%</div>
        </div>
      `;
    });
    deptHtml += `</div>`;
    $('dept-performance-chart').innerHTML = deptHtml;
  },
  
  // CSV Export utility
  exportToCSV() {
    const list = state.admin.results;
    if (list.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    let csv = "Rank,Name,Phone Number,Register ID,Gmail,Year of Study,Department,Score,Percentage (%),Time Taken,Finished Early,Time Remaining,Submitted At\n";
    
    // Sort by rank first
    const ranked = [...list].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTakenSeconds - b.timeTakenSeconds;
    });
    
    ranked.forEach((r, idx) => {
      csv += `"${idx + 1}","${r.name.replace(/"/g, '""')}","${r.phone || 'N/A'}","${r.regId}","${r.gmail || 'N/A'}","${r.year || '1st Year'}","${r.dept}","${r.score}/60","${r.percent}","${r.timeTakenStr}","${r.isEarly ? 'YES' : 'NO'}","${r.timeRemainingStr}","${r.submittedAt}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `EEE_Challenge_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  // JSON Backup utility
  exportToJSON() {
    const list = state.admin.results;
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `EEE_Challenge_Database_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  
  triggerImportJSON() {
    $('json-file-input').click();
  },
  
  // Import JSON from other browsers and merge
  importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          alert("Invalid file format. JSON must be a list of results.");
          return;
        }
        
        let mergeCount = 0;
        let skipCount = 0;
        
        imported.forEach(entry => {
          // Basic validation of fields
          if (entry.name && entry.regId && entry.dept && entry.score !== undefined) {
            // Check for duplicate register IDs
            const exists = state.admin.results.some(r => r.regId === entry.regId);
            if (!exists) {
              state.admin.results.push(entry);
              mergeCount++;
            } else {
              skipCount++;
            }
          } else {
            skipCount++;
          }
        });
        
        this.saveDatabase();
        this.renderLeaderboard();
        this.populateDeptFilter();
        this.updateDashboardMetrics();
        
        alert(`Import Summary:\n- Successfully merged: ${mergeCount} records\n- Skipped/Duplicates: ${skipCount} records`);
      } catch (err) {
        alert("Failed to parse JSON file. Ensure it is a valid EEE backup file.");
      }
    };
    reader.readAsText(file);
    // Reset file input value
    event.target.value = '';
  },
  
  // Reset event database (organiser only)
  confirmResetDatabase() {
    const overlay = $('confirm-modal');
    $('modal-title').innerText = 'Reset Entire Database?';
    $('modal-body').innerHTML = `
      <span class="text-danger">WARNING: This will permanently delete ALL candidate records, student grades, and results logs.</span><br>
      This action is irreversible. Make sure you have exported your backups.
    `;
    overlay.classList.add('active');
    
    $('modal-confirm-btn').onclick = () => {
      overlay.classList.remove('active');
      state.admin.results = [];
      this.saveDatabase();
      this.renderLeaderboard();
      this.populateDeptFilter();
      this.updateDashboardMetrics();
      alert("Database has been completely reset.");
    };
    
    $('modal-cancel-btn').onclick = () => {
      overlay.classList.remove('active');
    };
  },

  // CANDIDATE DETAILED REVIEW PANEL CONTROLLERS
  viewCandidateDetails(regId) {
    const record = state.admin.results.find(r => r.regId === regId);
    if (!record) return;

    state.admin.activeCandidateResult = record;
    state.admin.activeDetailFilter = 'all';

    const questions = record.questions || QUIZ_QUESTIONS;

    // 1. Render Summary Header
    $('detail-candidate-summary').innerHTML = `
      <div class="detail-meta-item">
        <label>Name</label>
        <strong>${record.name}</strong>
      </div>
      <div class="detail-meta-item">
        <label>Phone Number</label>
        <strong>${record.phone || 'N/A'}</strong>
      </div>
      <div class="detail-meta-item">
        <label>Register Number</label>
        <strong><code>${record.regId}</code></strong>
      </div>
      <div class="detail-meta-item">
        <label>Gmail Address</label>
        <strong>${record.gmail || 'N/A'}</strong>
      </div>
      <div class="detail-meta-item">
        <label>Year of Study</label>
        <strong>${record.year || '1st Year'}</strong>
      </div>
      <div class="detail-meta-item">
        <label>Department</label>
        <strong>${record.dept}</strong>
      </div>
      <div class="detail-meta-item">
        <label>Score achieved</label>
        <strong class="text-cyan">${record.score}/${questions.length} (${record.percent}%)</strong>
      </div>
      <div class="detail-meta-item">
        <label>Time Spent</label>
        <strong>${record.timeTakenStr} (${record.isEarly ? 'Finished Early' : 'Standard'})</strong>
      </div>
      <div class="detail-meta-item">
        <label>Submitted At</label>
        <strong style="font-size:0.75rem;">${record.submittedAt}</strong>
      </div>
    `;

    // 2. Count statistics for button labels
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < questions.length; i++) {
      const studentAns = record.answers[i];
      const correctAns = questions[i].answer;
      if (studentAns === null) {
        skippedCount++;
      } else if (studentAns === correctAns) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    }

    $('btn-detail-all').innerText = `All Questions (${questions.length})`;
    $('btn-detail-correct').innerText = `Correct (${correctCount})`;
    $('btn-detail-incorrect').innerText = `Incorrect (${incorrectCount})`;
    if ($('btn-detail-skipped')) {
      $('btn-detail-skipped').innerText = `Skipped (${skippedCount})`;
    }

    // 3. Render questions list
    this.renderDetailQuestions();

    // 4. Open Modal overlay
    $('candidate-detail-modal').classList.add('active');
  },

  filterDetailQuestions(filterType) {
    state.admin.activeDetailFilter = filterType;

    // Toggle active filter button class
    document.querySelectorAll('.detail-filters-bar .detail-filter-btn').forEach(btn => btn.classList.remove('active'));
    
    if (filterType === 'all') $('btn-detail-all').classList.add('active');
    else if (filterType === 'correct') $('btn-detail-correct').classList.add('active');
    else if (filterType === 'incorrect') $('btn-detail-incorrect').classList.add('active');
    else if (filterType === 'skipped' && $('btn-detail-skipped')) $('btn-detail-skipped').classList.add('active');

    this.renderDetailQuestions();
  },

  renderDetailQuestions() {
    const record = state.admin.activeCandidateResult;
    if (!record) return;

    const filter = state.admin.activeDetailFilter;
    const container = $('detail-questions-container');
    const questions = record.questions || QUIZ_QUESTIONS;

    let visibleCount = 0;
    const htmlBuffer = [];

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const studentAns = record.answers[idx]; // 'A', 'B', 'C', 'D' or null
      const correctAns = q.answer;
      const isSkipped = studentAns === null;
      const isCorrect = studentAns === correctAns;

      // Apply filter check
      if (filter === 'correct' && !isCorrect) continue;
      if (filter === 'incorrect' && (isCorrect || isSkipped)) continue;
      if (filter === 'skipped' && !isSkipped) continue;

      visibleCount++;

      // Badge status
      let badgeHtml = '';
      if (isSkipped) {
        badgeHtml = `<span class="q-status-badge badge-skipped"><span class="material-icons" style="font-size:0.9rem;">do_not_disturb_on</span> Skipped</span>`;
      } else if (isCorrect) {
        badgeHtml = `<span class="q-status-badge badge-correct"><span class="material-icons" style="font-size:0.9rem;">check</span> Correct</span>`;
      } else {
        badgeHtml = `<span class="q-status-badge badge-incorrect"><span class="material-icons" style="font-size:0.9rem;">close</span> Incorrect</span>`;
      }

      const optionsHtml = Object.entries(q.options).map(([key, text]) => {
        let cardClass = '';
        if (key === correctAns) {
          cardClass = 'opt-correct';
        } else if (key === studentAns && !isCorrect) {
          cardClass = 'opt-wrong-selected';
        }

        return `
          <div class="detail-option-card ${cardClass}">
            <div class="option-review-marker">${key}</div>
            <div class="option-text">${text}</div>
          </div>
        `;
      }).join('');

      htmlBuffer.push(`
        <div class="detail-question-item">
          <div class="detail-q-header">
            <div class="detail-q-title">Q${idx + 1}. ${q.question}</div>
            ${badgeHtml}
          </div>
          <div class="detail-options-grid">
            ${optionsHtml}
          </div>
        </div>
      `);
    }

    if (visibleCount === 0) {
      container.innerHTML = `
        <div style="padding:3rem 1rem; text-align:center; color:var(--text-muted);">
          <span class="material-icons" style="font-size:2.5rem; margin-bottom:0.5rem;">check_circle_outline</span>
          <p>No questions found in this category.</p>
        </div>
      `;
    } else {
      container.innerHTML = htmlBuffer.join('');
    }
  },

  closeCandidateDetail() {
    $('candidate-detail-modal').classList.remove('active');
    state.admin.activeCandidateResult = null;
  }
};
