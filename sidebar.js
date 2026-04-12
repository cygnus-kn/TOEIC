'use strict';

// --- Sidebar Resize & Collapse ---
const sidebar = document.getElementById('sidebar');
const resizeHandle = document.getElementById('sidebarResizeHandle');
const collapseBtn = document.getElementById('sidebarCollapseBtn');

// Temporarily disable transition to prevent animation on load
sidebar.style.transition = 'none';

// Restore saved width
const savedWidth = localStorage.getItem('sidebarWidth');
if (savedWidth) sidebar.style.width = savedWidth;

// Restore collapsed state
if (localStorage.getItem('sidebarCollapsed') === 'true') {
  sidebar.classList.add('collapsed');
}

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

// Initialize
renderSidebar();
