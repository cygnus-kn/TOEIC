'use strict';

// --- Theme Logic ---
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

const currentTheme = localStorage.getItem('theme');

// Initial theme application is now handled by an inline script in index.html to prevent FOUC

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
});
// -------------------

// State
let currentPart = 0;
let currentParts = [];
let activeClass = '';
let activeType = ''; // 'homework' or 'lesson'
let timers = {}; // { partIndex: { interval, remaining, running } }
let audioPlayers = {}; // { partIndex: playerInstance }
let audioPoller = null;

// Response times per question type (in seconds)
const RESPONSE_TIMES = {
  'read-aloud': 45,
  'describe-picture': 30,
  'respond-questions': 30,
  'respond-info': 60,
  'respond-info-q': 15,
  'opinion': 60,
  'email-response': 600,
  'sentence-picture': 300,
};

// Display names for card header
const TYPE_LABELS = {
  'read-aloud': 'TOEIC Speaking',
  'describe-picture': 'TOEIC Speaking',
  'respond-questions': 'TOEIC Speaking',
  'respond-info': 'TOEIC Speaking',
  'respond-info-q': 'TOEIC Speaking',
  'opinion': 'TOEIC Speaking',
  'email-response': 'TOEIC Writing',
  'sentence-picture': 'TOEIC Writing',
};

// DOM refs
const sidebarNav = document.getElementById('sidebarNav');
const welcomeState = document.getElementById('welcomeState');
const homeworkViewer = document.getElementById('homeworkViewer');
const lessonViewer = document.getElementById('lessonViewer');
const dateBadge = document.getElementById('dateBadge');
const cardTrack = document.getElementById('cardTrack');
const pagination = document.getElementById('pagination');
const lessonDateBadge = document.getElementById('lessonDateBadge');
const lessonContent = document.getElementById('lessonContent');
const cardContainer = document.getElementById('cardContainer');

// ============================
//  Clear all timers
// ============================
function clearAllTimers() {
  for (const key in timers) {
    if (timers[key].interval) clearInterval(timers[key].interval);

    const display = document.getElementById(`timer-display-${key}`);
    const valueEl = document.getElementById(`timer-value-${key}`);
    if (display && valueEl && currentParts[key]) {
      const part = currentParts[key];
      const totalTime = part.responseTime || RESPONSE_TIMES[part.type] || 45;
      display.style.setProperty('--progress', '100%');
      display.classList.remove('running', 'finished');
      valueEl.textContent = formatTime(totalTime);
    }
  }
  timers = {};
}

// ============================
//  Timer Logic
// ============================
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

window.toggleTimer = function (index, totalTime) {
  const display = document.getElementById(`timer-display-${index}`);
  const valueEl = document.getElementById(`timer-value-${index}`);
  const part = currentParts[index];
  const prepTime = part.prepTime || 0;

  if (!timers[index]) {
    // First click — check for prep time
    if (prepTime > 0) {
      startPrepTimer(index, prepTime, totalTime);
    } else {
      startResponseTimer(index, totalTime, totalTime);
    }
  } else if (timers[index].running) {
    // Pause
    clearInterval(timers[index].interval);
    timers[index].running = false;
    display.classList.remove('running');
  } else if (timers[index].remaining > 0) {
    // Resume
    if (timers[index].stage === 'prep') {
      resumePrepTimer(index, prepTime, totalTime);
    } else {
      resumeResponseTimer(index, totalTime);
    }
  } else {
    // Reset
    delete timers[index];
    display.style.setProperty('--progress', '100%');
    display.classList.remove('running', 'finished', 'prep-stage');
    valueEl.textContent = formatTime(totalTime);
  }
};

function startPrepTimer(index, prepTime, responseTime) {
  const display = document.getElementById(`timer-display-${index}`);
  const valueEl = document.getElementById(`timer-value-${index}`);

  timers[index] = {
    remaining: prepTime,
    running: true,
    interval: null,
    stage: 'prep'
  };

  display.classList.add('running', 'prep-stage');
  display.classList.remove('finished');
  display.style.setProperty('--progress', '100%');
  valueEl.textContent = formatTime(prepTime);

  timers[index].interval = setInterval(() => {
    timers[index].remaining--;
    const progress = (timers[index].remaining / prepTime) * 100;
    display.style.setProperty('--progress', `${progress}%`);
    valueEl.textContent = formatTime(timers[index].remaining);

    if (timers[index].remaining <= 0) {
      clearInterval(timers[index].interval);
      display.classList.remove('prep-stage');
      startResponseTimer(index, responseTime, responseTime);
    }
  }, 1000);
}

function resumePrepTimer(index, prepTime, responseTime) {
  const display = document.getElementById(`timer-display-${index}`);
  const valueEl = document.getElementById(`timer-value-${index}`);

  timers[index].running = true;
  display.classList.add('running', 'prep-stage');

  timers[index].interval = setInterval(() => {
    timers[index].remaining--;
    const progress = (timers[index].remaining / prepTime) * 100;
    display.style.setProperty('--progress', `${progress}%`);
    valueEl.textContent = formatTime(timers[index].remaining);

    if (timers[index].remaining <= 0) {
      clearInterval(timers[index].interval);
      display.classList.remove('prep-stage');
      startResponseTimer(index, responseTime, responseTime);
    }
  }, 1000);
}

function startResponseTimer(index, responseTime, totalResponseTime) {
  const display = document.getElementById(`timer-display-${index}`);
  const valueEl = document.getElementById(`timer-value-${index}`);

  timers[index] = {
    remaining: responseTime,
    running: true,
    interval: null,
    stage: 'response'
  };

  display.classList.add('running');
  display.classList.remove('prep-stage', 'finished');
  display.style.setProperty('--progress', '100%');
  valueEl.textContent = formatTime(responseTime);

  timers[index].interval = setInterval(() => {
    timers[index].remaining--;
    const progress = (timers[index].remaining / totalResponseTime) * 100;
    display.style.setProperty('--progress', `${progress}%`);
    valueEl.textContent = formatTime(timers[index].remaining);

    if (timers[index].remaining <= 0) {
      clearInterval(timers[index].interval);
      timers[index].running = false;
      display.classList.remove('running');
      display.classList.add('finished');
      valueEl.textContent = '00:00';
    }
  }, 1000);
}

function resumeResponseTimer(index, totalResponseTime) {
  const display = document.getElementById(`timer-display-${index}`);
  const valueEl = document.getElementById(`timer-value-${index}`);

  timers[index].running = true;
  display.classList.add('running');

  timers[index].interval = setInterval(() => {
    timers[index].remaining--;
    const progress = (timers[index].remaining / totalResponseTime) * 100;
    display.style.setProperty('--progress', `${progress}%`);
    valueEl.textContent = formatTime(timers[index].remaining);

    if (timers[index].remaining <= 0) {
      clearInterval(timers[index].interval);
      timers[index].running = false;
      display.classList.remove('running');
      display.classList.add('finished');
      valueEl.textContent = '00:00';
    }
  }, 1000);
}

