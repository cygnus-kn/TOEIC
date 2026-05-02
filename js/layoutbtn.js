/**
 * Layout Toggle Button Module
 * Cycles through layout presets: focus → extend → focus → …
 *
 *  focus  — card centred, notepad collapsed, nav default, sidebar collapsed
 *  extend — card left, notepad open (right), nav below notepad
 */

(function () {

  // ============================
  //  Icons
  // ============================
  const ICON_FOCUS = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>`;

  // Filled layout icon: left tall card | right top notepad + right bottom nav bar
  const ICON_EXTEND = `<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="5" height="14" rx="1"/><rect x="8" y="1" width="7" height="8" rx="1"/><rect x="8" y="11" width="7" height="4" rx="1"/></svg>`;

  let currentMode = 'focus';
  let pendingExtendRaf = null; // track rAF so we can cancel it on mode switch

  // ============================
  //  Shared Helpers
  // ============================

  function collapseSidebar() {
    const el = document.getElementById('sidebar');
    if (!el) return;
    el.classList.add('collapsed');
    try { localStorage.setItem('sidebarCollapsed', 'true'); } catch (_) { }
  }

  function collapseNotepad() {
    const overlay = document.getElementById('notepadOverlay');
    const btn = document.getElementById('restoreNotepadBtn');
    if (!overlay) return;
    overlay.classList.add('hidden');
    if (btn) btn.classList.add('show');
    try { localStorage.setItem('toeicNotepadMinimized', 'true'); } catch (_) { }
  }

  function resetCardWindow() {
    const win = document.getElementById('homeworkViewer');
    if (!win) return;
    win.style.setProperty('--homework-window-offset-x', '0px');
    win.style.setProperty('--homework-window-offset-y', '0px');
    try {
      localStorage.setItem('toeicCardWindowOffsetX', '0');
      localStorage.setItem('toeicCardWindowOffsetY', '0');
    } catch (_) { }
    if (typeof cardWindowOffsetX !== 'undefined') cardWindowOffsetX = 0;
    if (typeof cardWindowOffsetY !== 'undefined') cardWindowOffsetY = 0;
  }

  function resetBottomNav() {
    const shell = document.getElementById('bottomRecorderShell');
    if (!shell) return;
    ['position', 'left', 'top', 'bottom', 'right', 'margin', 'width', 'height', 'transform']
      .forEach(p => shell.style[p] = '');
  }

  // ============================
  //  Focus Mode
  // ============================
  function applyFocusMode() {
    // Cancel any pending extend rAF to prevent it from re-showing the notepad
    if (pendingExtendRaf !== null) {
      cancelAnimationFrame(pendingExtendRaf);
      pendingExtendRaf = null;
    }
    collapseSidebar();
    collapseNotepad();
    resetCardWindow();
    resetBottomNav();
    console.log('[Layout] focus');
    window.dispatchEvent(new CustomEvent('layoutChanged', { detail: { layout: 'focus' } }));
  }

  // ============================
  //  Extend Mode
  // ============================
  function applyExtendMode() {
    collapseSidebar();

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Proportional values derived from 1470×797 reference layout
    const npW = Math.round(vw * 0.393);  // ~577px @ 1470
    const npH = Math.round(vh * 0.491);  // ~391px @ 797
    const npLeft = Math.round(vw * 0.543);  // ~798px @ 1470
    const npTop = Math.round(vh * 0.244);  // ~210px @ 797

    // Reset card to natural (centered) position first
    resetCardWindow();

    pendingExtendRaf = requestAnimationFrame(() => {
      pendingExtendRaf = null;
      const win = document.getElementById('homeworkViewer');
      const notepad = document.getElementById('notepadOverlay');
      const shell = document.getElementById('bottomRecorderShell');

      // --- Position notepad ---
      if (notepad) {
        notepad.classList.remove('hidden');
        Object.assign(notepad.style, {
          left: npLeft + 'px',
          top: npTop + 'px',
          right: 'auto',
          bottom: 'auto',
          width: npW + 'px',
          height: npH + 'px',
        });
        const btn = document.getElementById('restoreNotepadBtn');
        if (btn) btn.classList.remove('show');
        try {
          localStorage.setItem('toeicNotepadMinimized', 'false');
          localStorage.setItem('toeicNotepadLeft', npLeft + 'px');
          localStorage.setItem('toeicNotepadTop', npTop + 'px');
          localStorage.setItem('toeicNotepadWidth', npW);
          localStorage.setItem('toeicNotepadHeight', npH);
        } catch (_) { }
      }

      // --- Shift card left: right edge = npLeft − 16px gap ---
      // Y stays at 0 — same vertical height as Focus mode
      if (win) {
        const rect = win.getBoundingClientRect();
        const naturalCX = rect.left + rect.width / 2;
        const offsetX = Math.round((npLeft - 16) - rect.width / 2 - naturalCX);

        win.style.setProperty('--homework-window-offset-x', offsetX + 'px');
        win.style.setProperty('--homework-window-offset-y', '0px');
        if (typeof cardWindowOffsetX !== 'undefined') cardWindowOffsetX = offsetX;
        if (typeof cardWindowOffsetY !== 'undefined') cardWindowOffsetY = 0;
        try {
          localStorage.setItem('toeicCardWindowOffsetX', String(offsetX));
          localStorage.setItem('toeicCardWindowOffsetY', '0');
        } catch (_) { }
      }

      // --- Bottom nav: centred below notepad, 20px gap ---
      if (shell) {
        const shellW = shell.offsetWidth || 252;
        const navLeft = Math.round(npLeft + npW / 2 - shellW / 2);
        const navTop = npTop + npH + 10;

        Object.assign(shell.style, {
          position: 'fixed',
          margin: '0',
          left: navLeft + 'px',
          top: navTop + 'px',
          bottom: 'auto',
          right: 'auto',
          transform: 'none',
          width: '',
          height: '',
        });
      }

      console.log('[Layout] extend');
      window.dispatchEvent(new CustomEvent('layoutChanged', { detail: { layout: 'extend' } }));
    });
  }


  // ============================
  //  Cycle & Button
  // ============================
  function updateBtn(btn) {
    if (currentMode === 'focus') {
      btn.innerHTML = ICON_FOCUS;
      btn.title = 'Focus Mode — Click to switch to Extend';
    } else {
      btn.innerHTML = ICON_EXTEND;
      btn.title = 'Extend Mode — Click to switch to Focus';
    }
  }

  function initLayoutToggle() {
    const btn = document.getElementById('layoutToggleBtn');
    if (!btn) return;

    updateBtn(btn);

    btn.addEventListener('click', () => {
      currentMode = (currentMode === 'focus') ? 'extend' : 'focus';
      updateBtn(btn);

      if (currentMode === 'extend') {
        applyExtendMode();
      } else {
        applyFocusMode();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayoutToggle);
  } else {
    initLayoutToggle();
  }

})();
