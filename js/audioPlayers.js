// ============================
//  Audio Player Logic
// ============================

let audioPlayers = {};          // { partIndex: YT.Player instance }
let youtubePlayerPromises = {}; // { partIndex: Promise<YT.Player> }
let localAudioPlayers = {};     // { partIndex: HTMLAudioElement }
let audioPoller = null;
window.isUserSeeking = false;

let youtubeAPILoaded = false;

// ============================
//  YouTube API Loader
// ============================
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (youtubeAPILoaded) return Promise.resolve();

  return new Promise((resolve) => {
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

// ============================
//  Init / Cleanup
// ============================
async function initAudioPlayers() {
  // Destroy old YT players to free memory
  if (audioPlayers) {
    Object.values(audioPlayers).forEach(p => {
      if (p && typeof p.destroy === 'function') p.destroy();
    });
  }
  audioPlayers = {};
  youtubePlayerPromises = {};

  // Pause and clear old local audio players
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

// ============================
//  YouTube Player Management
// ============================
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

// ============================
//  URL Helpers
// ============================
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

// ============================
//  Bookmark Sync
// ============================
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

window.setActiveBookmark = function (btn, index) {
  const container = document.getElementById(`bookmarks-${index}`);
  if (!container) return;
  const dots = container.querySelectorAll('.bookmark-dot:not(.out-link-icon)');
  dots.forEach(d => d.classList.remove('active-bookmark'));
  btn.classList.add('active-bookmark');
};

// ============================
//  Playback Controls
// ============================
window.seekAudioToTime = async function (index, trackIndex) {
  const local = localAudioPlayers[index];
  if (local) {
    const urls = local._urls;
    if (!urls || trackIndex >= urls.length) return;
    const wasPlaying = !local.paused;
    local.pause();
    local._currentTrack = trackIndex;
    local.src = urls[trackIndex];
    local.load();
    if (wasPlaying) {
      local.play();
    } else {
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

// ============================
//  Player State & Progress
// ============================
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
      try { return p.getPlayerState() === YT.PlayerState.PLAYING; } catch (e) { return false; }
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
