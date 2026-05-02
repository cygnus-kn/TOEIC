// ============================
//  Sidebar Logic
// ============================
const sidebarNav = document.getElementById('sidebarNav');
const sidebar = document.getElementById('sidebar');
// --- Sidebar Resize & Collapse ---

const resizeHandle = document.getElementById('sidebarResizeHandle');
const collapseBtn = document.getElementById('sidebarCollapseBtn');

// Initial width and collapsed state are set via inline script in index.html to prevent FOUC

// Force a browser reflow to apply the instant changes
sidebar.offsetHeight;

// Restore transition
sidebar.style.transition = '';

const ICON_SIDEBAR_HTML = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  <path class="sidebar-icon-fill" d="M3 3h6v18H3z" stroke="none"></path>
  <line x1="9" y1="3" x2="9" y2="21"></line>
</svg>`;

const updateSidebarIcon = (isCollapsed) => {
  if (collapseBtn) {
    if (!collapseBtn.querySelector('.sidebar-icon-fill')) {
      collapseBtn.innerHTML = ICON_SIDEBAR_HTML;
    }
    collapseBtn.classList.toggle('is-extended', !isCollapsed);
  }
};

// Collapse toggle
const toggleSidebar = () => {
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  localStorage.setItem('sidebarCollapsed', isCollapsed);
  updateSidebarIcon(isCollapsed);
};

collapseBtn.addEventListener('click', toggleSidebar);
updateSidebarIcon(sidebar.classList.contains('collapsed'));


// Click outside to collapse (Mobile only)
document.addEventListener('click', (e) => {
  // Only auto-collapse on mobile/tablet (less than 1024px)
  if (window.innerWidth > 1024) return;

  const isSidebarOpen = !sidebar.classList.contains('collapsed');
  const isToggleButton = collapseBtn.contains(e.target);

  // Check if click was outside sidebar AND not on the toggle buttons
  if (isSidebarOpen && !sidebar.contains(e.target) && !isToggleButton) {
    toggleSidebar();
  }
});

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
  const newWidth = Math.min(400, Math.max(240, e.clientX));
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
    const hwCount = (classData.homework || []).length;
    const lessonCount = (classData.lesson || []).length;
    const totalCount = hwCount + lessonCount;

    html += `
      <div class="class-group" data-class="${className}">
        <div class="class-header" onclick="toggleClass('${className}')">
          <div style="display:flex; align-items:center; gap:12px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary);"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>${className}</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="class-count-badge">${totalCount}</span>
            <svg class="class-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
        <div class="class-children">
    `;

    if (classData.homework) {
      for (const hw of classData.homework) {
        const hwLabel = hw.date;
        html += `
          <div class="date-entry" id="entry-${className}-homework-${hw.date}" onclick="selectHomework('${className}', '${hw.date}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>
            <span>${hwLabel}</span>
          </div>`;
      }
    }

    if (classData.lesson) {
      for (const lesson of classData.lesson) {
        const lessonLabel = lesson.date;
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
    const badgeDropdown = dropdown.closest('.badge-dropdown');
    if (badgeDropdown) badgeDropdown.classList.add('open');
  }
}

function closeAllDropdowns() {
  homeworkDropdown.classList.remove('show');
  lessonDropdown.classList.remove('show');
  document.querySelectorAll('.badge-dropdown.open').forEach(el => el.classList.remove('open'));
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
