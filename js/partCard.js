// ============================
//  Part Card Logic
// ============================

// --- DOM Elements ---
const cardTrack = document.getElementById('cardTrack');
const pagination = document.getElementById('pagination');
const cardWindow = document.getElementById('homeworkViewer');
const cardStage = document.getElementById('cardStage');
const cardContainer = document.getElementById('cardContainer');
const cardDragHandle = document.getElementById('cardDragHandle');
const CARD_WINDOW_OFFSET_X_KEY = 'toeicCardWindowOffsetX';
const CARD_WINDOW_OFFSET_Y_KEY = 'toeicCardWindowOffsetY';
let cardWindowOffsetX = 0;
let cardWindowOffsetY = 0;
let isDraggingCardWindow = false;

function isMobileCardLayout() {
  return window.innerWidth <= 600;
}

function applyCardWindowOffset() {
  if (!cardWindow) return;
  if (isMobileCardLayout()) {
    cardWindow.style.removeProperty('--homework-window-offset-x');
    cardWindow.style.removeProperty('--homework-window-offset-y');
    return;
  }
  cardWindow.style.setProperty('--homework-window-offset-x', `${cardWindowOffsetX}px`);
  cardWindow.style.setProperty('--homework-window-offset-y', `${cardWindowOffsetY}px`);
}

function persistCardWindowOffset() {
  try {
    localStorage.setItem(CARD_WINDOW_OFFSET_X_KEY, String(cardWindowOffsetX));
    localStorage.setItem(CARD_WINDOW_OFFSET_Y_KEY, String(cardWindowOffsetY));
  } catch (error) {
    // Ignore storage failures and keep dragging usable.
  }
}

function restoreCardWindowOffset() {
  if (!cardWindow) return;
  if (isMobileCardLayout()) {
    applyCardWindowOffset();
    return;
  }
  try {
    const savedX = Number(localStorage.getItem(CARD_WINDOW_OFFSET_X_KEY));
    const savedY = Number(localStorage.getItem(CARD_WINDOW_OFFSET_Y_KEY));
    if (!Number.isNaN(savedX)) cardWindowOffsetX = savedX;
    if (!Number.isNaN(savedY)) cardWindowOffsetY = savedY;
  } catch (error) {
    cardWindowOffsetX = 0;
    cardWindowOffsetY = 0;
  }
  applyCardWindowOffset();
}

function clampCardWindowOffset() {
  if (!cardWindow) return;
  if (isMobileCardLayout()) {
    applyCardWindowOffset();
    return;
  }
  const rect = cardWindow.getBoundingClientRect();
  const padding = 12;
  let adjusted = false;

  if (rect.left < padding) {
    cardWindowOffsetX += padding - rect.left;
    adjusted = true;
  } else if (rect.right > window.innerWidth - padding) {
    cardWindowOffsetX -= rect.right - (window.innerWidth - padding);
    adjusted = true;
  }

  if (rect.top < padding) {
    cardWindowOffsetY += padding - rect.top;
    adjusted = true;
  } else if (rect.bottom > window.innerHeight - padding) {
    cardWindowOffsetY -= rect.bottom - (window.innerHeight - padding);
    adjusted = true;
  }

  if (adjusted) {
    applyCardWindowOffset();
    persistCardWindowOffset();
  }
}

function initCardWindowDragging() {
  if (!cardWindow || !cardStage || !cardDragHandle) return;

  restoreCardWindowOffset();

  const HOLD_READY_MS = 140;
  let holdReadyTimer = null;

  const clearHoldReady = () => {
    if (holdReadyTimer !== null) {
      clearTimeout(holdReadyTimer);
      holdReadyTimer = null;
    }
    cardWindow.classList.remove('hold-ready');
  };

  const scheduleHoldReady = () => {
    clearHoldReady();
    holdReadyTimer = setTimeout(() => {
      holdReadyTimer = null;
      cardWindow.classList.add('hold-ready');
    }, HOLD_READY_MS);
  };

  const clampValue = (value, bounds) => Math.min(bounds.max, Math.max(bounds.min, value));

  const getDragBounds = (start, end, viewportSize, initialOffset, minVisible = 72) => {
    const padding = 12;
    const size = end - start;

    if (size <= viewportSize - padding * 2) {
      return {
        min: initialOffset + (padding - start),
        max: initialOffset + ((viewportSize - padding) - end)
      };
    }

    return {
      min: initialOffset + (padding - start),
      max: initialOffset + ((viewportSize - padding - minVisible) - start)
    };
  };

  const isCardWindowDragSource = (target) => {
    const isTouchCapable = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
    if (isTouchCapable) return !!target.closest('.card-drag-handle');
    if (target.closest('.card-drag-handle')) return true;
    if (target.closest('.card-container') || target.closest('.pagination')) return false;
    return target.closest('#cardStage') === cardStage;
  };

  const beginDragging = (startX, startY) => {
    const initialOffsetX = cardWindowOffsetX;
    const initialOffsetY = cardWindowOffsetY;
    const rect = cardWindow.getBoundingClientRect();
    const xBounds = getDragBounds(rect.left, rect.right, window.innerWidth, initialOffsetX);
    const yBounds = getDragBounds(rect.top, rect.bottom, window.innerHeight, initialOffsetY);

    isDraggingCardWindow = true;
    cardWindow.classList.add('dragging');
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const moveTo = (clientX, clientY) => {
      const dx = clientX - startX;
      const dy = clientY - startY;
      cardWindowOffsetX = clampValue(initialOffsetX + dx, xBounds);
      cardWindowOffsetY = clampValue(initialOffsetY + dy, yBounds);
      applyCardWindowOffset();
    };

    const onPointerMove = (moveEvent) => moveTo(moveEvent.clientX, moveEvent.clientY);
    const onTouchMove = (moveEvent) => {
      if (!moveEvent.touches.length) return;
      moveEvent.preventDefault();
      moveTo(moveEvent.touches[0].clientX, moveEvent.touches[0].clientY);
    };

    const onEnd = () => {
      isDraggingCardWindow = false;
      cardWindow.classList.remove('dragging');
      clearHoldReady();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      persistCardWindowOffset();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  };

  const startPointerDragging = (e) => {
    if (window.innerWidth <= 600) return;
    if (isDraggingCardWindow) return;
    if (e.pointerType !== 'mouse' && !e.target.closest('.card-drag-handle')) return;
    if (!isCardWindowDragSource(e.target)) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    if (typeof cardWindow.setPointerCapture === 'function') {
      cardWindow.setPointerCapture(e.pointerId);
    }

    beginDragging(e.clientX, e.clientY);
    if (e.pointerType !== 'mouse') scheduleHoldReady();
  };

  const startTouchDragging = (e) => {
    if (window.innerWidth <= 600) return;
    if (!e.target.closest('.card-drag-handle')) return;
    if (!isCardWindowDragSource(e.target)) return;
    if (!e.touches.length || isDraggingCardWindow) return;
    e.preventDefault();
    e.stopPropagation();
    beginDragging(e.touches[0].clientX, e.touches[0].clientY);
    scheduleHoldReady();
  };

  cardDragHandle.addEventListener('pointerdown', startPointerDragging);
  cardDragHandle.addEventListener('touchstart', startTouchDragging, { passive: false });
  cardStage.addEventListener('pointerdown', startPointerDragging);
  cardStage.addEventListener('touchstart', startTouchDragging, { passive: false });

  window.addEventListener('resize', clampCardWindowOffset);
}

function updateActiveCardFrame() {
  if (!cardStage || !cardTrack) return;
  const activeCard = cardTrack.children[currentPart];
  if (!activeCard) {
    cardStage.style.removeProperty('--active-card-height');
    return;
  }

  const cardRect = activeCard.getBoundingClientRect();
  cardStage.style.setProperty('--active-card-height', `${cardRect.height}px`);
}

function scheduleActiveCardFrameUpdate() {
  requestAnimationFrame(() => {
    updateActiveCardFrame();
    setTimeout(updateActiveCardFrame, 60);
  });
}

// Export for inline onclick handlers
window.updateActiveCardFrame = updateActiveCardFrame;
window.scheduleActiveCardFrameUpdate = scheduleActiveCardFrameUpdate;

function bindActiveCardMediaSizing() {
  cardTrack.querySelectorAll('img').forEach(img => {
    if (img.complete) return;
    img.addEventListener('load', updateActiveCardFrame, { once: true });
    img.addEventListener('error', updateActiveCardFrame, { once: true });
  });
}

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
    if (part.type === 'opinion' && (part.label === 'Write an Opinion Essay' || part.label === 'Write an Opinion')) {
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
    const hasTimer = part.type !== 'sentence-picture' && part.type !== 'translation' && part.type !== 'topic-prep' && (part.prepTime || part.responseTime || (part.type !== 'respond-info-q' && RESPONSE_TIMES[part.type]));
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
  bindActiveCardMediaSizing();
  goToPart(0);
  scheduleActiveCardFrameUpdate();
}

// ============================
//  Part Content Renderer
// ============================
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
            <button class="reveal-btn" onclick="const q = this.nextElementSibling; q.classList.toggle('visible'); if(window.scheduleActiveCardFrameUpdate) window.scheduleActiveCardFrameUpdate();">Transcript</button>
            <div class="question-text reveal-content" style="text-align:left; font-size:16px;">${formatMarkdown(part.content.question)}</div>
          </div>
        ` : ''}
      `;

    case 'opinion': {
      return `<div class="opinion-prompt">${formatMarkdown(part.content.prompt)}</div>`;
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
        ${part.content.wordPairs 
          ? `<div class="sentence-words-list" style="display:flex; flex-direction:column; gap:8px;">
              ${part.content.wordPairs.map((pair, idx) => `<div class="sentence-words" style="padding:0; font-size:20px;">${pair[0]} / ${pair[1]}</div>`).join('')}
             </div>`
          : (part.content.words ? `<div class="sentence-words">${part.content.words[0]} / ${part.content.words[1]}</div>` : '')}
      `;

    case 'translation':
      return `
        <div class="picture-container">
          ${part.content.imageUrl
          ? `<img src="${part.content.imageUrl}" alt="Translate sentence based on this picture" title="Expand">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:48px;">${part.content.imagePlaceholder || '🖼️'}</div>`
        }
        </div>
        ${part.content.text ? `<div class="sentence-words">${part.content.text}</div>` : ''}
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
  setTimeout(updateActiveCardFrame, 450);
  scheduleActiveCardFrameUpdate();

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
let touchStartY = 0;

cardContainer.addEventListener('touchstart', (e) => {
  if (isImageModalActive()) return;
  if (isDraggingCardWindow) return;
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

cardContainer.addEventListener('touchmove', (e) => {
  if (isImageModalActive()) return;
  if (isDraggingCardWindow || !e.touches.length) return;
  const dx = e.touches[0].screenX - touchStartX;
  const dy = e.touches[0].screenY - touchStartY;
  if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
    e.preventDefault();
  }
}, { passive: false });

cardContainer.addEventListener('touchend', (e) => {
  if (isImageModalActive()) return;
  if (isDraggingCardWindow) return;
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
//  Image Modal
// ============================
const IMAGE_MODAL_MIN_SCALE = 1;
const IMAGE_MODAL_MAX_SCALE = 4;
const IMAGE_MODAL_DOUBLE_TAP_SCALE = 2.5;
const IMAGE_MODAL_DISMISS_SWIPE_THRESHOLD = 80;
const IMAGE_MODAL_DISMISS_ANIMATION_MS = 180;
let imageModalScale = 1;
let imageModalTranslateX = 0;
let imageModalTranslateY = 0;
let imageModalStartScale = 1;
let imageModalStartTranslateX = 0;
let imageModalStartTranslateY = 0;
let imageModalStartDistance = 0;
let imageModalPinchOffsetX = 0;
let imageModalPinchOffsetY = 0;
let imageModalPanStartX = 0;
let imageModalPanStartY = 0;
let imageModalGestureStartX = 0;
let imageModalGestureStartY = 0;
let imageModalDismissTranslateX = 0;
let imageModalDismissTranslateY = 0;
let imageModalDismissScale = 1;
let imageModalTouchMoved = false;
let imageModalDidPinchGesture = false;
let imageModalLastTapAt = 0;
let imageModalScrollY = 0;
let imageModalPreviousBodyStyles = null;
let imageModalDismissTimer = null;
let imageModalSourceRect = null;
let imageModalSourceFilter = 'none';

function isImageModalActive() {
  const modal = document.getElementById('imageModal');
  return !!modal && modal.classList.contains('active');
}

function clampImageModalScale(scale) {
  return Math.min(IMAGE_MODAL_MAX_SCALE, Math.max(IMAGE_MODAL_MIN_SCALE, scale));
}

function getTouchDistance(touchA, touchB) {
  return Math.hypot(touchB.clientX - touchA.clientX, touchB.clientY - touchA.clientY);
}

function getTouchCenter(touchA, touchB) {
  return {
    x: (touchA.clientX + touchB.clientX) / 2,
    y: (touchA.clientY + touchB.clientY) / 2
  };
}

function clampImageModalPan() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalContent');
  if (!modal || !modalImg) return;

  if (imageModalScale <= IMAGE_MODAL_MIN_SCALE) {
    imageModalScale = IMAGE_MODAL_MIN_SCALE;
    imageModalTranslateX = 0;
    imageModalTranslateY = 0;
    return;
  }

  const modalRect = modal.getBoundingClientRect();
  const maxX = Math.max(0, ((modalImg.offsetWidth * imageModalScale) - modalRect.width) / 2);
  const maxY = Math.max(0, ((modalImg.offsetHeight * imageModalScale) - modalRect.height) / 2);
  imageModalTranslateX = Math.min(maxX, Math.max(-maxX, imageModalTranslateX));
  imageModalTranslateY = Math.min(maxY, Math.max(-maxY, imageModalTranslateY));
}

function applyImageModalTransform() {
  const modalImg = document.getElementById('imageModalContent');
  if (!modalImg) return;
  clampImageModalPan();
  const totalTranslateX = imageModalTranslateX + imageModalDismissTranslateX;
  const totalTranslateY = imageModalTranslateY + imageModalDismissTranslateY;
  const totalScale = imageModalScale * imageModalDismissScale;
  modalImg.style.transform = `translate3d(${totalTranslateX}px, ${totalTranslateY}px, 0) scale(${totalScale})`;
}

function setImageModalBackdropOpacity(opacity) {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  modal.style.setProperty('--image-modal-backdrop-opacity', String(opacity));
}

function setImageModalBackdropBlur(blurPx) {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  modal.style.setProperty('--image-modal-backdrop-blur', `${blurPx}px`);
}

function resetImageModalDismissTransform() {
  imageModalDismissTranslateX = 0;
  imageModalDismissTranslateY = 0;
  imageModalDismissScale = 1;
  setImageModalBackdropOpacity(0.75);
  setImageModalBackdropBlur(4);
}

function resetImageModalTransform() {
  imageModalScale = 1;
  imageModalTranslateX = 0;
  imageModalTranslateY = 0;
  resetImageModalDismissTransform();
  imageModalTouchMoved = false;
  imageModalDidPinchGesture = false;
  imageModalLastTapAt = 0;
  applyImageModalTransform();
}

function setImageModalDismissProgress(deltaX, deltaY) {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  modal.classList.remove('is-animating');
  imageModalDismissTranslateX = deltaX * 0.12;
  imageModalDismissTranslateY = deltaY;
  imageModalDismissScale = Math.max(0.86, 1 - (Math.abs(deltaY) / 1000));
  const dismissProgress = Math.min(1, Math.abs(deltaY) / 420);
  const backdropOpacity = Math.max(0.14, 0.75 * (1 - dismissProgress));
  setImageModalBackdropOpacity(backdropOpacity);
  setImageModalBackdropBlur(Math.max(0, 4 * (1 - dismissProgress)));
  applyImageModalTransform();
}

function getImageModalSourceTarget() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalContent');
  if (!modal || !modalImg || !imageModalSourceRect) return null;

  const modalRect = modal.getBoundingClientRect();
  const baseWidth = modalImg.offsetWidth;
  const baseHeight = modalImg.offsetHeight;
  if (!baseWidth || !baseHeight) return null;

  const targetCenterX = imageModalSourceRect.left + imageModalSourceRect.width / 2;
  const targetCenterY = imageModalSourceRect.top + imageModalSourceRect.height / 2;
  const modalCenterX = modalRect.left + modalRect.width / 2;
  const modalCenterY = modalRect.top + modalRect.height / 2;
  const targetScale = Math.max(0.12, Math.min(
    imageModalSourceRect.width / baseWidth,
    imageModalSourceRect.height / baseHeight
  ));

  return {
    x: targetCenterX - modalCenterX,
    y: targetCenterY - modalCenterY,
    scale: targetScale
  };
}

function animateImageModalDismiss(deltaY) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalContent');
  if (!modal) return;
  if (imageModalDismissTimer) clearTimeout(imageModalDismissTimer);

  const sourceTarget = getImageModalSourceTarget();
  const direction = deltaY < 0 ? -1 : 1;
  modal.classList.add('is-animating');
  if (sourceTarget) {
    if (modalImg) modalImg.style.filter = imageModalSourceFilter;
    imageModalDismissTranslateX = sourceTarget.x - imageModalTranslateX;
    imageModalDismissTranslateY = sourceTarget.y - imageModalTranslateY;
    imageModalDismissScale = sourceTarget.scale / imageModalScale;
  } else {
    imageModalDismissTranslateY = direction * (window.innerHeight * 0.72 + 120);
    imageModalDismissScale = 0.82;
  }
  setImageModalBackdropOpacity(0);
  setImageModalBackdropBlur(0);
  applyImageModalTransform();

  imageModalDismissTimer = setTimeout(() => {
    imageModalDismissTimer = null;
    closeImageModal();
  }, IMAGE_MODAL_DISMISS_ANIMATION_MS);
}

function animateImageModalDismissCancel() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  modal.classList.add('is-animating');
  resetImageModalDismissTransform();
  applyImageModalTransform();
  setTimeout(() => {
    modal.classList.remove('is-animating');
  }, IMAGE_MODAL_DISMISS_ANIMATION_MS);
}

function lockImageModalPage() {
  if (imageModalPreviousBodyStyles) return;
  imageModalScrollY = window.scrollY || window.pageYOffset || 0;
  imageModalPreviousBodyStyles = {
    position: document.body.style.position,
    top: document.body.style.top,
    left: document.body.style.left,
    right: document.body.style.right,
    width: document.body.style.width,
    overflow: document.body.style.overflow
  };
  document.body.classList.add('image-modal-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${imageModalScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
}

function unlockImageModalPage() {
  if (!imageModalPreviousBodyStyles) return;
  document.body.classList.remove('image-modal-open');
  document.body.style.position = imageModalPreviousBodyStyles.position;
  document.body.style.top = imageModalPreviousBodyStyles.top;
  document.body.style.left = imageModalPreviousBodyStyles.left;
  document.body.style.right = imageModalPreviousBodyStyles.right;
  document.body.style.width = imageModalPreviousBodyStyles.width;
  document.body.style.overflow = imageModalPreviousBodyStyles.overflow;
  imageModalPreviousBodyStyles = null;
  window.scrollTo(0, imageModalScrollY);
}

function openImageModal(src, sourceElement = null) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalContent');
  if (modal && modalImg) {
    resetImageModalTransform();
    imageModalSourceRect = sourceElement ? sourceElement.getBoundingClientRect() : null;
    imageModalSourceFilter = sourceElement ? getComputedStyle(sourceElement).filter : 'none';
    modalImg.src = src;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    lockImageModalPage();
  }
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalContent');
  if (modal && modal.classList.contains('active')) {
    if (imageModalDismissTimer) {
      clearTimeout(imageModalDismissTimer);
      imageModalDismissTimer = null;
    }
    modal.classList.remove('active', 'is-panning', 'is-animating');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.removeProperty('--image-modal-backdrop-opacity');
    modal.style.removeProperty('--image-modal-backdrop-blur');
    if (modalImg) modalImg.removeAttribute('style');
    resetImageModalTransform();
    imageModalSourceRect = null;
    imageModalSourceFilter = 'none';
    unlockImageModalPage();
  }
}

function zoomImageModalAtPoint(nextScale, pointX, pointY) {
  const modal = document.getElementById('imageModal');
  if (!modal) return;

  const modalRect = modal.getBoundingClientRect();
  const centerX = modalRect.left + modalRect.width / 2;
  const centerY = modalRect.top + modalRect.height / 2;
  const previousScale = imageModalScale;
  const scale = clampImageModalScale(nextScale);
  const ratio = scale / previousScale;

  imageModalTranslateX = pointX - centerX - ((pointX - centerX - imageModalTranslateX) * ratio);
  imageModalTranslateY = pointY - centerY - ((pointY - centerY - imageModalTranslateY) * ratio);
  imageModalScale = scale;
  applyImageModalTransform();
}

function beginImageModalPinch(touches) {
  const modal = document.getElementById('imageModal');
  if (!modal || touches.length < 2) return;

  const center = getTouchCenter(touches[0], touches[1]);
  const modalRect = modal.getBoundingClientRect();
  const modalCenterX = modalRect.left + modalRect.width / 2;
  const modalCenterY = modalRect.top + modalRect.height / 2;

  imageModalStartScale = imageModalScale;
  imageModalStartTranslateX = imageModalTranslateX;
  imageModalStartTranslateY = imageModalTranslateY;
  imageModalStartDistance = getTouchDistance(touches[0], touches[1]);
  imageModalPinchOffsetX = center.x - modalCenterX - imageModalTranslateX;
  imageModalPinchOffsetY = center.y - modalCenterY - imageModalTranslateY;
}

function handleImageModalTouchStart(e) {
  if (!isImageModalActive()) return;
  e.preventDefault();
  e.stopPropagation();
  const modal = document.getElementById('imageModal');
  if (modal) modal.classList.remove('is-panning', 'is-animating');
  resetImageModalDismissTransform();
  if (e.touches.length === 1) imageModalDidPinchGesture = false;
  imageModalTouchMoved = false;

  if (e.touches.length >= 2) {
    imageModalDidPinchGesture = true;
    beginImageModalPinch(e.touches);
    return;
  }

  if (e.touches.length === 1) {
    imageModalStartTranslateX = imageModalTranslateX;
    imageModalStartTranslateY = imageModalTranslateY;
    imageModalPanStartX = e.touches[0].clientX;
    imageModalPanStartY = e.touches[0].clientY;
    imageModalGestureStartX = e.touches[0].clientX;
    imageModalGestureStartY = e.touches[0].clientY;
    if (modal && imageModalScale > IMAGE_MODAL_MIN_SCALE) modal.classList.add('is-panning');
  }
}

function handleImageModalTouchMove(e) {
  if (!isImageModalActive()) return;
  e.preventDefault();
  e.stopPropagation();
  imageModalTouchMoved = true;

  if (e.touches.length >= 2 && imageModalStartDistance > 0) {
    imageModalDidPinchGesture = true;
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    const center = getTouchCenter(e.touches[0], e.touches[1]);
    const modalRect = modal.getBoundingClientRect();
    const modalCenterX = modalRect.left + modalRect.width / 2;
    const modalCenterY = modalRect.top + modalRect.height / 2;
    const nextScale = clampImageModalScale(imageModalStartScale * (getTouchDistance(e.touches[0], e.touches[1]) / imageModalStartDistance));
    const ratio = nextScale / imageModalStartScale;

    imageModalScale = nextScale;
    imageModalTranslateX = center.x - modalCenterX - (imageModalPinchOffsetX * ratio);
    imageModalTranslateY = center.y - modalCenterY - (imageModalPinchOffsetY * ratio);
    applyImageModalTransform();
    return;
  }

  if (e.touches.length === 1 && imageModalScale > IMAGE_MODAL_MIN_SCALE) {
    imageModalTranslateX = imageModalStartTranslateX + (e.touches[0].clientX - imageModalPanStartX);
    imageModalTranslateY = imageModalStartTranslateY + (e.touches[0].clientY - imageModalPanStartY);
    applyImageModalTransform();
    return;
  }

  if (e.touches.length === 1 && imageModalScale <= IMAGE_MODAL_MIN_SCALE) {
    if (imageModalDidPinchGesture) return;
    const dismissDx = e.touches[0].clientX - imageModalGestureStartX;
    const dismissDy = e.touches[0].clientY - imageModalGestureStartY;
    if (Math.abs(dismissDy) > 6 && Math.abs(dismissDy) > Math.abs(dismissDx) * 0.75) {
      setImageModalDismissProgress(dismissDx, dismissDy);
    }
  }
}

function handleImageModalTouchEnd(e) {
  if (!isImageModalActive()) return;
  e.preventDefault();
  e.stopPropagation();
  const modal = document.getElementById('imageModal');
  if (modal) modal.classList.remove('is-panning');

  if (e.touches.length >= 2) {
    imageModalDidPinchGesture = true;
    beginImageModalPinch(e.touches);
    return;
  }

  if (e.touches.length === 1) {
    if (imageModalDidPinchGesture) {
      resetImageModalDismissTransform();
      applyImageModalTransform();
    }
    imageModalStartTranslateX = imageModalTranslateX;
    imageModalStartTranslateY = imageModalTranslateY;
    imageModalPanStartX = e.touches[0].clientX;
    imageModalPanStartY = e.touches[0].clientY;
    return;
  }

  const changedTouch = e.changedTouches[0];
  const now = Date.now();
  if (imageModalDidPinchGesture) {
    imageModalDidPinchGesture = false;
    animateImageModalDismissCancel();
    return;
  }

  if (changedTouch && imageModalScale <= IMAGE_MODAL_MIN_SCALE && imageModalTouchMoved) {
    const swipeDx = changedTouch.clientX - imageModalGestureStartX;
    const swipeDy = changedTouch.clientY - imageModalGestureStartY;
    const isVerticalDismiss = Math.abs(swipeDy) > IMAGE_MODAL_DISMISS_SWIPE_THRESHOLD && Math.abs(swipeDy) > Math.abs(swipeDx) * 1.25;
    if (isVerticalDismiss) {
      animateImageModalDismiss(swipeDy);
      return;
    }
  }

  if (!imageModalTouchMoved && e.target === modal) {
    closeImageModal();
    return;
  }

  if (!imageModalTouchMoved && changedTouch && now - imageModalLastTapAt < 280) {
    const nextScale = imageModalScale > IMAGE_MODAL_MIN_SCALE ? IMAGE_MODAL_MIN_SCALE : IMAGE_MODAL_DOUBLE_TAP_SCALE;
    zoomImageModalAtPoint(nextScale, changedTouch.clientX, changedTouch.clientY);
    imageModalLastTapAt = 0;
    return;
  }

  imageModalLastTapAt = now;
  if (imageModalDismissTranslateY !== 0) {
    animateImageModalDismissCancel();
    return;
  }
  applyImageModalTransform();
}

function initImageModalGestures() {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('imageModalContent');
  if (!modal || !modalImg) return;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeImageModal();
  });

  modal.addEventListener('touchstart', handleImageModalTouchStart, { passive: false });
  modal.addEventListener('touchmove', handleImageModalTouchMove, { passive: false });
  modal.addEventListener('touchend', handleImageModalTouchEnd, { passive: false });
  modal.addEventListener('touchcancel', handleImageModalTouchEnd, { passive: false });

  modal.addEventListener('wheel', (e) => {
    if (!isImageModalActive()) return;
    e.preventDefault();
    const direction = e.deltaY > 0 ? -0.2 : 0.2;
    zoomImageModalAtPoint(imageModalScale + direction, e.clientX, e.clientY);
  }, { passive: false });

  modalImg.addEventListener('dragstart', (e) => e.preventDefault());
  modalImg.addEventListener('load', resetImageModalTransform);
}

initImageModalGestures();

document.addEventListener('gesturestart', (e) => {
  if (isImageModalActive()) e.preventDefault();
}, { passive: false });

document.addEventListener('gesturechange', (e) => {
  if (isImageModalActive()) e.preventDefault();
}, { passive: false });

document.addEventListener('gestureend', (e) => {
  if (isImageModalActive()) e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (isImageModalActive() && e.target.closest?.('#imageModal')) {
    e.preventDefault();
  }
}, { passive: false });

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeImageModal();
  }
});

// Image click interceptor
document.body.addEventListener('click', (e) => {
  if (e.target.tagName === 'IMG' && e.target.closest('.main') && !e.target.closest('#imageModal')) {
    e.preventDefault();
    e.stopImmediatePropagation();
    openImageModal(e.target.src, e.target);
  }
});

initCardWindowDragging();
window.addEventListener('resize', updateActiveCardFrame);

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
