'use strict';

// ============================
//  Theme Logic
// ============================
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

const currentTheme = localStorage.getItem('theme');

// Initial theme application is now handled by an inline script in index.html to prevent FOUC

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
});

// ============================
//  Global State & Config
// ============================

// State
let currentPart = 0;
let currentParts = [];
let activeClass = '';
let activeType = ''; // 'homework' or 'lesson'
let recognition = null; // Still kept for compatibility check
let deepgramSocket = null;
let dgStreamRecorder = null;
let isVoiceNoteEnabled = false;
let isRecognitionActive = false;
const DEEPGRAM_KEY = '2f69e8e6cb6425de2b5b118670d4da8bf95c68c8';

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

// --- DOM refs ---
const welcomeState = document.getElementById('welcomeState');
const homeworkViewer = document.getElementById('homeworkViewer');
const lessonViewer = document.getElementById('lessonViewer');
const dateBadge = document.getElementById('dateBadge');
const lessonDateBadge = document.getElementById('lessonDateBadge');
const lessonContent = document.getElementById('lessonContent');
const recordingStatus = document.getElementById('recordingStatus');
const recordingStatusText = document.getElementById('recordingStatusText');
const saveModal = document.getElementById('saveModal');
const recordingFileName = document.getElementById('recordingFileName');
const recordingFileExtension = document.getElementById('recordingFileExtension');
const cancelSaveBtn = document.getElementById('cancelSave');
const confirmSaveBtn = document.getElementById('confirmSave');

// --- Recorder state ---
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
const QUICK_REDO_WARNING_KEY = 'toeicQuickRedoWarningSeen';

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
//  Recording Helpers
// ============================
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

function getRecordingExtension(mimeType) {
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

function getRecordingLimitSeconds() {
  // Flat 2-minute limit (120s) for all recording sessions
  return 120;
}

function shouldWarnForQuickRedo() {
  try {
    return localStorage.getItem(QUICK_REDO_WARNING_KEY) !== 'true';
  } catch (error) {
    return true;
  }
}

function markQuickRedoWarningSeen() {
  try {
    localStorage.setItem(QUICK_REDO_WARNING_KEY, 'true');
  } catch (error) {
    // Ignore storage failures and keep the flow usable.
  }
}

function setRecordingStatus(text, opts = {}) {
  const { visible = true, recording = false, playback = false, pulsing = false } = opts;
  if (!recordingStatus || !recordingStatusText) return;
  recordingStatusText.textContent = text;
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

// ============================
//  Voice Transcription (Deepgram)
// ============================
function startVoiceTranscription() {
  if (!isVoiceNoteEnabled || isRecognitionActive || !mediaStream) return;

  const url = 'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&filler_words=true';
  deepgramSocket = new WebSocket(url, ['token', DEEPGRAM_KEY]);

  deepgramSocket.onopen = () => {
    isRecognitionActive = true;
    const toggleVoiceBtn = document.getElementById('toggleVoiceNote');
    if (toggleVoiceBtn) toggleVoiceBtn.classList.add('listening');

    dgStreamRecorder = new MediaRecorder(mediaStream);
    dgStreamRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0 && deepgramSocket.readyState === 1) {
        deepgramSocket.send(event.data);
      }
    });
    dgStreamRecorder.start(250);
  };

  let permanentTextBeforeResult = notepadTextarea.value;

  deepgramSocket.onmessage = (message) => {
    const received = JSON.parse(message.data);
    const transcript = received.channel.alternatives[0].transcript;

    if (!transcript) return;

    if (received.is_final) {
      const space = permanentTextBeforeResult && !permanentTextBeforeResult.endsWith(' ') ? ' ' : '';
      permanentTextBeforeResult += space + transcript.trim();
      localStorage.setItem('toeicNotepadContent', permanentTextBeforeResult);
    }

    const spaceForInterim = permanentTextBeforeResult && !permanentTextBeforeResult.endsWith(' ') && !received.is_final ? ' ' : '';
    notepadTextarea.value = permanentTextBeforeResult + (received.is_final ? '' : spaceForInterim + transcript);

    notepadTextarea.scrollTop = notepadTextarea.scrollHeight;
    if (typeof updateWordCount === 'function') updateWordCount();
  };

  deepgramSocket.onclose = () => {
    isRecognitionActive = false;
    const toggleVoiceBtn = document.getElementById('toggleVoiceNote');
    if (toggleVoiceBtn) toggleVoiceBtn.classList.remove('listening');
  };

  deepgramSocket.onerror = (err) => {
    console.error('Deepgram WebSocket error:', err);
  };
}

function stopVoiceTranscription() {
  if (dgStreamRecorder && dgStreamRecorder.state !== 'inactive') {
    dgStreamRecorder.stop();
  }
  if (deepgramSocket && deepgramSocket.readyState === 1) {
    deepgramSocket.send(JSON.stringify({ type: 'CloseStream' }));
    deepgramSocket.close();
  }
  isRecognitionActive = false;
  const toggleVoiceBtn = document.getElementById('toggleVoiceNote');
  if (toggleVoiceBtn) toggleVoiceBtn.classList.remove('listening');
}

// ============================
//  Recording Engine
// ============================
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

    if (isVoiceNoteEnabled) {
      const textarea = document.getElementById('notepadTextarea');
      if (textarea) {
        textarea.value = '';
        localStorage.setItem('toeicNotepadContent', '');
        const countEl = document.getElementById('notepadWordCount');
        if (countEl) countEl.innerHTML = '<span class="notepad-count-num">0</span>';
      }
    }

    if (recordingLimitTimeout) {
      clearTimeout(recordingLimitTimeout);
      recordingLimitTimeout = null;
    }

    updateBottomNavState();
    return;
  }

  stopPlaybackPreview();

  try {
    // Force a fresh media stream for every recording to prevent Safari 0-byte audio bug
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    if (!mediaStream) {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    // Protection for Scenario 1: Audio Interruption (Phone Calls, Alarms)
    mediaStream.getAudioTracks().forEach(track => {
      track.onended = () => {
        console.warn('Audio track ended unexpectedly (interruption detected).');
        if (mediaRecorder === localRecorder && localRecorder.state === 'recording') {
          stopRecording();
          // Optional: give user visual feedback of interruption
          setRecordingStatus('Interrupted. Saved.', { visible: true, recording: false });
        }
      };
    });

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

      stopVoiceTranscription();

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
    startVoiceTranscription();
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

// ============================
//  Playback
// ============================
function playCurrentRecording() {
  const recording = getCurrentRecording();
  if (!recording || mediaRecorder?.state === 'recording') return;

  if (currentRecordingAudio && !currentRecordingAudio.paused) {
    stopPlaybackPreview();
    updateBottomNavState();
    return;
  }

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

// ============================
//  Save Recording
// ============================
function saveCurrentRecording() {
  const recording = getCurrentRecording();
  if (!recording || mediaRecorder?.state === 'recording') return;

  const activeDate = activeType === 'homework' ? dateBadge.textContent : lessonDateBadge.textContent;

  // --- 1. Extract Day Number (e.g. "[HW-05] 03/31" -> "Day-05") ---
  let dayStamp = 'Day-00';
  const dayMatch = activeDate.match(/(?:HW|Lesson)-?(\d+)/i);
  if (dayMatch) {
    dayStamp = `Day-${dayMatch[1].padStart(2, '0')}`;
  }

  // --- 2. Determine Question Number (By Card Order) ---
  const qNumber = currentPart + 1;
  const defaultName = `${dayStamp}-Q${qNumber}`;

  const extension = getRecordingExtension(recording.mimeType || 'audio/webm');

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

// ============================
//  Data Cache
// ============================
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
  lessonDateBadge.textContent = date;
  renderLesson(lesson);
  showLessonViewer();
  saveAppState(className, 'lesson', date, 0);
  updateBottomNavState();
};

// ============================
//  Keyboard Navigation
// ============================
document.addEventListener('keydown', (e) => {
  // If image modal is open, prevent arrow keys from navigating tasks
  const imageModal = document.getElementById('imageModal');
  if (imageModal && imageModal.classList.contains('active')) return;

  // Prevent card navigation when typing in inputs or textarea (Notepad)
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
    } else if (e.key === ' ') {
      // Space bar toggles recording or playback
      if (bottomRecordBtn) {
        e.preventDefault();
        bottomRecordBtn.click();
      }
    }
  }
});

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
restoreAppState();
updateBottomNavState();

// ============================
//  Save Modal Listeners
// ============================
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

// ============================
//  App Backgrounding Protection
// ============================
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (mediaRecorder?.state === 'recording') {
      console.warn('App backgrounded. Auto-stopping recording to prevent data loss.');
      stopRecording();
    }
  }
});
