'use strict';

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
//  Homework Selection
// ============================
window.selectHomework = function (className, date) {
  clearActiveEntries();
  clearAllTimers();
  const entry = document.getElementById(`entry-${className}-homework-${date}`);
  if (entry) entry.classList.add('active');

  const classData = CLASSES_DATA[className];
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
};

// ============================
//  Lesson Selection
// ============================
window.selectLesson = function (className, date) {
  clearActiveEntries();
  clearAllTimers();
  const entry = document.getElementById(`entry-${className}-lesson-${date}`);
  if (entry) entry.classList.add('active');

  const classData = CLASSES_DATA[className];
  const lesson = classData.lesson.find(l => l.date === date);
  if (!lesson) return;

  activeClass = className;
  activeType = 'lesson';
  lessonDateBadge.textContent = date;
  renderLesson(lesson);
  showLessonViewer();
};

// ============================
//  Card Rendering
// ============================
function renderCards() {
  let html = '';

  currentParts.forEach((part, index) => {
    const typeCategory = TYPE_LABELS[part.type] || 'TOEIC';
    const responseTime = part.responseTime || RESPONSE_TIMES[part.type] || 45;

    html += `<div class="part-card">`;

    // Header bar
    let qLabel = part.questionLabel || `Question ${index + 1}`;
    
    // Force programmatic grouping for standard TOEIC Speaking parts
    if (part.type === 'describe-picture') {
      if (index === 2 || index === 3) qLabel = 'Question 3-4';
    } else if (part.type === 'respond-questions') {
      if (index === 4 || index === 5) qLabel = 'Question 5-6';
      if (index === 6) qLabel = 'Question 7'; // Specifically ensure index 6 is only "Question 7"
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
    html += renderPartContent(part);
    html += `</div></div>`;

    // Footer with response timer or audio control
    const hasAudio = part.content && part.content.videoUrl;
    const hasTimer = part.type !== 'sentence-picture' && (part.prepTime || part.responseTime || (part.type !== 'respond-info-q' && RESPONSE_TIMES[part.type]));

    if (hasAudio || hasTimer) {
      html += `<div class="card-footer">`;

      if (hasAudio && part.type === 'respond-info-q') {
        // Standalone Audio control without pill
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
                <div class="audio-time" id="time-${index}">00:00 / 00:00</div>
              </div>
            <div id="yt-player-${index}" class="hidden-player"></div>
          </div>
        `;
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
  goToPart(0);
  initAudioPlayers();
}

function renderPartContent(part) {
  switch (part.type) {
    case 'read-aloud':
      return `<div class="reading-passage">${part.content.passage}</div>`;

    case 'describe-picture':
      if (part.content.imageUrl) {
        return `
          <div class="picture-container">
            <img src="${part.content.imageUrl}" alt="Describe this picture">
          </div>
        `;
      }
      return `
        <div class="picture-container" style="display:flex;align-items:center;justify-content:center;height:240px;font-size:48px;">
          ${part.content.imagePlaceholder || '🖼️'}
        </div>
      `;

    case 'respond-questions':
      const qText = part.content.question;
      const lines = qText.split('\n');
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
      return `<div class="question-text">${htmlContent}</div>`;

    case 'respond-info':
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
        tableHtml += `<div class="question-text" style="margin-top:16px;">${part.content.question}</div>`;
      }
      return tableHtml;

    case 'respond-info-q':
      return `
        ${part.content.imageUrl ? `
          <div class="picture-container">
            <img src="${part.content.imageUrl}" alt="Information provided">
          </div>
        ` : ''}
        ${part.content.question ? `
          <div class="reveal-section">
            <button class="reveal-btn" onclick="const q = this.nextElementSibling; q.classList.toggle('visible'); this.textContent = q.classList.contains('visible') ? 'Hide Questions' : 'Reveal Questions'">Reveal Questions</button>
            <div class="question-text reveal-content" style="text-align:left; font-size:16px;">${part.content.question.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}
      `;

    case 'opinion':
      const isEssay = part.label === 'Write an Opinion Essay';
      return `<div class="opinion-prompt">${isEssay ? '<strong>Essay:</strong> ' : ''}${part.content.prompt.replace(/\n/g, '<br>')}</div>`;

    case 'email-response':
      return `
        <div class="email-block">
          <div class="email-meta">
            <div><strong>From:</strong> ${part.content.from}</div>
            <div><strong>To:</strong> ${part.content.to}</div>
            <div><strong>Subject:</strong> ${part.content.subject}</div>
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
          ? `<img src="${part.content.imageUrl}" alt="Write about this picture">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:48px;">${part.content.imagePlaceholder || '🖼️'}</div>`
        }
        </div>
        ${part.content.words ? `<div class="sentence-words">${part.content.words[0]} / ${part.content.words[1]}</div>` : ''}
      `;

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
  if (index !== currentPart) {
    clearAllTimers();
  }
  currentPart = index;
  cardTrack.style.transform = `translateX(calc(-${index * 100}% - ${index * 32}px))`;
  updatePaginationDots();

  // Pause all audio when moving away from a part
  Object.values(audioPlayers).forEach(p => {
    if (p && p.pauseVideo) p.pauseVideo();
  });
};

function updatePaginationDots() {
  const dots = pagination.querySelectorAll('.pagination-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentPart);
  });
}

// Trackpad Swipe Navigation removed per user request to only allow arrow keys.

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

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentPart < currentParts.length - 1) goToPart(currentPart + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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
  }
}

function closeAllDropdowns() {
  homeworkDropdown.classList.remove('show');
  lessonDropdown.classList.remove('show');
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
