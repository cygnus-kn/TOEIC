// ============================
//  Part Card Logic
// ============================

// --- DOM Elements ---
const cardTrack = document.getElementById('cardTrack');
const pagination = document.getElementById('pagination');
const cardContainer = document.getElementById('cardContainer');

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

// Image click interceptor
document.body.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG' && e.target.closest('.main') && !e.target.closest('#imageModal')) {
    openImageModal(e.target.src);
  }
}, { passive: true });
// ============================
//  Timer & Audio Logic
// ============================
let timers = {}; // { partIndex: { interval, remaining, running } }
let topicTimers = {}; // { "partIndex-qIndex": { interval, remaining, running } }
let audioPlayers = {}; // { partIndex: YT playerInstance }
let youtubePlayerPromises = {}; // { partIndex: Promise<YT.Player> }
let localAudioPlayers = {}; // { partIndex: HTMLAudioElement }
let audioPoller = null;
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
function clearAllTimers() {
  for (const key in timers) {
    if (timers[key].interval) clearInterval(timers[key].interval);

    const display = document.getElementById(`timer-display-${key}`);
    const valueEl = document.getElementById(`timer-value-${key}`);
    if (display && valueEl && currentParts[key]) {
      const part = currentParts[key];
      const totalTime = part.responseTime || RESPONSE_TIMES[part.type] || 45;
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
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
function formatRecordingDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return formatTime(totalSeconds);
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
      startResponseTimer(index, totalTime);
    }
  } else if (timers[index].running) {
    // Pause
    clearInterval(timers[index].interval);
    timers[index].running = false;
    display.classList.remove('running');
  } else if (timers[index].remaining > 0) {
    // Resume
    if (timers[index].stage === 'prep') {
      resumePrepTimer(index, totalTime);
    } else {
      resumeResponseTimer(index);
    }
  } else {
    // Reset
    delete timers[index];
    display.classList.remove('running', 'finished', 'prep-stage');
    valueEl.textContent = formatTime(totalTime);
  }
};
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
  valueEl.textContent = formatTime(prepTime);

  timers[index].interval = setInterval(() => {
    timers[index].remaining--;
    valueEl.textContent = formatTime(timers[index].remaining);

    if (timers[index].remaining <= 0) {
      clearInterval(timers[index].interval);
      display.classList.remove('prep-stage');
      startResponseTimer(index, responseTime);
    }
  }, 1000);
}
function resumePrepTimer(index, responseTime) {
  const display = document.getElementById(`timer-display-${index}`);
  const valueEl = document.getElementById(`timer-value-${index}`);

  timers[index].running = true;
  display.classList.add('running', 'prep-stage');

  timers[index].interval = setInterval(() => {
    timers[index].remaining--;
    valueEl.textContent = formatTime(timers[index].remaining);

    if (timers[index].remaining <= 0) {
      clearInterval(timers[index].interval);
      display.classList.remove('prep-stage');
      startResponseTimer(index, responseTime);
    }
  }, 1000);
}
function startResponseTimer(index, responseTime) {
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
  valueEl.textContent = formatTime(responseTime);

  timers[index].interval = setInterval(() => {
    timers[index].remaining--;
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
function resumeResponseTimer(index) {
  const display = document.getElementById(`timer-display-${index}`);
  const valueEl = document.getElementById(`timer-value-${index}`);

  timers[index].running = true;
  display.classList.add('running');

  timers[index].interval = setInterval(() => {
    timers[index].remaining--;
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
window.setActiveBookmark = function (btn, index) {
  const container = document.getElementById(`bookmarks-${index}`);
  if (!container) return;
  const dots = container.querySelectorAll('.bookmark-dot:not(.out-link-icon)');
  dots.forEach(d => d.classList.remove('active-bookmark'));
  btn.classList.add('active-bookmark');
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

// ============================
//  Lesson Rendering
// ============================
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
//  Audio Seek Helper
// ============================
// ============================
//  Audio Seek Helper
// ============================
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
