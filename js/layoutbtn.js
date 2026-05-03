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
  const LAYOUT_MODE_KEY = 'toeicLayoutMode';
  const VALID_LAYOUT_MODES = new Set(['focus', 'simple', 'extend']);
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
  function updateMenu(menu) {
    if (!menu) return;
    menu.querySelectorAll('[data-layout-mode]').forEach((item, index) => {
      const isActive = item.dataset.layoutMode === currentMode;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-checked', String(isActive));
      item.style.order = isActive ? '0' : String(index + 1);
    });
  }

  function getSavedLayoutMode() {
    try {
      const savedMode = localStorage.getItem(LAYOUT_MODE_KEY);
      return VALID_LAYOUT_MODES.has(savedMode) ? savedMode : currentMode;
    } catch (_) {
      return currentMode;
    }
  }

  function saveLayoutMode(mode) {
    try { localStorage.setItem(LAYOUT_MODE_KEY, mode); } catch (_) { }
  }

  function applyLayoutMode(mode) {
    if (!VALID_LAYOUT_MODES.has(mode)) mode = 'focus';
    currentMode = mode;
    saveLayoutMode(currentMode);
    const menu = document.getElementById('layoutMenu');
    updateMenu(menu);

    if (currentMode === 'extend') {
      applyExtendMode();
    } else if (currentMode === 'simple') {
      applySimpleMode();
    } else {
      applyFocusMode();
    }
  }

  window.reapplyLayoutMode = function () {
    applyLayoutMode(currentMode);
  };

  function setMenuOpen(open) {
    const topBar = document.querySelector('.layout-top-bar');
    const menu = document.getElementById('layoutMenu');
    if (!menu) return;
    topBar?.classList.toggle('menu-open', open);
    menu.classList.toggle('show', open);
    menu.setAttribute('aria-expanded', String(open));
  }

  function initLayoutToggle() {
    const topBar = document.querySelector('.layout-top-bar');
    const menu = document.getElementById('layoutMenu');
    if (!menu) return;
    const desktopHoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    applyLayoutMode(getSavedLayoutMode());

    topBar?.addEventListener('pointerenter', () => {
      if (desktopHoverQuery.matches) setMenuOpen(true);
    });

    topBar?.addEventListener('pointerleave', () => {
      if (desktopHoverQuery.matches) setMenuOpen(false);
    });

    menu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-layout-mode]');
      if (!item) return;
      const isOpen = menu.classList.contains('show');
      if (item.dataset.layoutMode === currentMode) {
        setMenuOpen(!isOpen);
        return;
      }
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
