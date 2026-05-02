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

// ============================
//  Image Modal
// ============================
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
