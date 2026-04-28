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
let topicTimers = {}; // { "partIndex-qIndex": { interval, remaining, running } }
let audioPlayers = {}; // { partIndex: YT playerInstance }
let youtubePlayerPromises = {}; // { partIndex: Promise<YT.Player> }
let localAudioPlayers = {}; // { partIndex: HTMLAudioElement }
let audioPoller = null;

// Response times per question type (in seconds)
const RESPONSE_TIMES = {
  'read-aloud': 45,
  'describe-picture': 30,
  'respond-questions-15': 15,
  'respond-questions-30': 30,
  'respond-info': 60,
  'respond-info-q': 15,
  'opinion': 60,
  'email-response': 600,
  'sentence-picture': 300,
  'topic-prep': 30,
  'topic-prep-item': 30,
};

// Display names for card header
const TYPE_LABELS = {
  'read-aloud': 'TOEIC Speaking',
  'describe-picture': 'TOEIC Speaking',
  'respond-questions-15': 'TOEIC Speaking',
  'respond-questions-30': 'TOEIC Speaking',
  'respond-info': 'TOEIC Speaking',
  'respond-info-q': 'TOEIC Speaking',
  'opinion': 'TOEIC Speaking',
  'email-response': 'TOEIC Writing',
  'sentence-picture': 'TOEIC Writing',
  'topic-prep': 'Topic Preparation',
  'topic-prep-item': 'Topic Preparation',
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
const bottomRecorderShell = document.getElementById('bottomRecorderShell');
const bottomNav = document.getElementById('bottomNav');
const bottomRecorderHandle = document.getElementById('bottomRecorderHandle');
const bottomRedoBtn = document.getElementById('bottomRedoBtn');
const bottomRecordBtn = document.getElementById('bottomRecordBtn');
const bottomPlaybackBtn = document.getElementById('bottomPlaybackBtn');
const bottomSaveBtn = document.getElementById('bottomSaveBtn');
const recordingStatus = document.getElementById('recordingStatus');
const recordingStatusText = document.getElementById('recordingStatusText');
const saveModal = document.getElementById('saveModal');
const recordingFileName = document.getElementById('recordingFileName');
const recordingFileExtension = document.getElementById('recordingFileExtension');
const cancelSaveBtn = document.getElementById('cancelSave');
const confirmSaveBtn = document.getElementById('confirmSave');
const bottomPlaybackSeeker = document.getElementById('bottomPlaybackSeeker');
const bottomSeekerProgress = document.getElementById('bottomSeekerProgress');
const bottomSeekerKnob = document.getElementById('bottomSeekerKnob');

// Recorder state
let mediaRecorder = null;
let mediaStream = null;
let mediaChunks = [];
let recordingStartedAt = 0;
let recordingTicker = null;
let recordingLimitTimeout = null;
let playbackTicker = null;
let currentRecordingAudio = null;
let isSeekingPlayback = false;
const recordings = {}; // { taskKey: { blob, url, durationMs, mimeType } }

// Nav Dragging State
let isDraggingNav = false;
let navOffsetX = 0;
let navOffsetY = 0;

function initNavDragging() {
  if (!bottomNav || !bottomRecorderShell) return;
  
  // Skip on mobile/touch
  if (window.matchMedia("(pointer: coarse)").matches) return;

  bottomNav.style.cursor = 'grab';

  bottomNav.addEventListener('mousedown', (e) => {
    // Only drag if clicking the background of the nav, not buttons/seeker
    if (e.target.closest('button') || e.target.closest('.bottom-playback-seeker-wrapper')) return;
    
    isDraggingNav = true;
    const rect = bottomNav.getBoundingClientRect();
    navOffsetX = e.clientX - rect.left;
    navOffsetY = e.clientY - rect.top;
    
    // Prepare shell for absolute movement
    bottomRecorderShell.style.width = 'auto';
    bottomRecorderShell.style.left = rect.left + 'px';
    bottomRecorderShell.style.top = rect.top + 'px';
    bottomRecorderShell.style.bottom = 'auto';
    bottomRecorderShell.style.right = 'auto';
    bottomRecorderShell.style.transform = 'none';
    bottomNav.style.cursor = 'grabbing';
    
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingNav) return;
    
    let x = e.clientX - navOffsetX;
    let y = e.clientY - navOffsetY;
    
    // Constraints (padding from edges)
    x = Math.max(10, Math.min(window.innerWidth - bottomNav.offsetWidth - 10, x));
    y = Math.max(10, Math.min(window.innerHeight - bottomNav.offsetHeight - 10, y));
    
    bottomRecorderShell.style.left = x + 'px';
    bottomRecorderShell.style.top = y + 'px';
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingNav) {
      isDraggingNav = false;
      bottomNav.style.cursor = 'grab';
    }
  });
}

// ============================
//  Markdown Helper
// ============================
function formatMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let htmlContent = '';
  let inList = false;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ')) {
      if (!inList) {
        htmlContent += '<ul>';
        inList = true;
      }
      htmlContent += `<li>${trimmedLine.substring(2)}</li>`;
    } else {
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      if (trimmedLine === '') {
        htmlContent += '<br>';
      } else {
        htmlContent += `<div>${trimmedLine}</div>`;
      }
    }
  });

  if (inList) htmlContent += '</ul>';
  return htmlContent;
}

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

  // Also clear any topic timers
  for (const key in topicTimers) {
    if (topicTimers[key].interval) clearInterval(topicTimers[key].interval);
  }
  topicTimers = {};
}

// ============================
//  Timer Logic
// ============================
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatRecordingDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return formatTime(totalSeconds);
}

function getCurrentTaskKey() {
  const activeDate = activeType === 'homework' ? dateBadge.textContent : lessonDateBadge.textContent;
  if (!activeClass || !activeType || !activeDate || currentParts[currentPart] === undefined) return '';
  return `${activeClass}::${activeType}::${activeDate}::${currentPart}`;
}

function currentPartSupportsRecording() {
  return activeType === 'homework' && !!currentParts[currentPart];
}

function getCurrentRecording() {
  const key = getCurrentTaskKey();
  return key ? recordings[key] || null : null;
}

function sanitizeFilenamePart(value) {
  return String(value || '')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'recording';
}

function getRecordingExtension(mimeType) {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

function getRecordingLimitSeconds() {
  // Flat 2-minute limit (120s) for all recording sessions
  return 120;
}

function setRecordingStatus(text, opts = {}) {
  const { visible = true, recording = false, playback = false, pulsing = false } = opts;
  if (!recordingStatus || !recordingStatusText) return;
  recordingStatusText.textContent = text;
  // recordingStatus.hidden = !visible; // Permanent now
  recordingStatus.classList.toggle('recording', recording);
  recordingStatus.classList.toggle('playback', playback);
  recordingStatus.classList.toggle('pulsing', pulsing);
}

function clearRecordingTicker() {
  if (recordingTicker) clearInterval(recordingTicker);
  recordingTicker = null;
}

function stopPlaybackPreview() {
  if (currentRecordingAudio) {
    currentRecordingAudio.pause();
    currentRecordingAudio = null;
  }
  clearPlaybackTicker();
}

function clearPlaybackTicker() {
  if (playbackTicker) clearInterval(playbackTicker);
  playbackTicker = null;
}

function startPlaybackTicker() {
  clearPlaybackTicker();
  playbackTicker = setInterval(() => {
    updateBottomNavState();
  }, 33); // 30fps for smooth movement
}

function stopAllPromptAudio() {
  Object.values(audioPlayers).forEach(p => {
    if (p && p.pauseVideo) p.pauseVideo();
  });
  Object.values(localAudioPlayers).forEach(p => {
    if (p && !p.paused) p.pause();
  });
}

function getSupportedRecordingMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  const candidates = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus'
  ];
  return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function updatePlaybackButton(isPlaying = false) {
  if (!bottomPlaybackBtn) return;
  const svg = bottomPlaybackBtn.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('fill', isPlaying ? 'none' : 'currentColor');
  svg.setAttribute('stroke', isPlaying ? 'currentColor' : 'none');
  svg.setAttribute('stroke-width', isPlaying ? '3' : '0');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.innerHTML = isPlaying
    ? '<path d="M8 5v14"/><path d="M16 5v14"/>'
    : '<path d="M8 6.8v10.4c0 .7.78 1.13 1.38.75l8.18-5.2a.9.9 0 0 0 0-1.5l-8.18-5.2A.9.9 0 0 0 8 6.8Z"/>';
}

function updateRecordButtonIcon(isRecording = false) {
  if (!bottomRecordBtn) return;
  const svg = bottomRecordBtn.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('width', isRecording ? '28' : '24');
  svg.setAttribute('height', isRecording ? '28' : '24');
  svg.setAttribute('fill', isRecording ? 'currentColor' : 'none');
  svg.setAttribute('stroke', isRecording ? 'none' : 'currentColor');
  svg.setAttribute('stroke-width', isRecording ? '0' : '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.innerHTML = isRecording
    ? '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4"/>'
    : '<path d="M12 15a4 4 0 0 0 4-4V7a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/><path d="M8.5 21h7"/>';
}

function updateBottomNavState() {
  if (!bottomRecorderShell) return;

  const hasParts = currentParts.length > 0;
  const canRecord = currentPartSupportsRecording() && typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined';
  const hasRecording = !!getCurrentRecording();

  bottomRecordBtn.disabled = !canRecord;
  bottomRedoBtn.disabled = !hasRecording || mediaRecorder !== null;
  bottomPlaybackBtn.disabled = !hasRecording || mediaRecorder !== null;
  bottomSaveBtn.disabled = !hasRecording || mediaRecorder !== null;

  const isRecording = mediaRecorder?.state === 'recording';
  const isPlaying = currentRecordingAudio && !currentRecordingAudio.paused;
  
  bottomRecordBtn.classList.toggle('recording', !!isRecording);
  updateRecordButtonIcon(isRecording);

  if (isRecording) {
    const elapsed = Date.now() - recordingStartedAt;
    setRecordingStatus(formatRecordingDuration(elapsed), { visible: true, recording: true, pulsing: true });
  } else if (currentRecordingAudio) {
    // Playback/Review Mode
    const recording = getCurrentRecording();
    const durationMs = recording ? recording.durationMs : 0;
    const currentMs = currentRecordingAudio.currentTime * 1000;
    const remainingMs = Math.max(0, durationMs - currentMs);
    const isFinished = currentRecordingAudio.currentTime >= (currentRecordingAudio.duration || (durationMs/1000)) - 0.05;
    
    if (isFinished) {
      setRecordingStatus('00:00', { visible: true, playback: true, pulsing: false });
    } else {
      setRecordingStatus(formatRecordingDuration(remainingMs), { visible: true, playback: true, pulsing: isPlaying });
    }
  } else if (hasRecording) {
    setRecordingStatus(formatRecordingDuration(getCurrentRecording().durationMs), { visible: true, recording: false });
  } else {
    setRecordingStatus('00:00', { visible: true, recording: false });
  }

  updatePlaybackButton(isPlaying);

  // Seeker management
  if (bottomPlaybackSeeker && bottomSeekerProgress && bottomSeekerKnob) {
    const isPlaying = currentRecordingAudio && !currentRecordingAudio.paused;
    bottomPlaybackSeeker.classList.toggle('expanded', hasRecording);
    
    const recording = getCurrentRecording();
    if (isPlaying && recording && recording.durationMs && !isSeekingPlayback) {
      const duration = recording.durationMs / 1000;
      const progress = (currentRecordingAudio.currentTime / duration) * 100;
      bottomSeekerProgress.style.width = `${progress}%`;
      bottomSeekerKnob.style.left = `${progress}%`;
    } else if (!isPlaying && currentRecordingAudio && recording && recording.durationMs && !isSeekingPlayback) {
        // Keep progress visible if paused
        const duration = recording.durationMs / 1000;
        const progress = (currentRecordingAudio.currentTime / duration) * 100;
        bottomSeekerProgress.style.width = `${progress}%`;
        bottomSeekerKnob.style.left = `${progress}%`;
    } else if (!hasRecording) {
      bottomSeekerProgress.style.width = '0%';
      bottomSeekerKnob.style.left = '0%';
    }
  }
}

async function startRecording() {
  if (!currentPartSupportsRecording() || mediaRecorder?.state === 'recording') return;
  
  // Ensure any previous playback is stopped before we start a new session
  stopPlaybackPreview();

  if (getCurrentRecording()) {
    if (!window.confirm('This will delete your current recording so you can prepare and record again. Continue?')) {
      return;
    }
    const key = getCurrentTaskKey();
    if (key && recordings[key]) {
      if (recordings[key].url) URL.revokeObjectURL(recordings[key].url);
      delete recordings[key];
    }
    
    if (recordingLimitTimeout) {
      clearTimeout(recordingLimitTimeout);
      recordingLimitTimeout = null;
    }

    updateBottomNavState();
    return;
  }

  // stopAllPromptAudio(); // Removed: Allow part 4 audio to keep playing
  stopPlaybackPreview();

  try {
    if (mediaStream) {
      const tracks = mediaStream.getAudioTracks();
      const hasLiveTrack = tracks.some(track => track.readyState === 'live');
      if (!hasLiveTrack) {
        mediaStream = null;
      }
    }

    if (!mediaStream) {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    const localChunks = [];
    const mimeType = getSupportedRecordingMimeType();
    const recordingTaskKey = getCurrentTaskKey();
    const localRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType }) : new MediaRecorder(mediaStream);
    mediaRecorder = localRecorder;

    localRecorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        localChunks.push(event.data);
      }
    });

    localRecorder.onerror = (e) => {
      console.error('MediaRecorder error:', e.error);
    };

    localRecorder.oninactive = () => {
      console.warn('MediaRecorder became inactive');
    };

    const localStartedAt = Date.now();
    recordingStartedAt = localStartedAt;

    localRecorder.addEventListener('stop', () => {
      clearRecordingTicker();
      if (recordingLimitTimeout) {
        clearTimeout(recordingLimitTimeout);
        recordingLimitTimeout = null;
      }

      const previous = recordingTaskKey ? recordings[recordingTaskKey] : null;
      if (previous?.url) URL.revokeObjectURL(previous.url);

      const mime = localRecorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(localChunks, { type: mime });
      const durationMs = Date.now() - localStartedAt;

      if (recordingTaskKey && blob.size > 0) {
        recordings[recordingTaskKey] = {
          blob,
          url: URL.createObjectURL(blob),
          durationMs,
          mimeType: mime
        };
      }

      if (mediaRecorder === localRecorder) {
        mediaRecorder = null;
      }
      updateBottomNavState();
    }, { once: true });

    localRecorder.start(1000);
    updateBottomNavState();

    recordingTicker = setInterval(() => {
      updateBottomNavState();
    }, 250);

    const limitSeconds = getRecordingLimitSeconds();
    if (recordingLimitTimeout) clearTimeout(recordingLimitTimeout);
    recordingLimitTimeout = window.setTimeout(() => {
      if (mediaRecorder?.state === 'recording') {
        stopRecording();
      }
    }, limitSeconds * 1000);
  } catch (error) {
    console.error('Failed to start recording:', error);
    setRecordingStatus('Microphone permission was denied', { visible: true, recording: false });
    updateBottomNavState();
  }
}

function stopRecording() {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  }
}

async function toggleRecording() {
  if (mediaRecorder?.state === 'recording') {
    stopRecording();
  } else {
    if (mediaRecorder !== null) return;
    await startRecording();
  }
}

function playCurrentRecording() {
  const recording = getCurrentRecording();
  if (!recording || mediaRecorder?.state === 'recording') return;

  if (currentRecordingAudio && !currentRecordingAudio.paused) {
    stopPlaybackPreview();
    updateBottomNavState();
    return;
  }

  // stopAllPromptAudio(); // Removed: Allow part 4 audio to keep playing
  currentRecordingAudio = new Audio(recording.url);
  currentRecordingAudio.addEventListener('ended', () => {
    // Don't nullify yet, keep it to show the 00:00 state
    clearPlaybackTicker();
    updateBottomNavState();
  }, { once: true });
  currentRecordingAudio.play().then(() => {
    startPlaybackTicker();
    updateBottomNavState();
    setRecordingStatus(formatRecordingDuration(recording.durationMs), { visible: true, recording: false });
  }).catch((error) => {
    console.error('Failed to play recording:', error);
    currentRecordingAudio = null;
    clearPlaybackTicker();
    updateBottomNavState();
  });
}

function saveCurrentRecording() {
  const recording = getCurrentRecording();
  if (!recording || mediaRecorder?.state === 'recording') return;

  const activeDate = activeType === 'homework' ? dateBadge.textContent : lessonDateBadge.textContent;
  const part = currentParts[currentPart] || {};
  const questionLabel = part.questionLabel || `Question ${currentPart + 1}`;
  const extension = getRecordingExtension(recording.mimeType || 'audio/webm');
  
  // Pre-fill filename with a smart default
  const defaultName = [
    sanitizeFilenamePart(activeClass),
    sanitizeFilenamePart(activeDate),
    sanitizeFilenamePart(questionLabel)
  ].join('-');
  
  if (recordingFileName && recordingFileExtension && saveModal) {
    recordingFileName.value = defaultName;
    recordingFileExtension.textContent = `.${extension}`;
    saveModal.classList.add('active');
    
    // Auto-focus input for quick editing
    setTimeout(() => {
      recordingFileName.focus();
      recordingFileName.select();
    }, 50);
  }
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


// ============================
//  Topic Prep Timer Logic
// ============================
window.toggleTopicTimer = function (key, responseTime) {
  const display = document.getElementById(`topic-timer-display-${key}`);
  const valueEl = document.getElementById(`topic-timer-value-${key}`);
  if (!display || !valueEl) return;

  if (!topicTimers[key]) {
    // Start
    topicTimers[key] = { remaining: responseTime, running: true, interval: null };
    display.classList.add('running');
    display.classList.remove('finished');
    valueEl.textContent = formatTime(responseTime);

    topicTimers[key].interval = setInterval(() => {
      topicTimers[key].remaining--;
      valueEl.textContent = formatTime(topicTimers[key].remaining);
      if (topicTimers[key].remaining <= 0) {
        clearInterval(topicTimers[key].interval);
        topicTimers[key].running = false;
        display.classList.remove('running');
        display.classList.add('finished');
        valueEl.textContent = '00:00';
      }
    }, 1000);

  } else if (topicTimers[key].running) {
    // Pause
    clearInterval(topicTimers[key].interval);
    topicTimers[key].running = false;
    display.classList.remove('running');

  } else if (topicTimers[key].remaining > 0) {
    // Resume
    topicTimers[key].running = true;
    display.classList.add('running');
    topicTimers[key].interval = setInterval(() => {
      topicTimers[key].remaining--;
      valueEl.textContent = formatTime(topicTimers[key].remaining);
      if (topicTimers[key].remaining <= 0) {
        clearInterval(topicTimers[key].interval);
        topicTimers[key].running = false;
        display.classList.remove('running');
        display.classList.add('finished');
        valueEl.textContent = '00:00';
      }
    }, 1000);

  } else {
    // Reset
    delete topicTimers[key];
    display.classList.remove('running', 'finished');
    valueEl.textContent = formatTime(responseTime);
  }
};

// ============================
window.isUserSeeking = false;

let youtubeAPILoaded = false;

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (youtubeAPILoaded) return Promise.resolve();

  return new Promise((resolve) => {
    // If the script is already being loaded, we need to wait for onYouTubeIframeAPIReady
    const existingScript = document.querySelector('script[src*="iframe_api"]');
    
    const originalOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      youtubeAPILoaded = true;
      if (originalOnReady) originalOnReady();
      resolve();
    };

    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  });
}

async function initAudioPlayers() {
  // Clear and destroy old YT players to free memory
  if (audioPlayers) {
    Object.values(audioPlayers).forEach(p => {
      if (p && typeof p.destroy === 'function') p.destroy();
    });
  }
  audioPlayers = {};
  youtubePlayerPromises = {};

  // Clear old local audio players
  Object.values(localAudioPlayers).forEach(p => {
    if (p && typeof p.pause === 'function') p.pause();
  });
  localAudioPlayers = {};

  if (audioPoller) cancelAnimationFrame(audioPoller);
  audioPoller = null;

  currentParts.forEach((part, index) => {
    if (part.type === 'respond-info-q' && part.content.audioUrls) {
      // Local audio: load first file (Q7) by default
      const audio = new Audio(part.content.audioUrls[0]);
      audio._urls = part.content.audioUrls;
      audio._currentTrack = 0;
      localAudioPlayers[index] = audio;

      audio.addEventListener('ended', () => {
        const btn = document.getElementById(`audio-btn-${index}`);
        if (btn) btn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>';
        const ctrl = document.getElementById(`audio-ctrl-${index}`);
        if (ctrl) ctrl.classList.remove('playing');
      });

      audio.addEventListener('timeupdate', () => {
        if (window.isUserSeeking) return;
        const seeker = document.getElementById(`seeker-${index}`);
        const timeDisplay = document.getElementById(`time-${index}`);
        if (audio.duration > 0) {
          if (seeker) seeker.value = (audio.currentTime / audio.duration) * 100;
          if (timeDisplay) timeDisplay.textContent = `${formatTime(Math.floor(audio.currentTime))} / ${formatTime(Math.floor(audio.duration))}`;
        }
      });
    }
  });
}

async function ensureYouTubePlayer(index) {
  if (audioPlayers[index]) return audioPlayers[index];
  if (youtubePlayerPromises[index]) return youtubePlayerPromises[index];

  const part = currentParts[index];
  if (!part || part.type !== 'respond-info-q' || !part.content.videoUrl) return null;

  const videoId = extractVideoId(part.content.videoUrl);
  if (!videoId) return null;

  const mount = document.getElementById(`yt-player-${index}`);
  if (!mount) return null;

  const startTime = extractStartTime(part.content.videoUrl);

  youtubePlayerPromises[index] = (async () => {
    await loadYouTubeAPI();

    return new Promise((resolve) => {
      audioPlayers[index] = new YT.Player(`yt-player-${index}`, {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          'autoplay': 0,
          'controls': 0,
          'start': startTime,
          'enablejsapi': 1
        },
        events: {
          'onReady': () => resolve(audioPlayers[index]),
          'onStateChange': (event) => onPlayerStateChange(index, event)
        }
      });
    });
  })();

  try {
    return await youtubePlayerPromises[index];
  } finally {
    delete youtubePlayerPromises[index];
  }
}

function extractVideoId(url) {
  const match = url.match(/embed\/([^?]+)/);
  return match ? match[1] : '';
}

function extractStartTime(url) {
  const match = url.match(/[?&]start=(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function getRespondInfoTimestamps(part) {
  const baseTime = extractStartTime(part.content.videoUrl) || 0;
  const timestamps = part.content.timestamps || {};
  return {
    q8: timestamps.q8 !== undefined ? timestamps.q8 : baseTime,
    q9: timestamps.q9 !== undefined ? timestamps.q9 : baseTime,
    q10: timestamps.q10 !== undefined ? timestamps.q10 : baseTime,
  };
}

function syncYouTubeBookmark(index, currentTime) {
  const part = currentParts[index];
  if (!part || part.type !== 'respond-info-q' || !part.content.videoUrl) return;

  const container = document.getElementById(`bookmarks-${index}`);
  if (!container) return;

  const dots = Array.from(container.querySelectorAll('.bookmark-dot:not(.out-link-icon)'));
  if (dots.length < 3) return;

  const { q8, q9, q10 } = getRespondInfoTimestamps(part);
  let activeDot = dots[0];

  if (currentTime >= q10) {
    activeDot = dots[2];
  } else if (currentTime >= q9) {
    activeDot = dots[1];
  } else if (currentTime >= q8) {
    activeDot = dots[0];
  }

  dots.forEach(dot => dot.classList.remove('active-bookmark'));
  activeDot.classList.add('active-bookmark');
}

window.toggleAudio = async function (index) {
  // Local HTML5 audio
  const local = localAudioPlayers[index];
  if (local) {
    const btn = document.getElementById(`audio-btn-${index}`);
    const ctrl = document.getElementById(`audio-ctrl-${index}`);
    if (local.paused) {
      local.play();
      if (btn) btn.querySelector('svg').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      if (ctrl) ctrl.classList.add('playing');
    } else {
      local.pause();
      if (btn) btn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>';
      if (ctrl) ctrl.classList.remove('playing');
    }
    return;
  }

  // YouTube audio
  const player = await ensureYouTubePlayer(index);
  if (!player) return;
  syncYouTubeBookmark(index, player.getCurrentTime());
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
};

window.seekAudio = async function (index, value) {
  const local = localAudioPlayers[index];
  if (local) {
    local.currentTime = (value / 100) * local.duration;
    return;
  }
  const player = await ensureYouTubePlayer(index);
  if (!player) return;
  const duration = player.getDuration();
  const seekTo = (value / 100) * duration;
  player.seekTo(seekTo, true);
  syncYouTubeBookmark(index, seekTo);
};

window.seekAudioToTime = async function (index, trackIndex) {
  const local = localAudioPlayers[index];
  if (local) {
    // trackIndex is the array index of the audio file to switch to
    const urls = local._urls;
    if (!urls || trackIndex >= urls.length) return;
    const wasPlaying = !local.paused;
    local.pause();
    local._currentTrack = trackIndex;
    local.src = urls[trackIndex];
    local.load();
    if (wasPlaying) local.play();
    else {
      // Also play immediately when bookmark is tapped (mirrors YouTube UX)
      local.play();
      const btn = document.getElementById(`audio-btn-${index}`);
      const ctrl = document.getElementById(`audio-ctrl-${index}`);
      if (btn) btn.querySelector('svg').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      if (ctrl) ctrl.classList.add('playing');
    }
    return;
  }
  const player = await ensureYouTubePlayer(index);
  if (!player || typeof player.seekTo !== 'function') return;
  player.seekTo(trackIndex, true);
  syncYouTubeBookmark(index, trackIndex);
};

window.seekBy = async function (index, seconds) {
  const local = localAudioPlayers[index];
  if (local) {
    local.currentTime = Math.max(0, local.currentTime + seconds);
    return;
  }
  const player = await ensureYouTubePlayer(index);
  if (!player || typeof player.getCurrentTime !== 'function') return;
  const currentTime = player.getCurrentTime();
  player.seekTo(currentTime + seconds, true);
};

window.setActiveBookmark = function (btn, index) {
  const container = document.getElementById(`bookmarks-${index}`);
  if (!container) return;
  const dots = container.querySelectorAll('.bookmark-dot:not(.out-link-icon)');
  dots.forEach(d => d.classList.remove('active-bookmark'));
  btn.classList.add('active-bookmark');
};

function onPlayerStateChange(index, event) {
  const btn = document.getElementById(`audio-btn-${index}`);
  if (!btn) return;
  const icon = btn.querySelector('svg');

  if (event.data === YT.PlayerState.PLAYING) {
    icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    btn.closest('.audio-standalone').classList.add('playing');
    syncYouTubeBookmark(index, audioPlayers[index].getCurrentTime());
    
    // Start progress loop only while playing
    if (!audioPoller) {
      const loop = () => {
        updateAudioProgress();
        audioPoller = requestAnimationFrame(loop);
      };
      audioPoller = requestAnimationFrame(loop);
    }
  } else {
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    btn.closest('.audio-standalone').classList.remove('playing');
    
    // Stop loop if no video is playing
    const anyPlaying = Object.values(audioPlayers).some(p => {
        try { return p.getPlayerState() === YT.PlayerState.PLAYING; } catch(e) { return false; }
    });
    if (!anyPlaying && audioPoller) {
      cancelAnimationFrame(audioPoller);
      audioPoller = null;
    }
  }
}

function updateAudioProgress() {
  if (window.isUserSeeking) return;

  for (const index in audioPlayers) {
    const player = audioPlayers[index];
    const seeker = document.getElementById(`seeker-${index}`);
    const timeDisplay = document.getElementById(`time-${index}`);

    if (player && typeof player.getDuration === 'function') {
      const duration = player.getDuration();
      if (duration > 0) {
        const current = player.getCurrentTime();
        const percent = (current / duration) * 100;
        if (seeker) seeker.value = percent;
        if (timeDisplay) {
          timeDisplay.textContent = `${formatTime(Math.floor(current))} / ${formatTime(Math.floor(duration))}`;
        }
        syncYouTubeBookmark(index, current);
      }
    }
  }
}


// ============================
//  Clear active states
// ============================
function clearActiveEntries() {
  document.querySelectorAll('.date-entry.active').forEach(el => el.classList.remove('active'));
}

// ============================
//  Show / Hide Viewers
// ============================
function showHomeworkViewer() {
  welcomeState.style.display = 'none';
  lessonViewer.style.display = 'none';
  homeworkViewer.style.display = 'flex';
  homeworkViewer.style.animation = 'none';
  homeworkViewer.offsetHeight;
  homeworkViewer.style.animation = '';
}

function showLessonViewer() {
  welcomeState.style.display = 'none';
  homeworkViewer.style.display = 'none';
  lessonViewer.style.display = 'flex';
  lessonViewer.style.animation = 'none';
  lessonViewer.offsetHeight;
  lessonViewer.style.animation = '';
}

// --- Data Cache ---
const dataCache = {};

async function getClassData(className) {
  if (dataCache[className]) return dataCache[className];
  
  try {
    const response = await fetch(`data/${className}.json`);
    const data = await response.json();
    dataCache[className] = data;
    return data;
  } catch (err) {
    console.error(`Failed to load data for ${className}:`, err);
    return null;
  }
}

// ============================
//  Homework Selection
// ============================
window.selectHomework = async function (className, date) {
  if (mediaRecorder?.state === 'recording') stopRecording();
  if (recordingLimitTimeout) {
    clearTimeout(recordingLimitTimeout);
    recordingLimitTimeout = null;
  }
  stopPlaybackPreview();
  clearActiveEntries();
  clearAllTimers();
  const entry = document.getElementById(`entry-${className}-homework-${date}`);
  if (entry) entry.classList.add('active');

  const classData = await getClassData(className);
  if (!classData) return;

  const homework = classData.homework.find(hw => hw.date === date);
  if (!homework) return;

  currentParts = homework.parts;
  currentPart = 0;

  activeClass = className;
  activeType = 'homework';
  const activeDate = date; // Local reference for clarity
  dateBadge.textContent = date;
  renderCards();
  renderPagination();
  showHomeworkViewer();
  saveAppState(className, 'homework', date, currentPart);
  updateBottomNavState();
};

// ============================
//  Lesson Selection
// ============================
window.selectLesson = async function (className, date) {
  if (mediaRecorder?.state === 'recording') stopRecording();
  if (recordingLimitTimeout) {
    clearTimeout(recordingLimitTimeout);
    recordingLimitTimeout = null;
  }
  stopPlaybackPreview();
  clearActiveEntries();
  clearAllTimers();
  const entry = document.getElementById(`entry-${className}-lesson-${date}`);
  if (entry) entry.classList.add('active');

  const classData = await getClassData(className);
  if (!classData) return;

  const lesson = classData.lesson.find(l => l.date === date);
  if (!lesson) return;

  activeClass = className;
  activeType = 'lesson';
  const activeDate = date; // Local reference for clarity
  lessonDateBadge.textContent = date;
  renderLesson(lesson);
  showLessonViewer();
  saveAppState(className, 'lesson', date, 0);
  updateBottomNavState();
};

// ============================
//  Card Rendering
// ============================
function renderCards() {
  let html = '';

  currentParts.forEach((part, index) => {

    // ── Topic Preparation: render as stacked full cards ──────────────────────
    if (part.type === 'topic-prep') {
      const questions = part.questions || [];
      const responseTime = part.responseTime || 30;
      html += `<div class="topic-prep-stack">`;
      questions.forEach((q, i) => {
        const key = `${index}-${i}`;
        html += `
          <div class="part-card">
            <div class="card-header-bar">
              <span class="card-header-left">Topic Preparation</span>
              <span class="card-header-right">Question ${i + 1}</span>
            </div>
            <div class="card-body">
              <div class="part-content">
                <div class="prep-stack-question">${formatMarkdown(q)}</div>
              </div>
            </div>
            <div class="card-footer">
              <div class="response-timer" onclick="toggleTopicTimer('${key}', ${responseTime})" id="topic-timer-${key}">
                <div class="timer-display" id="topic-timer-display-${key}">
                  <span id="topic-timer-value-${key}">${formatTime(responseTime)}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      return; // skip normal card rendering
    }
    // ─────────────────────────────────────────────────────────────────────────

    let typeCategory = TYPE_LABELS[part.type] || 'TOEIC';
    const responseTime = part.responseTime || RESPONSE_TIMES[part.type] || 45;

    // Fix: If it's an Opinion Essay (Writing Q8), label it as Writing instead of Speaking
    if (part.type === 'opinion' && part.label === 'Write an Opinion Essay') {
      typeCategory = 'TOEIC Writing';
    }

    html += `<div class="part-card">`;

    // Header bar
    let qLabel = part.questionLabel || `Question ${index + 1}`;
    
    // Force programmatic grouping for standard TOEIC Speaking parts ONLY IF not explicitly defined in JSON
    if (!part.questionLabel) {
      if (part.type === 'describe-picture') {
        if (index === 2 || index === 3) qLabel = 'Question 3-4';
      } else if (part.type === 'respond-questions-15' || part.type === 'respond-questions-30') {
        if (index === 4 || index === 5) qLabel = 'Question 5-6';
        if (index === 6) qLabel = 'Question 7';
      }
    }
    html += `
      <div class="card-header-bar">
        <span class="card-header-left">${typeCategory}</span>
        <span class="card-header-right">${qLabel}</span>
      </div>
    `;

    // Body
    html += `<div class="card-body">`;
    html += `<div class="part-content">`;
    html += renderPartContent(part, index);
    html += `</div></div>`;

    // Footer with response timer or audio control
    const hasAudio = part.content && (part.content.videoUrl || part.content.audioUrls);
    const hasTimer = part.type !== 'sentence-picture' && part.type !== 'topic-prep' && (part.prepTime || part.responseTime || (part.type !== 'respond-info-q' && RESPONSE_TIMES[part.type]));
    if (hasAudio || hasTimer) {
      if (hasAudio && part.type === 'respond-info-q') {
        html += `<div class="card-footer" style="flex-direction: column; align-items: center; gap: 4px;">`;
      } else {
        html += `<div class="card-footer">`;
      }

      if (hasAudio && part.type === 'respond-info-q') {
        if (part.content.audioUrls) {
          // ── Local WebM audio (Q7/Q8/Q9 per separate file) ──────────────────
          const labels = part.content.questionLabels || ['7', '8', '9'];
          html += `
            <div class="audio-standalone" id="audio-ctrl-${index}">
              <button class="audio-toggle-btn" onclick="event.stopPropagation(); toggleAudio(${index})" id="audio-btn-${index}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <div class="audio-seeker-container">
                <input type="range" class="audio-seeker" id="seeker-${index}" min="0" max="100" value="0" step="0.1"
                       onmousedown="event.stopPropagation(); isUserSeeking = true;"
                       onmouseup="event.stopPropagation(); isUserSeeking = false;"
                       oninput="event.stopPropagation(); seekAudio(${index}, this.value)">
              </div>
              <div class="audio-time" id="time-${index}" style="white-space: nowrap;">00:00 / 00:00</div>
              <div class="audio-bookmarks" id="bookmarks-${index}">
                ${labels.map((lbl, ti) => `<button class="bookmark-dot${ti === 0 ? ' active-bookmark' : ''}" onclick="event.stopPropagation(); seekAudioToTime(${index}, ${ti}); setActiveBookmark(this, ${index})" title="Play Question ${lbl}">${lbl}</button>`).join('')}
              </div>
            </div>
          `;
        } else {
          // ── YouTube audio ────────────────────────────────────────────────
          const { q8: q8Time, q9: q9Time, q10: q10Time } = getRespondInfoTimestamps(part);

          const videoId = extractVideoId(part.content.videoUrl);
          const watchLink = videoId ? `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(q8Time)}s` : part.content.videoUrl;

          html += `
            <div class="audio-standalone" id="audio-ctrl-${index}">
                <button class="audio-toggle-btn" onclick="event.stopPropagation(); toggleAudio(${index})" id="audio-btn-${index}">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <div class="audio-seeker-container">
                  <input type="range" class="audio-seeker" id="seeker-${index}" min="0" max="100" value="0" step="0.1" 
                         onmousedown="event.stopPropagation(); isUserSeeking = true;" 
                         onmouseup="event.stopPropagation(); isUserSeeking = false;"
                         oninput="event.stopPropagation(); seekAudio(${index}, this.value)">
                </div>
                <div class="audio-time" id="time-${index}" style="white-space: nowrap;">00:00 / 00:00</div>
                <div class="audio-bookmarks" id="bookmarks-${index}">
                  <button class="bookmark-dot active-bookmark" data-time="${q8Time}" onclick="event.stopPropagation(); seekAudioToTime(${index}, ${q8Time}); setActiveBookmark(this, ${index})" title="Jump to Question 8">8</button>
                  <button class="bookmark-dot" data-time="${q9Time}" onclick="event.stopPropagation(); seekAudioToTime(${index}, ${q9Time}); setActiveBookmark(this, ${index})" title="Jump to Question 9">9</button>
                  <button class="bookmark-dot" data-time="${q10Time}" onclick="event.stopPropagation(); seekAudioToTime(${index}, ${q10Time}); setActiveBookmark(this, ${index})" title="Jump to Question 10">10</button>
                  <a class="bookmark-dot out-link-icon" href="${watchLink}" target="_blank" rel="noopener noreferrer" title="Watch on YouTube" onclick="if(!confirm('You are about to be redirected to YouTube.')) { event.preventDefault(); }">
                    <svg width="15" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.582 6.186a2.665 2.665 0 0 0-1.884-1.898C18.035 3.8 12 3.8 12 3.8s-6.035 0-7.698.488a2.665 2.665 0 0 0-1.884 1.898C1.916 8.07 1.916 12 1.916 12s0 3.93.502 5.814a2.665 2.665 0 0 0 1.884 1.898c1.663.488 7.698.488 7.698.488s6.035 0 7.698-.488a2.665 2.665 0 0 0 1.884-1.898c.502-1.884.502-5.814.502-5.814s0-3.93-.502-5.814z" fill="#FF0000"/>
                      <path d="M9.9 15.568V8.432L16.173 12l-6.273 3.568z" fill="#FFFFFF"/>
                    </svg>
                  </a>
                </div>
              <div id="yt-player-${index}" class="hidden-player"></div>
            </div>
          `;
        }
      } else if (hasTimer) {
        const displayTime = part.prepTime || responseTime;
        html += `
          <div class="response-timer" onclick="toggleTimer(${index}, ${responseTime})" id="timer-${index}">
            <div class="timer-display" id="timer-display-${index}">
              <span id="timer-value-${index}">${formatTime(displayTime)}</span>
            </div>
          </div>
        `;
      }

      html += `</div>`;
    }

    html += `</div>`;
  });

  cardTrack.innerHTML = html;
  initAudioPlayers();
  goToPart(0);
}

function renderPartContent(part, partIndex) {
  switch (part.type) {
    case 'read-aloud':
      return `<div class="reading-passage">${part.content.passage}</div>`;

    case 'describe-picture':
      if (part.content.imageUrl) {
        return `
          <div class="picture-container">
            <img src="${part.content.imageUrl}" alt="Describe this picture" title="Expand">
          </div>
        `;
      }
      return `
        <div class="picture-container" style="display:flex;align-items:center;justify-content:center;height:240px;font-size:48px;">
          ${part.content.imagePlaceholder || '🖼️'}
        </div>
      `;

    case 'respond-questions-30':
    case 'respond-questions-15': {
      return `<div class="question-text">${formatMarkdown(part.content.question)}</div>`;
    }

    case 'respond-info': {
      let tableHtml = '<table class="info-block"><thead><tr>';
      if (part.content.headers) {
        part.content.headers.forEach(h => { tableHtml += `<th>${h}</th>`; });
      }
      tableHtml += '</tr></thead><tbody>';
      if (part.content.rows) {
        part.content.rows.forEach(row => {
          tableHtml += '<tr>';
          row.forEach(cell => { tableHtml += `<td>${cell}</td>`; });
          tableHtml += '</tr>';
        });
      }
      tableHtml += '</tbody></table>';
      if (part.content.question) {
        tableHtml += `<div class="question-text" style="margin-top:16px;">${formatMarkdown(part.content.question)}</div>`;
      }
      return tableHtml;
    }

    case 'respond-info-q':
      return `
        ${part.content.imageUrl ? `
          <div class="picture-container">
            <img src="${part.content.imageUrl}" alt="Information provided" title="Expand">
          </div>
        ` : ''}
        ${part.content.question ? `
          <div class="reveal-section">
            <button class="reveal-btn" onclick="const q = this.nextElementSibling; q.classList.toggle('visible')">Transcript</button>
            <div class="question-text reveal-content" style="text-align:left; font-size:16px;">${formatMarkdown(part.content.question)}</div>
          </div>
        ` : ''}
      `;

    case 'opinion': {
      const isEssay = part.label === 'Write an Opinion Essay';
      return `<div class="opinion-prompt">${isEssay ? '<strong>Essay:</strong> ' : ''}${formatMarkdown(part.content.prompt)}</div>`;
    }

    case 'email-response':
      return `
        <div class="email-block">
          <div class="email-meta">
            ${part.content.from ? `<div><strong>From:</strong> ${part.content.from}</div>` : ''}
            ${part.content.to ? `<div><strong>To:</strong> ${part.content.to}</div>` : ''}
            ${part.content.subject ? `<div><strong>Subject:</strong> ${part.content.subject}</div>` : ''}
            ${part.content.sent ? `<div><strong>Sent:</strong> ${part.content.sent}</div>` : ''}
          </div>
          <div class="email-body">${part.content.body.replace(/\n/g, '<br>')}</div>
        </div>
        <p class="email-instruction"><strong>Direction:</strong> ${part.content.instruction}</p>
      `;

    case 'sentence-picture':
      return `
        <div class="picture-container">
          ${part.content.imageUrl
          ? `<img src="${part.content.imageUrl}" alt="Write about this picture" title="Expand">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:48px;">${part.content.imagePlaceholder || '🖼️'}</div>`
        }
        </div>
        ${part.content.words ? `<div class="sentence-words">${part.content.words[0]} / ${part.content.words[1]}</div>` : ''}
      `;

    case 'topic-prep': {
      const questions = part.questions || [];
      const responseTime = part.responseTime || 30;
      const topicBadge = part.topic ? `<div class="prep-topic-badge">${part.topic}</div>` : '';
      const instruction = part.instruction ? `<p class="prep-instruction">${part.instruction}</p>` : '';
      const miniCards = questions.map((q, i) => {
        const key = `${partIndex}-${i}`;
        return `
          <div class="prep-mini-card">
            <div class="prep-mini-card-header">
              <span class="prep-mini-counter">${i + 1} / ${questions.length}</span>
            </div>
            <div class="prep-mini-question">${formatMarkdown(q)}</div>
            <div class="prep-mini-footer">
              <div class="response-timer" onclick="toggleTopicTimer('${key}', ${responseTime})" id="topic-timer-${key}">
                <div class="timer-display" id="topic-timer-display-${key}">
                  <span id="topic-timer-value-${key}">${formatTime(responseTime)}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      return `
        <div class="topic-prep-content">
          <div class="prep-header-row">
            ${topicBadge}
            ${instruction}
          </div>
          <div class="prep-mini-cards">${miniCards}</div>
        </div>
      `;
    }

    default:
      return `<div class="reading-passage">${JSON.stringify(part.content)}</div>`;
  }
}

// ============================
//  Pagination
// ============================
function renderPagination() {
  let html = '';
  currentParts.forEach((_, index) => {
    html += `<button class="pagination-dot ${index === currentPart ? 'active' : ''}" onclick="goToPart(${index})" aria-label="Go to part ${index + 1}"></button>`;
  });
  pagination.innerHTML = html;
}

window.goToPart = function (index) {
  if (mediaRecorder?.state === 'recording') {
    stopRecording();
  }
  if (recordingLimitTimeout) {
    clearTimeout(recordingLimitTimeout);
    recordingLimitTimeout = null;
  }
  stopPlaybackPreview();
  if (index !== currentPart) {
    clearAllTimers();
  }
  currentPart = index;
  cardTrack.style.transform = `translateX(calc(-${index * 100}% - ${index * 32}px))`;
  updatePaginationDots();

  // Save current part
  const activeDate = activeType === 'homework' ? dateBadge.textContent : lessonDateBadge.textContent;
  saveAppState(activeClass, activeType, activeDate, currentPart);

  // Pause all audio when moving away from a part
  Object.values(audioPlayers).forEach(p => {
    if (p && p.pauseVideo) p.pauseVideo();
  });
  Object.values(localAudioPlayers).forEach(p => {
    if (p && !p.paused) {
      p.pause();
      const entries = Object.entries(localAudioPlayers);
      const idx = entries.find(([, v]) => v === p)?.[0];
      if (idx !== undefined) {
        const btn = document.getElementById(`audio-btn-${idx}`);
        const ctrl = document.getElementById(`audio-ctrl-${idx}`);
        if (btn) btn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>';
        if (ctrl) ctrl.classList.remove('playing');
      }
    }
  });

  const part = currentParts[index];
  if (part && part.type === 'respond-info-q' && part.content.videoUrl) {
    ensureYouTubePlayer(index);
  }

  updateBottomNavState();
};

function updatePaginationDots() {
  const dots = pagination.querySelectorAll('.pagination-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentPart);
  });
}

// ============================
//  Lesson Rendering
// ============================
function renderLesson(lesson) {
  let html = '';

  if (lesson.vocab && lesson.vocab.length > 0) {
    html += `<div class="lesson-section"><div class="lesson-section-title">Vocabulary</div><ul class="vocab-list">`;
    lesson.vocab.forEach(v => {
      html += `
        <li class="vocab-item">
          <div class="vocab-word">${v.word}</div>
          <div class="vocab-def">${v.definition}</div>
          <div class="vocab-example">"${v.example}"</div>
        </li>
      `;
    });
    html += `</ul></div>`;
  }

  if (lesson.structures && lesson.structures.length > 0) {
    html += `<div class="lesson-section"><div class="lesson-section-title">Structures</div><ul class="structure-list">`;
    lesson.structures.forEach(s => {
      html += `
        <li class="structure-item">
          <div class="structure-pattern">${s.pattern}</div>
          <div class="structure-example">${s.example.replace(/\n/g, '<br>')}</div>
        </li>
      `;
    });
    html += `</ul></div>`;
  }

  lessonContent.innerHTML = html;
}

// ============================
//  Keyboard Navigation
// ============================
document.addEventListener('keydown', (e) => {
  // If image modal is open, prevent arrow keys from navigating tasks
  const imageModal = document.getElementById('imageModal');
  if (imageModal && imageModal.classList.contains('active')) return;

  if (homeworkViewer.style.display !== 'none') {
    // Handle Shift + Arrows for seeking audio
    if (e.shiftKey) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (typeof window.seekBy === 'function') window.seekBy(currentPart, 1);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (typeof window.seekBy === 'function') window.seekBy(currentPart, -1);
        return;
      }
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentPart < currentParts.length - 1) goToPart(currentPart + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentPart > 0) goToPart(currentPart - 1);
    }
  }
});

// ============================
//  Swipe Support (touch)
// ============================
let touchStartX = 0;
let touchEndX = 0;

cardContainer.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

cardContainer.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const diff = touchStartX - touchEndX;
  const threshold = 50;
  if (Math.abs(diff) > threshold) {
    if (diff > 0 && currentPart < currentParts.length - 1) {
      goToPart(currentPart + 1);
    } else if (diff < 0 && currentPart > 0) {
      goToPart(currentPart - 1);
    }
  }
}

// ============================
//  Dropdown Selection Logic
// ============================
const homeworkDropdown = document.getElementById('homeworkDropdown');
const lessonDropdown = document.getElementById('lessonDropdown');

function renderDropdown(type) {
  const dropdown = type === 'homework' ? homeworkDropdown : lessonDropdown;
  const items = CLASSES_DATA[activeClass][type];
  const currentDate = type === 'homework' ? dateBadge.textContent : lessonDateBadge.textContent;

  let html = '';
  items.forEach(item => {
    html += `
      <div class="dropdown-item ${item.date === currentDate ? 'active' : ''}" 
           onclick="handleDropdownSelect('${activeClass}', '${type}', '${item.date}')">
        ${item.date}
      </div>
    `;
  });
  dropdown.innerHTML = html;
}

window.handleDropdownSelect = function (className, type, date) {
  if (type === 'homework') selectHomework(className, date);
  else selectLesson(className, date);
  closeAllDropdowns();
};

function toggleDropdown(type) {
  const dropdown = type === 'homework' ? homeworkDropdown : lessonDropdown;
  const isShowing = dropdown.classList.contains('show');
  closeAllDropdowns();
  if (!isShowing) {
    renderDropdown(type);
    dropdown.classList.add('show');
    const badgeDropdown = dropdown.closest('.badge-dropdown');
    if (badgeDropdown) badgeDropdown.classList.add('open');
  }
}

function closeAllDropdowns() {
  homeworkDropdown.classList.remove('show');
  lessonDropdown.classList.remove('show');
  document.querySelectorAll('.badge-dropdown.open').forEach(el => el.classList.remove('open'));
}

dateBadge.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown('homework');
});

lessonDateBadge.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown('lesson');
});

document.addEventListener('click', () => {
  closeAllDropdowns();
});

// --- Sidebar Resize & Collapse ---
const sidebar = document.getElementById('sidebar');
const resizeHandle = document.getElementById('sidebarResizeHandle');
const collapseBtn = document.getElementById('sidebarCollapseBtn');

// Initial width and collapsed state are set via inline script in index.html to prevent FOUC

// Force a browser reflow to apply the instant changes
sidebar.offsetHeight;

// Restore transition
sidebar.style.transition = '';

// Collapse toggle
const toggleSidebar = () => {
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
};

collapseBtn.addEventListener('click', toggleSidebar);
const collapseBtnInternal = document.getElementById('sidebarCollapseBtnInternal');
if (collapseBtnInternal) {
  collapseBtnInternal.addEventListener('click', toggleSidebar);
}

// Click outside to collapse (Mobile only)
document.addEventListener('click', (e) => {
  // Only auto-collapse on mobile/tablet (less than 1024px)
  if (window.innerWidth > 1024) return;

  const isSidebarOpen = !sidebar.classList.contains('collapsed');
  const isToggleButton = collapseBtn.contains(e.target) || (collapseBtnInternal && collapseBtnInternal.contains(e.target));
  
  // Check if click was outside sidebar AND not on the toggle buttons
  if (isSidebarOpen && !sidebar.contains(e.target) && !isToggleButton) {
    toggleSidebar();
  }
});

// Drag to resize
let isResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isResizing = true;
  sidebar.classList.add('resizing');
  document.body.style.cursor = 'col-resize';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const newWidth = Math.min(400, Math.max(240, e.clientX));
  sidebar.style.width = newWidth + 'px';
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  sidebar.classList.remove('resizing');
  document.body.style.cursor = '';
  localStorage.setItem('sidebarWidth', sidebar.style.width);
  // If dragged very narrow, snap to collapsed
  if (parseInt(sidebar.style.width) < 120) {
    sidebar.classList.add('collapsed');
    localStorage.setItem('sidebarCollapsed', 'true');
  }
});

// ============================
//  Sidebar Rendering
// ============================
function renderSidebar() {
  let html = '';

  for (const [className, classData] of Object.entries(CLASSES_DATA)) {
    html += `
      <div class="class-group" data-class="${className}">
        <div class="class-header" onclick="toggleClass('${className}')">
          <div style="display:flex; align-items:center; gap:12px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary);"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>${className}</span>
          </div>
          <svg class="class-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="class-children">
    `;

    if (classData.homework) {
      for (const hw of classData.homework) {
        const hwLabel = hw.date.split(']')[0].replace('[', '') + ' ' + hw.date.split(']')[1].trim();
        html += `
          <div class="date-entry" id="entry-${className}-homework-${hw.date}" onclick="selectHomework('${className}', '${hw.date}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>
            <span>${hwLabel}</span>
          </div>`;
      }
    }

    if (classData.lesson) {
      for (const lesson of classData.lesson) {
        const lessonLabel = lesson.date.split(']')[0].replace('[', '') + ' ' + lesson.date.split(']')[1].trim();
        html += `
          <div class="date-entry" id="entry-${className}-lesson-${lesson.date}" onclick="selectLesson('${className}', '${lesson.date}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary);"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span>${lessonLabel}</span>
          </div>`;
      }
    }

    html += `</div></div>`;
  }

  sidebarNav.innerHTML = html;
}

// ============================
//  Sidebar Toggle Functions
// ============================
window.toggleClass = function (className) {
  const group = document.querySelector(`.class-group[data-class="${className}"]`);
  group.classList.toggle('expanded');
};

window.toggleCategory = function (className, category) {
  const classGroup = document.querySelector(`.class-group[data-class="${className}"]`);
  const catGroup = classGroup.querySelector(`.category-group[data-category="${category}"]`);
  catGroup.classList.toggle('expanded');
};

// ============================
//  State Persistence
// ============================
function saveAppState(className, type, date, partIndex) {
  const state = { className, type, date, partIndex };
  localStorage.setItem('toeicAppState', JSON.stringify(state));
}

async function restoreAppState() {
  const saved = localStorage.getItem('toeicAppState');
  if (!saved) return;

  try {
    const { className, type, date, partIndex } = JSON.parse(saved);
    if (type === 'homework') {
      await selectHomework(className, date);
      goToPart(partIndex);
    } else if (type === 'lesson') {
      await selectLesson(className, date);
    }
  } catch (e) {
    console.error('Failed to restore app state:', e);
  }
}

// Initialize
renderSidebar();
restoreAppState();
updateBottomNavState();

// ============================
//  Mobile UI Auto-Hide
// ============================
let lastScrollY = window.scrollY;
let accumulatedScrollUp = 0;
let accumulatedScrollDown = 0;
let controlHideTimeout = null;

function showMobileControls() {
  document.body.classList.remove('mobile-controls-hidden');
  resetControlTimer();
}

function hideMobileControls() {
  if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('collapsed')) {
    document.body.classList.add('mobile-controls-hidden');
  }
  accumulatedScrollUp = 0;
  accumulatedScrollDown = 0;
}

function resetControlTimer() {
  if (controlHideTimeout) clearTimeout(controlHideTimeout);
  if (window.innerWidth > 1024) return;
  
  controlHideTimeout = setTimeout(() => {
    hideMobileControls();
  }, 3000);
}

// Listen to scroll to detect intent
window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY || document.documentElement.scrollTop;
  
  if (window.innerWidth > 1024) {
    showMobileControls();
    return;
  }
  
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  // Auto-show ONLY if we natively pull down into overscroll (negative scrollY)
  // OR if we hit the absolute top (0) on a legitimately tall scrollable page.
  // This explicitly ignores bottom-bounces landing on 0 for short task-cards.
  if (currentScrollY < 0 || (currentScrollY <= 0 && maxScroll > 50)) {
    showMobileControls();
    accumulatedScrollUp = 0;
    accumulatedScrollDown = 0;
  } else if (currentScrollY < lastScrollY) {
    // Scrolling upwards
    accumulatedScrollUp += (lastScrollY - currentScrollY);
    accumulatedScrollDown = 0;
    if (accumulatedScrollUp > 300) { // Firm upward intent
      showMobileControls();
    }
  } else if (currentScrollY > lastScrollY) {
    // Scrolling downwards
    accumulatedScrollDown += (currentScrollY - lastScrollY);
    accumulatedScrollUp = 0;
    if (accumulatedScrollDown > 30) { // Slight scroll down hides layout
      hideMobileControls();
    }
  }
  
  lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY; // Handle mobile scroll bouncing
  resetControlTimer();
}, { passive: true });

// Any click on the page should immediately reveal the UI if it's currently hidden (solves the short-card scrolling trap)
document.body.addEventListener('click', (e) => {
  if (document.body.classList.contains('mobile-controls-hidden')) {
    // Exclude timer interactions from summoning the UI, so it doesn't distract the student when a test starts
    if (!e.target.closest('.timer-display')) {
      showMobileControls();
    }
  }

  // If the user actually tapped the nav buttons themselves, forcefully reset the disappearing timer
  if (e.target.closest('.sidebar-toggle-btn') || e.target.closest('.theme-toggle-wrapper')) {
    resetControlTimer();
  }

  // Intercept any image clicks in the main content area for the zoom modal
  if (e.target.tagName === 'IMG' && e.target.closest('.main') && !e.target.closest('#imageModal')) {
    openImageModal(e.target.src);
  }
}, { passive: true });

document.body.addEventListener('touchstart', (e) => {
  if (e.target.closest('.sidebar-toggle-btn') || e.target.closest('.theme-toggle-wrapper') || e.target.closest('.bottom-recorder-shell') || e.target.closest('.bottom-recorder-handle')) {
    resetControlTimer();
  }
}, { passive: true });

if (bottomRecorderHandle) {
  bottomRecorderHandle.addEventListener('click', () => {
    showMobileControls();
  });

  bottomRecorderHandle.addEventListener('touchstart', () => {
    showMobileControls();
  }, { passive: true });
}

if (bottomRecordBtn) {
  bottomRecordBtn.addEventListener('click', async () => {
    await toggleRecording();
    resetControlTimer();
  });
}

if (bottomRedoBtn) {
  bottomRedoBtn.addEventListener('click', async () => {
    if (!getCurrentRecording() || mediaRecorder !== null) return;
    
    const key = getCurrentTaskKey();
    if (key && recordings[key]) {
      if (recordings[key].url) URL.revokeObjectURL(recordings[key].url);
      delete recordings[key];
    }
    stopPlaybackPreview();
    updateBottomNavState();
    
    await startRecording();
    resetControlTimer();
  });
}

if (bottomPlaybackBtn) {
  bottomPlaybackBtn.addEventListener('click', () => {
    playCurrentRecording();
    resetControlTimer();
  });
}

if (bottomSaveBtn) {
  bottomSaveBtn.addEventListener('click', () => {
    saveCurrentRecording();
    resetControlTimer();
  });
}

// Modal Listeners
if (cancelSaveBtn) {
  cancelSaveBtn.addEventListener('click', () => {
    saveModal.classList.remove('active');
  });
}

if (confirmSaveBtn) {
  const performSave = () => {
    const recording = getCurrentRecording();
    if (!recording) return;
    
    const extension = getRecordingExtension(recording.mimeType || 'audio/webm');
    const customName = (recordingFileName.value.trim() || 'recording') + `.${extension}`;
    
    const link = document.createElement('a');
    link.href = recording.url;
    link.download = customName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    saveModal.classList.remove('active');
  };

  confirmSaveBtn.addEventListener('click', performSave);
  
  // Allow Enter key to save
  recordingFileName?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSave();
    } else if (e.key === 'Escape') {
      saveModal.classList.remove('active');
    }
  });
}

// Initialize auto-hide check globally
resetControlTimer();

// Seeker interaction
if (bottomPlaybackSeeker) {
  const handleSeek = (e) => {
    const recording = getCurrentRecording();
    if (!currentRecordingAudio || !recording || !recording.durationMs) return;
    const duration = recording.durationMs / 1000;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = bottomPlaybackSeeker.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    
    // Update visuals immediately for smoothness
    bottomSeekerProgress.style.width = `${percent * 100}%`;
    bottomSeekerKnob.style.left = `${percent * 100}%`;
    
    currentRecordingAudio.currentTime = percent * duration;
  };

  bottomPlaybackSeeker.addEventListener('mousedown', (e) => {
    isSeekingPlayback = true;
    handleSeek(e);
    const move = (me) => handleSeek(me);
    const up = () => {
      isSeekingPlayback = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      updateBottomNavState();
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });

  bottomPlaybackSeeker.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isSeekingPlayback = true;
    handleSeek(e);
    const move = (me) => handleSeek(me);
    const up = () => {
      isSeekingPlayback = false;
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      updateBottomNavState();
    };
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
  }, { passive: false });
}

// Image Modal functionality
function openImageModal(src) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalContent');
  if (modal && modalImg) {
    modalImg.src = src;
    modal.classList.add('active');
  }
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('imageModal');
    if (modal && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  }
});

// Initialize dragging
initNavDragging();
