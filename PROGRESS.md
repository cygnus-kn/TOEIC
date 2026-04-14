# TOEIC Homework Platform — Progress Tracker

> Last updated: 2026-04-14

---

## 📋 Project Overview

A macOS-inspired, student-authenticated web portal for delivering TOEIC Speaking & Writing homework and class notes. Built with vanilla HTML, CSS, and JavaScript — no frameworks.

**Stack:** `index.html` · `index.css` · `core.js` · `data.js` · `data/` (JSON)  
**Hosted at:** GitHub (`/Users/cygnus/Documents/GitHub/Homework`)

---

## ✅ Completed Features

### 🔓 Authentication
- [x] ~~Student ID login system~~ — **removed** (open access)

### 🗂 Sidebar
- [x] Collapsible sidebar with identically scaled circular toggle buttons
- [x] Drag-to-resize handle with enforced 240px minimum width for desktop readability
- [x] Floating "Island" design: symmetrical 16px/32px gaps for a balanced desktop and mobile appearance
- [x] Auto-collapse behavior disabled on desktop to prevent unintentional UI shifts
- [x] Persistent width + collapsed state via `localStorage` (instantly applies on load)
- [x] Hierarchical navigation: Class → Homework / Lesson → Date entries
- [x] Expand/collapse per class group and category
- [x] Mobile hamburger menu with tap-outside-to-close restriction for desktop

### 📄 Homework Viewer
- [x] Card-based layout with horizontal slide navigation
- [x] Swipe / trackpad scroll to navigate between parts
- [x] Pagination dots with increased touch hit targets for mobile and fixed clickability for desktop
- [x] Glassmorphism date badge using synchronized "Class Button" design language (13.5px font, pill-shape)
- [x] Dropdown to switch between homework dates
- [x] All timers reset when switching parts or homework dates
- [x] State Persistence: App remembers the last viewed class, assignment, and specific part/page on reload

### 🃏 Question Card Types
| Type | Status |
|------|--------|
| Read a Text Aloud | ✅ |
| Describe a Picture | ✅ |
| Respond to Questions | ✅ |
| Respond to Info (table) | ✅ |
| Respond to Info + Audio (Q8-10) | ✅ |
| Express an Opinion | ✅ |
| Email Response (Writing) | ✅ |
| Sentence + Picture (Writing) | ✅ |

### ⏱ Response Timers
- [x] Per-card countdown timers (click to start/pause/resume/reset cycle)
- [x] Prep time stage (yellow) → Response time stage (default)
- [x] CSS progress ring depletes as time runs down
- [x] "Finished" state when timer reaches zero

### 🎵 Audio Player (YouTube IFrame API)
- [x] Hidden YouTube player for `respond-info-q` type
- [x] Custom play/pause button (circular mirrored bookmark-dot design)
- [x] Seekbar with live horizontal time display (`MM:SS / MM:SS`)
- [x] Audio paused automatically when navigating to another part or assignment
- [x] Audio player now supports Shift + Arrow keys for global seeking
- [x] Interactive bookmark dots (8, 9, 10) for rapid navigation to specific question starts with manual active state highlighting
- [x] Integrated "Watch on YouTube" button with custom red SVG branding and redirection confirmation prompt
- [x] Glassy Finish: Translucent Apple-inspired design for all player controls (Play, Bookmarks, YouTube) with sub-pixel optimization for mobile.
- [x] Automated Transcript extraction protocol: AI can now auto-extract question starts and scenario contexts from YouTube links
- [x] Perfectly aligned horizontal layout for all audio controls (Play → Seeker → Time → Bookmarks)
- [x] Redesigned "Transcript" toggle (replacing Reveal/Hide) with optimized auto-width glassy buttons.

### 📚 Lesson Viewer
- [x] Vocabulary section with word, definition, and example
- [x] Sentence structure section with pattern + examples
- [x] Glassmorphism date badge with dropdown to switch between lesson dates
- [x] Unified Scrolling: Lesson page migrated to root-level scrolling (on body) to match homework view

### 🌙 Theme
- [x] Light / Dark mode toggle
- [x] Respects `prefers-color-scheme` on first load
- [x] Theme persisted in `localStorage`
- [x] JPEG schedule glare reduced in dark mode using CSS brightness filters

### 🔔 Notifications
- [x] Toast notification system (e.g., "This is not your class")
- [x] Auto-dismiss with fade-out animation

### ⚡ Optimization & Performance
- [x] **Lazy-Loaded Audio**: YouTube IFrame API now only loads when a task requiring audio is active.
- [x] **Modular Data Architecture**: Monolithic `data.js` split into a lightweight manifest + per-class JSON files.
- [x] **Demand-Driven Loading**: Assignment details are fetched via `fetch()` only when the student selects them.
- [x] **Script Consolidation**: Merged multiple JS files into a single `core.js` to reduce HTTP requests.
- [x] **Mobile UX Polish**: Eliminated phantom tap-highlight boxes globally and implemented a hybrid scroll-directional auto-hiding navigation bar.

---

## 🗄 Data (`data.js`)

### Class S129 (Speaking)
| Type | Entries |
|------|---------|
| Homework | 3 days (Apr 8, Apr 11, Apr 12) |
| Lessons | 2 days (Apr 7, Apr 10) |

### Class S128 (Writing)
| Type | Entries |
|------|---------|
| Homework | 1 day (Apr 10) |
| Lessons | 1 day (Apr 9) |

---

## 🚧 Planned / In Progress

- [ ] Add more homework entries as the course progresses
- [ ] Add more class groups (e.g., S130, S131) when new cohorts begin
- [ ] Improve `describe-picture` cards for HW Day 02 (placeholder image currently used for office scene)
- [ ] Consider adding a "mark as done" toggle per card for student self-tracking
- [ ] Consider adding a review/notes text area per lesson entry
- [ ] Accessibility: keyboard navigation for card swiping

---

## 📐 Mobile Layout Alignment Guide (< 600px)

> **Why this section exists:** During the Apr 13 mobile refinement session, we hit several alignment bugs that each took multiple attempts to diagnose. This section documents what actually controls each element's position, so future changes can be made in one shot.

### Element Hierarchy (top → bottom)

```
body / .app
  └── .main              ← The rounded white card that holds everything
       ├── .main-top-bar  ← Absolute-positioned bar holding the sidebar button
       │    └── .sidebar-toggle-btn  (38px circle)
       ├── .theme-toggle-wrapper     ← Absolute-positioned, separate from top-bar
       │    └── .theme-toggle        (32px pill)
       ├── .welcome-state            ← Only visible when no HW is selected
       └── .homework-viewer          ← Flex column: badge → card → pagination
            ├── .viewer-header       ← Contains the date badge
            ├── .card-container      ← Contains .card-track → .part-card(s)
            └── .pagination          ← The dots
```

### Key Lessons Learned

| Problem | Root Cause | Fix |
|---------|-----------|-----|
| Sidebar button and theme toggle not vertically aligned | Sidebar button is a **flex child** inside `.main-top-bar` — setting `top` on the button itself does nothing. Its vertical position is controlled by `.main-top-bar { top }`. The theme toggle IS independently `position: absolute`. | Set `.main-top-bar { top: 20px }`. Calculate toggle top so both share the same vertical center: `toggle-top = (bar-top + button-height/2) - toggle-height/2`. |
| Badge too far from card | `.homework-viewer` has `gap: var(--space-xl)` (~24px) in the base CSS. `margin-bottom` on `.viewer-header` was fighting the flex gap. | Override `.homework-viewer { gap: 16px }` in the mobile media query. |
| Two `.homework-viewer` rules in the same `@media` block | An earlier fix added `gap: 6px`, then a later fix added `gap: 14px` in a separate rule above. The 6px rule appeared later in the file and silently won. | **Always consolidate** — search for duplicates before adding a new rule. One rule per selector per media query. |
| Card vertically centered (should be top-aligned) | `.main { justify-content: center }` in the base CSS centers everything vertically. | Override to `justify-content: flex-start` on mobile. |
| Welcome state ("Select a homework...") also got top-aligned | `.welcome-state` is inside `.main`, so `flex-start` pulled it up too. | Give `.welcome-state { flex: 1; min-height: 60vh; justify-content: center }` on mobile so it fills remaining space and self-centers. |
| Card height was constrained / cut off | `.part-card { max-height: 100% }` in the base CSS, combined with flex containers, capped card height. | Override to `max-height: none` on mobile. Also set `height: auto` and `flex: none` on `.card-container`, `.card-track`, and `.homework-viewer`. |
| Card lost rounded top corners | Setting `overflow: visible` on `.part-card` broke `border-radius` clipping. | `overflow` must stay `hidden` on `.part-card`. Height growth is controlled by `max-height: none`, not overflow. |
| Body didn't scroll on mobile | `body { overflow: hidden; height: 100dvh }` in the base CSS. | Override on mobile: `body, .app { overflow: unset; height: auto; min-height: 100dvh }`. |
| Audio controls misaligned | Timestamp was below seeker, shifting the buttons container height. | Moved timestamp inline (horizontal) and removed vertical margin hacks. Now all controls share a common flex baseline. |
| YouTube icon missing circle | Applied `transparent` border/background in light mode. | Inherited base `.bookmark-dot` styles for a consistent circular look. |
| Part 4 text missing scenario | Only question text was being added during construction. | Protocol updated to extract and include speaker scenarios (e.g., "I was told...") in the reveal text string. |
| Reveal button layout shift | Button width changed based on text length. | Enforced fixed `145px` width for ".reveal-btn". |
| Glassy button borders look thick on mobile | Sub-pixel scaling combined `border` + `inset-shadow` into a heavy 2px band. | Re-engineered glassy styles to use razor-thin 1px borders with NO inset shadows on mobile (`@media max-width: 600px`). |

### Quick Reference: What Controls What

| What you want to move | Change this property | On this selector |
|-----------------------|---------------------|-----------------|
| Sidebar button vertical position | `top` | `.main-top-bar` (mobile override) |
| Theme toggle vertical position | `top` | `.theme-toggle-wrapper` (mobile override) |
| Badge ↔ Card gap | `gap` | `.homework-viewer` (mobile override) |
| Badge ↔ Top icons gap | `margin-top` | `.viewer-header` (mobile override) |
| Card top alignment | `justify-content` | `.main` (mobile override) |
| Pagination position | `position: fixed; bottom` | `.pagination` (mobile override) |
| Card scales proportionally | `zoom` | `.part-card` (mobile override) |

### Current Mobile Values (Apr 13)

```css
.main-top-bar        { top: 48px } /* Aligned to sidebar button center (67px) */
.theme-toggle-wrapper { top: 51px } /* Aligned to sidebar button center (67px) */
.viewer-header       { margin-top: 70px } /* Baseline alignment with icons */
.homework-viewer     { gap: 16px }         /* Badge ↔ Card spacing */
.part-card           { zoom: 0.88 }        /* Proportional scaling */
.pagination          { position: fixed; bottom: 28px } /* Thumb zone */
```

---

## 🐛 Known Issues / Watch List

- Audio poller (`setInterval`) is not explicitly cancelled when a non-audio card is rendered — low impact but worth cleaning up
- `S128` class only has one student range defined implicitly; if more students are added, the password list in `passwords.md` and `VALID_USER_IDS` in `app.js` must both be updated

---

## 📅 Session Log

| Date | What was done |
|------|---------------|
| Apr 7 | Initial platform design, lesson viewer, dark mode |
| Apr 8 | HW Day 01 data added (S129) |
| Apr 9 | S128 class + writing task types added |
| Apr 10 | Lesson Day 02 added, macOS design language refined |
| Apr 11 | Login system implemented, glassmorphism dropdown, sidebar density polished |
| Apr 12 | HW Day 03 data added with YouTube audio, image references finalized |
| Apr 12 | Authentication feature removed — platform is now open access |
| Apr 12 | Refactored architecture into multi-file modules (`sidebar.js`, `viewer.js`, `audio.js`). Refined layout alignments, dropdown scaling, and `100dvh` layout adjustments. |
| Apr 13 | **Layout & Aesthetic Polish**: Pixel-perfect vertical alignment of navigation icons. Refined date badge to match class-button aesthetics. Symmetrical floating sidebar. Unified root-level scrolling across all views. |
| Apr 14 | **Part 4 UI & Automation**: Redesigned audio footer for horizontal alignment. Implemented 36px circular play button and 26px bookmark dots. Refined "Watch on YouTube" icon. Established automated extraction protocol for YouTube transcripts and scenarios. Formally documented extraction workflow in `ADD_HOMEWORK.md`. Cleaned up data for S129 Day 03. |
| Apr 14 | **UI/UX Polish**: Investigated UI flows with visual bot. Fixed dark mode image glare via filters. Handled mobile phantom tap highlights. Replaced basic time-hide logic with a hybrid scroll-directional mechanism for the top nav. |
| Apr 14 | **Glassy UI & Player Refinement**: Implemented Apple-style backdrop-blur finishes for Transcript and Audio buttons. Refined border thickness for distinct desktop/mobile experiences. Replaced generic YT icon with branded SVG and added redirection prompt. Simplified "Transcript" toggle logic. |

---

## 🔑 Access

The platform is now open — no login required.
