// ============================
//  Bottom Nav Logic
// ============================

// --- DOM Elements ---
const bottomRecorderShell = document.getElementById('bottomRecorderShell');
const bottomNav = document.getElementById('bottomNav');
const bottomRecorderHandle = document.getElementById('bottomRecorderHandle');
const bottomRedoBtn = document.getElementById('bottomRedoBtn');
const bottomRecordBtn = document.getElementById('bottomRecordBtn');
const bottomDeleteBtn = document.getElementById('bottomDeleteBtn');
const bottomSaveBtn = document.getElementById('bottomSaveBtn');
const bottomPlaybackSeeker = document.getElementById('bottomPlaybackSeeker');
const bottomSeekerProgress = document.getElementById('bottomSeekerProgress');
const bottomSeekerKnob = document.getElementById('bottomSeekerKnob');
let isDraggingNav = false;
let navOffsetX = 0;
let navOffsetY = 0;

// ============================
//  Nav Dragging
// ============================
function initNavDragging() {
  const startDragging = (e) => {
    if (!bottomNav || !bottomRecorderShell || e.button !== 0) return;

    // Ensure we are clicking on the nav background or the handle, not buttons or seeker
    const isTargetNav = e.target.closest('.bottom-nav') || e.target.closest('.bottom-recorder-handle');
    if (!isTargetNav) return;
    if (e.target.closest('button') && !e.target.closest('.bottom-recorder-handle')) return;
    if (e.target.closest('.bottom-playback-seeker-wrapper')) return;

    const rect = bottomRecorderShell.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = rect.left;
    const initialY = rect.top;

    isDraggingNav = true;
    bottomNav.classList.add('dragging');

    // Lock dimensions temporarily and switch to absolute screen coordinates
    bottomRecorderShell.style.position = 'fixed';
    bottomRecorderShell.style.margin = '0';
    bottomRecorderShell.style.width = rect.width + 'px';
    bottomRecorderShell.style.height = rect.height + 'px';
    bottomRecorderShell.style.left = initialX + 'px';
    bottomRecorderShell.style.top = initialY + 'px';
    bottomRecorderShell.style.bottom = 'auto';
    bottomRecorderShell.style.right = 'auto';
    bottomRecorderShell.style.transform = 'none';

    const onMove = (moveEvent) => {
      if (!isDraggingNav) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      let newX = initialX + dx;
      let newY = initialY + dy;

      // Screen boundary constraints (10px padding)
      newX = Math.max(10, Math.min(window.innerWidth - rect.width - 10, newX));
      newY = Math.max(10, Math.min(window.innerHeight - rect.height - 10, newY));

      bottomRecorderShell.style.left = newX + 'px';
      bottomRecorderShell.style.top = newY + 'px';
    };

    const onEnd = () => {
      isDraggingNav = false;
      bottomNav.classList.remove('dragging');

      // Unlock dimensions so it can grow/shrink (e.g. when seeker expands)
      bottomRecorderShell.style.width = '';
      bottomRecorderShell.style.height = '';

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
  };

  document.addEventListener('mousedown', startDragging);
}

// ============================
//  Button Icon & State
// ============================
function updateRecordButtonIcon(mode = 'record') {
  if (!bottomRecordBtn) return;
  const svg = bottomRecordBtn.querySelector('svg');
  if (!svg) return;
  const isRecording = mode === 'recording';
  const isPlayback = mode === 'playback';
  const isPause = mode === 'pause';
  svg.setAttribute('width', isRecording ? '28' : '24');
  svg.setAttribute('height', isRecording ? '28' : '24');
  svg.setAttribute('fill', isRecording || isPlayback || isPause ? 'currentColor' : 'none');
  svg.setAttribute('stroke', isRecording || isPlayback || isPause ? 'none' : 'currentColor');
  svg.setAttribute('stroke-width', isRecording || isPlayback || isPause ? '0' : '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  if (isRecording) {
    svg.innerHTML = '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4"/>';
  } else if (isPause) {
    svg.innerHTML = '<path d="M6.7 5.2h4.6v13.6H6.7z"/><path d="M12.7 5.2h4.6v13.6h-4.6z"/>';
  } else if (isPlayback) {
    svg.innerHTML = '<path d="M7 5.4v13.2c0 .9.98 1.45 1.74.96l10.2-6.48a1.12 1.12 0 0 0 0-1.88L8.74 4.44A1.12 1.12 0 0 0 7 5.4Z"/>';
  } else {
    svg.innerHTML = '<path d="M12 15a4 4 0 0 0 4-4V7a4 4 0 0 0-8 0v4a4 4 0 0 0 4 4Z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/><path d="M8.5 21h7"/>';
  }
}

// ============================
//  Nav State Management
// ============================
function updateBottomNavState() {
  if (!bottomRecorderShell) return;

  // Whitelist Logic: Show bottom nav ONLY for Speaking tasks, hide for everything else
  const currentPartData = currentParts[currentPart];
  let isSpeakingTask = false;

  if (activeType === 'homework' && currentPartData) {
    const category = TYPE_LABELS[currentPartData.type];
    const isWritingOpinion = currentPartData.type === 'opinion' && currentPartData.label === 'Write an Opinion Essay';

    if (category === 'TOEIC Speaking' && !isWritingOpinion) {
      isSpeakingTask = true;
    }
  }

  const shouldHide = !isSpeakingTask;

  bottomRecorderShell.classList.toggle('hidden-nav', shouldHide);
  if (bottomRecorderHandle) bottomRecorderHandle.classList.toggle('hidden-nav', shouldHide);

  const hasParts = currentParts.length > 0;
  const canRecord = currentPartSupportsRecording() && typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof MediaRecorder !== 'undefined';
  const hasRecording = !!getCurrentRecording();

  bottomRecordBtn.disabled = !canRecord;
  bottomRedoBtn.disabled = !hasRecording || mediaRecorder !== null;
  bottomDeleteBtn.disabled = !hasRecording || mediaRecorder !== null;
  bottomSaveBtn.disabled = !hasRecording || mediaRecorder !== null;

  const isRecording = mediaRecorder?.state === 'recording';
  const isPlaying = currentRecordingAudio && !currentRecordingAudio.paused;
  const recordButtonMode = isRecording ? 'recording' : isPlaying ? 'pause' : hasRecording ? 'playback' : 'record';

  bottomRecordBtn.classList.toggle('recording', !!isRecording);
  bottomRecordBtn.classList.toggle('active-media', !!isRecording);
  updateRecordButtonIcon(recordButtonMode);
  bottomRecordBtn.setAttribute('aria-label', isRecording ? 'Stop recording' : isPlaying ? 'Pause playback' : hasRecording ? 'Play latest recording' : 'Record answer');
  bottomRecordBtn.setAttribute('title', isRecording ? 'Stop recording' : isPlaying ? 'Pause playback' : hasRecording ? 'Play latest recording' : 'Record answer');

  if (isRecording) {
    const elapsed = Date.now() - recordingStartedAt;
    setRecordingStatus(formatRecordingDuration(elapsed), { visible: true, recording: true, pulsing: true });
  } else if (currentRecordingAudio) {
    // Playback/Review Mode
    const recording = getCurrentRecording();
    const durationMs = recording ? recording.durationMs : 0;
    const currentMs = currentRecordingAudio.currentTime * 1000;
    const remainingMs = Math.max(0, durationMs - currentMs);
    const isFinished = currentRecordingAudio.currentTime >= (currentRecordingAudio.duration || (durationMs / 1000)) - 0.05;

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

  updateDeleteButton();

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

// ============================
//  Button Event Listeners
// ============================
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
    if (mediaRecorder?.state === 'recording') {
      stopRecording();
    } else if (getCurrentRecording()) {
      playCurrentRecording();
    } else {
      await startRecording();
    }
    resetControlTimer();
  });
}

if (bottomRedoBtn) {
  bottomRedoBtn.addEventListener('click', async () => {
    if (!getCurrentRecording() || mediaRecorder !== null) return;

    if (shouldWarnForQuickRedo()) {
      const confirmed = window.confirm('Record again will discard the current take and immediately start a new recording. Continue?');
      if (!confirmed) return;
      markQuickRedoWarningSeen();
    }

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

if (bottomDeleteBtn) {
  bottomDeleteBtn.addEventListener('click', () => {
    if (!getCurrentRecording() || mediaRecorder !== null) return;
    if (!window.confirm('Delete the current recording?')) return;

    const key = getCurrentTaskKey();
    if (key && recordings[key]) {
      if (recordings[key].url) URL.revokeObjectURL(recordings[key].url);
      delete recordings[key];
    }
    stopPlaybackPreview();
    updateBottomNavState();
    resetControlTimer();
  });
}

if (bottomSaveBtn) {
  bottomSaveBtn.addEventListener('click', () => {
    saveCurrentRecording();
    resetControlTimer();
  });
}
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
// Initialize dragging
initNavDragging();
// ============================
//  Mobile UI Auto-Hide & Helpers
// ============================
function updateDeleteButton() {
  if (!bottomDeleteBtn) return;
  bottomDeleteBtn.setAttribute('aria-label', 'Delete latest recording');
  bottomDeleteBtn.setAttribute('title', 'Delete latest recording');
}
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
    if (accumulatedScrollUp > 300) {
      showMobileControls();
    }
  } else if (currentScrollY > lastScrollY) {
    // Scrolling downwards
    accumulatedScrollDown += (currentScrollY - lastScrollY);
    accumulatedScrollUp = 0;
    if (accumulatedScrollDown > 30) {
      hideMobileControls();
    }
  }

  lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
  resetControlTimer();
}, { passive: true });

// Any click on the page should immediately reveal the UI if it's currently hidden
document.body.addEventListener('click', (e) => {
  if (document.body.classList.contains('mobile-controls-hidden')) {
    // Exclude timer interactions from summoning the UI while a test is running.
    if (!e.target.closest('.timer-display')) {
      showMobileControls();
    }
  }

  // Reset the hide timer when the top nav controls are tapped.
  if (e.target.closest('.sidebar-toggle-btn') || e.target.closest('.theme-toggle-wrapper')) {
    resetControlTimer();
  }

}, { passive: true });

document.body.addEventListener('touchstart', (e) => {
  if (e.target.closest('.sidebar-toggle-btn') || e.target.closest('.theme-toggle-wrapper') || e.target.closest('.bottom-recorder-shell') || e.target.closest('.bottom-recorder-handle')) {
    resetControlTimer();
  }
}, { passive: true });
resetControlTimer();
