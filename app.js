/* ============================
   App Logic
   ============================ */

(function () {
  'use strict';

  // --- Theme Logic ---
  const themeToggle = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
    document.body.classList.add('dark-theme');
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  });
  // -------------------

  // --- Sidebar Resize & Collapse ---
  const sidebar = document.getElementById('sidebar');
  const resizeHandle = document.getElementById('sidebarResizeHandle');
  const collapseBtn = document.getElementById('sidebarCollapseBtn');

  // Restore saved width
  const savedWidth = localStorage.getItem('sidebarWidth');
  if (savedWidth) sidebar.style.width = savedWidth;

  // Restore collapsed state
  if (localStorage.getItem('sidebarCollapsed') === 'true') {
    sidebar.classList.add('collapsed');
  }

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
    const newWidth = Math.min(400, Math.max(180, e.clientX));
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

  // ============================
  //  Sidebar Rendering
  // ============================
  function renderSidebar() {
    let html = '';

    for (const [className, classData] of Object.entries(CLASSES_DATA)) {
      html += `
        <div class="class-group expanded" data-class="${className}">
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
  //  Clear active states
  // ============================
  function clearActiveEntries() {
    document.querySelectorAll('.date-entry.active').forEach(el => el.classList.remove('active'));
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
      const hasTimer = part.prepTime || part.responseTime || (part.type !== 'respond-info-q' && RESPONSE_TIMES[part.type]);

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
        return `<div class="opinion-prompt">${part.content.prompt.replace(/\n/g, '<br>')}</div>`;

      case 'email-response':
        return `
          <div class="email-block">
            <div class="email-meta">
              <div><strong>From:</strong> ${part.content.from}</div>
              <div><strong>To:</strong> ${part.content.to}</div>
              <div><strong>Subject:</strong> ${part.content.subject}</div>
            </div>
            <div class="email-body">${part.content.body.replace(/\n/g, '<br>')}</div>
          </div>
          <p class="email-instruction">${part.content.instruction}</p>
        `;

      case 'sentence-picture':
        return `
          <div class="picture-container">
            ${part.content.imageUrl
            ? `<img src="${part.content.imageUrl}" alt="Write about this picture">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:48px;">${part.content.imagePlaceholder || '🖼️'}</div>`
          }
          </div>
          ${part.content.words ? `<div class="reading-passage"><strong>Words to use:</strong> ${part.content.words.join(', ')}</div>` : ''}
        `;

      default:
        return `<div class="reading-passage">${JSON.stringify(part.content)}</div>`;
    }
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



  // ============================
  //  Trackpad Swipe Navigation
  // ============================
  let swipeCooldown = false;
  const cardContainer = document.getElementById('cardContainer');

  cardContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // Allow trackpad pinch-to-zoom shortcuts
    if (swipeCooldown || currentParts.length <= 1) return;

    // Use deltaX (horizontal scroll) primarily, fall back to deltaY
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    if (Math.abs(delta) < 15) return; // ignore tiny movements

    e.preventDefault();
    swipeCooldown = true;

    if (delta > 0 && currentPart < currentParts.length - 1) {
      window.goToPart(currentPart + 1);
    } else if (delta < 0 && currentPart > 0) {
      window.goToPart(currentPart - 1);
    }

    setTimeout(() => { swipeCooldown = false; }, 400);
  }, { passive: false });

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

      if (player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING) {
        const current = player.getCurrentTime();
        const duration = player.getDuration();
        if (duration > 0) {
          const percent = (current / duration) * 100;
          if (seeker) seeker.value = percent;
          if (timeDisplay) {
            timeDisplay.textContent = `${formatTime(Math.floor(current))} / ${formatTime(Math.floor(duration))}`;
          }
        }
      }
    }
  }


  // ============================
  //  Initialize
  // ============================
  renderSidebar();

})();
