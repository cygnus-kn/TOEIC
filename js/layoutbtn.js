/**
 * Layout Toggle Button Module
 * Cycles through layout presets: focus → simple → extend → focus → …
 *
 *  focus  — card centered, notepad collapsed, nav default, sidebar collapsed
 *  extend — card left, notepad open (right), nav below notepad
 *  simple — homework header controls and the active part card are shown
 */

(function () {

  // ============================
  //  Icons
  // ============================
  const ICON_FOCUS = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>`;

  // Filled layout icon: left tall card | right top notepad + right bottom nav bar
  const ICON_EXTEND = `<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="5" height="14" rx="1"/><rect x="8" y="1" width="7" height="8" rx="1"/><rect x="8" y="11" width="7" height="4" rx="1"/></svg>`;
  const ICON_SIMPLE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M2 2l20 20"/></svg>`;

  let currentMode = 'focus';
  let pendingExtendRaf = null; // track rAF so we can cancel it on mode switch
  let pendingResizeRaf = null;
  let pendingBottomNavTeleport = null;

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

  function resetCardWindowForMeasurement() {
    const win = document.getElementById('homeworkViewer');
    if (!win) return;
    const previousTransition = win.style.transition;
    win.style.transition = 'none';
    resetCardWindow();
    win.offsetHeight;
    win.style.transition = previousTransition;
  }

  function resetBottomNav() {
    const shell = document.getElementById('bottomRecorderShell');
    if (!shell) return;
    teleportBottomNav(shell, 'centered', () => {
      ['position', 'left', 'top', 'bottom', 'right', 'margin', 'width', 'height', 'transform']
        .forEach(p => shell.style[p] = '');
    });
  }

  function setSimpleChromeHidden(hidden) {
    document.body.classList.toggle('layout-simple', hidden);
  }

  function setLayoutNavSuppressed(suppressed) {
    document.body.classList.toggle('layout-nav-suppressed', suppressed);
  }

  function teleportBottomNav(shell, finalPosition, applyFinalPosition) {
    if (!shell || typeof applyFinalPosition !== 'function') return;

    if (pendingBottomNavTeleport !== null) {
      clearTimeout(pendingBottomNavTeleport);
      pendingBottomNavTeleport = null;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      applyFinalPosition();
      shell.classList.remove('layout-teleporting');
      shell.dataset.layoutPosition = finalPosition;
      return;
    }

    shell.dataset.layoutPosition = shell.style.transform === 'none' ? 'anchored' : 'centered';
    shell.classList.add('layout-teleporting');

    pendingBottomNavTeleport = setTimeout(() => {
      shell.classList.add('layout-positioning');
      applyFinalPosition();
      shell.dataset.layoutPosition = finalPosition;
      shell.offsetHeight;
      shell.classList.remove('layout-teleporting');
      setTimeout(() => {
        shell.classList.remove('layout-positioning');
      }, 220);
      pendingBottomNavTeleport = null;
    }, 180);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getActiveCardHeaderTop() {
    const track = document.getElementById('cardTrack');
    const activeCard = track?.children?.[typeof currentPart === 'number' ? currentPart : 0];
    const header = activeCard?.querySelector?.('.card-header-bar') || document.querySelector('.card-header-bar');
    const headerTop = header?.getBoundingClientRect?.().top;
    return Number.isFinite(headerTop) ? Math.round(headerTop) : null;
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
    if (pendingResizeRaf !== null) {
      cancelAnimationFrame(pendingResizeRaf);
      pendingResizeRaf = null;
    }
    setLayoutNavSuppressed(false);
    setSimpleChromeHidden(false);
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
    if (pendingExtendRaf !== null) {
      cancelAnimationFrame(pendingExtendRaf);
      pendingExtendRaf = null;
    }
    const wasSimpleMode = document.body.classList.contains('layout-simple');
    if (wasSimpleMode) setLayoutNavSuppressed(true);
    setSimpleChromeHidden(false);

    collapseSidebar();

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Proportional values derived from 1470×797 reference layout
    const npW = clamp(Math.round(vw * 0.393), vw < 1100 ? 240 : 320, 580);  // ~577px @ 1470
    const npH = Math.round(vh * 0.491);  // ~391px @ 797
    const npLeft = clamp(Math.round(vw * 0.543), 16, vw - npW - 16);  // ~798px @ 1470
    const fallbackTop = Math.round(vh * 0.244);  // ~210px @ 797

    // Reset synchronously so repeated Extend selections measure the true centered position.
    resetCardWindowForMeasurement();

    pendingExtendRaf = requestAnimationFrame(() => {
      pendingExtendRaf = null;
      const win = document.getElementById('homeworkViewer');
      const notepad = document.getElementById('notepadOverlay');
      const shell = document.getElementById('bottomRecorderShell');
      const cardHeaderTop = getActiveCardHeaderTop();
      const npTop = clamp(cardHeaderTop ?? fallbackTop, 16, Math.max(16, vh - npH - 16));

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
        const applyAnchoredBottomNav = () => {
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
        };

        if (wasSimpleMode) {
          applyAnchoredBottomNav();
          shell.dataset.layoutPosition = 'anchored';
          shell.classList.remove('layout-teleporting');
          requestAnimationFrame(() => setLayoutNavSuppressed(false));
        } else {
          teleportBottomNav(shell, 'anchored', applyAnchoredBottomNav);
        }
      } else {
        setLayoutNavSuppressed(false);
      }

      console.log('[Layout] extend');
      window.dispatchEvent(new CustomEvent('layoutChanged', { detail: { layout: 'extend' } }));
    });
  }

  function scheduleExtendReflow() {
    if (currentMode !== 'extend' || pendingResizeRaf !== null) return;
    pendingResizeRaf = requestAnimationFrame(() => {
      pendingResizeRaf = null;
      applyExtendMode();
    });
  }

  // ============================
  //  Simple Mode
  // ============================
  function applySimpleMode() {
    if (pendingExtendRaf !== null) {
      cancelAnimationFrame(pendingExtendRaf);
      pendingExtendRaf = null;
    }
    if (pendingResizeRaf !== null) {
      cancelAnimationFrame(pendingResizeRaf);
      pendingResizeRaf = null;
    }
    collapseSidebar();
    collapseNotepad();
    resetCardWindow();
    resetBottomNav();
    setLayoutNavSuppressed(false);
    setSimpleChromeHidden(true);
    console.log('[Layout] simple');
    window.dispatchEvent(new CustomEvent('layoutChanged', { detail: { layout: 'simple' } }));
  }


  // ============================
  //  Menu & Button
  // ============================
  function updateBtn(btn) {
    if (currentMode === 'focus') {
      btn.innerHTML = ICON_FOCUS;
      btn.title = 'Focus Mode';
    } else if (currentMode === 'extend') {
      btn.innerHTML = ICON_EXTEND;
      btn.title = 'Extend Mode';
    } else {
      btn.innerHTML = ICON_SIMPLE;
      btn.title = 'Simple Mode';
    }
  }

  function updateMenu(menu) {
    if (!menu) return;
    menu.querySelectorAll('[data-layout-mode]').forEach(item => {
      const isActive = item.dataset.layoutMode === currentMode;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-checked', String(isActive));
    });
  }

  function applyLayoutMode(mode) {
    currentMode = mode;
    const btn = document.getElementById('layoutToggleBtn');
    const menu = document.getElementById('layoutMenu');
    if (btn) updateBtn(btn);
    updateMenu(menu);

    if (currentMode === 'extend') {
      applyExtendMode();
    } else if (currentMode === 'simple') {
      applySimpleMode();
    } else {
      applyFocusMode();
    }
  }

  function setMenuOpen(open) {
    const topBar = document.querySelector('.layout-top-bar');
    const btn = document.getElementById('layoutToggleBtn');
    const menu = document.getElementById('layoutMenu');
    if (!btn || !menu) return;
    topBar?.classList.toggle('menu-open', open);
    menu.classList.toggle('show', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  function initLayoutToggle() {
    const btn = document.getElementById('layoutToggleBtn');
    const menu = document.getElementById('layoutMenu');
    if (!btn) return;

    updateBtn(btn);
    updateMenu(menu);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setMenuOpen(!menu?.classList.contains('show'));
    });

    menu?.addEventListener('click', (e) => {
      const item = e.target.closest('[data-layout-mode]');
      if (!item) return;
      applyLayoutMode(item.dataset.layoutMode);
      setMenuOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.layout-top-bar')) return;
      setMenuOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    });

    window.addEventListener('resize', scheduleExtendReflow);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayoutToggle);
  } else {
    initLayoutToggle();
  }

})();
