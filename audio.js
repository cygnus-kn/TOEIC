'use strict';

// ============================
//  Audio Control Logic (Enhanced)
// ============================
window.isUserSeeking = false;

function initAudioPlayers() {
  // Clear old players
  audioPlayers = {};
  if (audioPoller) clearInterval(audioPoller);

  currentParts.forEach((part, index) => {
    if (part.type === 'respond-info-q' && part.content.videoUrl) {
      const videoId = extractVideoId(part.content.videoUrl);
      const startTime = extractStartTime(part.content.videoUrl);

      if (window.YT && window.YT.Player) {
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
            'onStateChange': (event) => onPlayerStateChange(index, event)
          }
        });
      }
    }
  });

  // Start polling for progress (high frequency for smooth movement)
  audioPoller = setInterval(updateAudioProgress, 30);
}

function extractVideoId(url) {
  const match = url.match(/embed\/([^?]+)/);
  return match ? match[1] : '';
}

function extractStartTime(url) {
  const match = url.match(/[?&]start=(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

window.toggleAudio = function (index) {
  const player = audioPlayers[index];
  if (!player) return;

  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
};

window.seekAudio = function (index, value) {
  const player = audioPlayers[index];
  if (!player) return;
  const duration = player.getDuration();
  const seekTo = (value / 100) * duration;
  player.seekTo(seekTo, true);
};

window.seekBy = function (index, seconds) {
  const player = audioPlayers[index];
  if (!player || typeof player.getCurrentTime !== 'function') return;
  const currentTime = player.getCurrentTime();
  player.seekTo(currentTime + seconds, true);
};

function onPlayerStateChange(index, event) {
  const btn = document.getElementById(`audio-btn-${index}`);
  if (!btn) return;
  const icon = btn.querySelector('svg');

  if (event.data === YT.PlayerState.PLAYING) {
    icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    btn.closest('.audio-standalone').classList.add('playing');
  } else {
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    btn.closest('.audio-standalone').classList.remove('playing');
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
      }
    }
  }
}
