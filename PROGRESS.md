# TOEIC Homework Platform — Progress Tracker

> Last updated: 2026-05-01

---

## 📋 Project Overview

A macOS-inspired, open-access web portal for delivering TOEIC Speaking & Writing homework and class notes. Built with vanilla HTML, CSS, and JavaScript — no frameworks.

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
- [x] Swipe and keyboard arrow navigation between parts
- [x] Pagination dots with increased touch hit targets for mobile and fixed clickability for desktop
- [x] Glassmorphism date badge using synchronized "Class Button" design language (13.5px font, pill-shape)
- [x] Dropdown to switch between homework dates
- [x] All timers reset when switching parts or homework dates
- [x] State Persistence: App remembers the last viewed class, assignment, and specific part/page on reload

- [x] **Theater Mode**: Added a "Scan" focus button that dims the background with a soft blur to eliminate distractions.
- [x] **Zero-Flash Transitions**: Overhauled the platform's z-index hierarchy (Notepad: 2100, Backdrop: 2050) to ensure seamless layering during mode shifts.
- [x] **Intuitive Exit Paths**: Integrated **Esc** key, backdrop-click, and auto-exit on minimize to make Focus Mode effortless to manage.
- [x] **Universal Transitions**: Synchronized all notepad property changes (color, border, blur) to match the global 150ms theme speed.
- [x] **Pro-Level Transcription**: Integrated **Deepgram Nova-2** via WebSockets for professional accuracy and cross-browser support (Firefox/Safari).
- [x] **Word & Copy Utility**: Integrated a minimalist footer with a real-time word counter and a one-click "Copy all" button with visual success feedback.

### 🃏 Question Card Types
| Type                                    | Status |
| --------------------------------------- | ------ |
| Read a Text Aloud                       | ✅      |
| Describe a Picture                      | ✅      |
| Respond to Questions                    | ✅      |
| Respond to Info (table)                 | ✅      |
| Respond to Info + YouTube / Local Audio | ✅      |
| Express an Opinion                      | ✅      |
| Email Response (Writing)                | ✅      |
| Sentence + Picture (Writing)            | ✅      |
| Topic Preparation                       | ✅      |

### ⏱ Response Timers
- [x] Per-card countdown timers (click to start/pause/resume/reset cycle)
- [x] Prep time stage (yellow) → Response time stage (default)
- [x] Topic preparation cards each get independent timers
- [x] "Finished" state when timer reaches zero

### 🎵 Audio Player (YouTube IFrame API + Local HTML5 Audio)
- [x] Hidden YouTube player for `respond-info-q` entries with `videoUrl`
- [x] Local audio player for `respond-info-q` entries with `audioUrls` arrays
- [x] Custom play/pause button (circular mirrored bookmark-dot design)
- [x] Seekbar with live horizontal time display (`MM:SS / MM:SS`)
- [x] Audio paused automatically when navigating to another part or assignment
- [x] Audio player now supports Shift + Arrow keys for global seeking
- [x] Interactive bookmark dots for rapid navigation to question starts / separate local clips
- [x] Integrated "Watch on YouTube" button for YouTube-backed tasks with custom red SVG branding and redirection confirmation prompt
- [x] Glassy Finish: Translucent Apple-inspired design for all player controls (Play, Bookmarks, YouTube) with sub-pixel optimization for mobile
- [x] Automated transcript extraction protocols for YouTube links and local audio workflows
- [x] Perfectly aligned horizontal layout for all audio controls (Play → Seeker → Time → Bookmarks)
- [x] Redesigned "Transcript" toggle (replacing Reveal/Hide) with optimized auto-width glassy buttons

### 🎙 Recorder Controls
- [x] Primary center control now changes by state: record → stop → play → pause
- [x] Secondary controls now support `Record again`, delete-with-confirmation, and renamed-save flow
- [x] First use of `Record again` shows a one-time destructive warning, then later uses stay instant via `localStorage`
- [x] Recorder bar icon strokes and timer weight were tuned so the center action stays visually dominant

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

### ⚡ Optimization & Performance
- [x] **Lazy-Loaded Audio**: YouTube IFrame API now only loads when a task requiring audio is active.
- [x] **Modular Data Architecture**: Monolithic `data.js` split into a lightweight manifest + per-class JSON files.
- [x] **Demand-Driven Loading**: Assignment details are fetched via `fetch()` only when the student selects them.
- [x] **Script Consolidation**: Merged multiple JS files into a single `core.js` to reduce HTTP requests.
- [x] **Mobile UX Polish**: Eliminated phantom tap-highlight boxes globally and implemented a hybrid scroll-directional auto-hiding navigation bar.
- [x] **Recording & Controls Overhaul**: Added immediate Redo functionality, prioritized MP4 format for iOS/Safari, enforced a 2-minute safety limit, and implemented a premium Rename Modal for saving recordings.
- [x] **Unified Media Player**: Redesigned the recording interface into a "Music Player" style pill with an integrated seeker bar that smoothly expands when a recording is ready.
- [x] **Desktop Draggable Nav**: Implemented mouse-dragging for the navigation bar, allowing desktop users to reposition the player anywhere on the screen.
- [x] **Aesthetic Overhaul**: Revamped light mode with a "Clean Glass" look, using pure white backdrops and accent blue tints. Optimized dark mode icon contrast for high legibility.
- [x] **Recording Stability**: Resolved the "Ghost Timer" bug by ensuring all background timeouts are explicitly cleared during navigation and re-recording.
- [x] **Permanent Mobile Nav**: Separated the recording pill from the auto-hide system on mobile to ensure it remains visible at all times during active sessions.
- [x] **Universal Alignment System**: Implemented a CSS-variable-driven "Horizon Line" at 67px, ensuring toggle buttons and switches are perfectly aligned on all screen sizes.
- [x] **Mobile Optimization**: Reduced mobile sidebar width to 220px and moved drag-and-drop logic into `core.js` for better codebase maintenance.

---

## 🗄 Data (`data.js`)

### SW Class (Speaking & Writing)
| Type     | Entries |
| -------- | ------- |
| Homework | 13 days |
| Lessons  | 0 days  |

### Class S128 (Writing)
| Type     | Entries       |
| -------- | ------------- |
| Homework | 2 days        |
| Lessons  | 1 day (Apr 9) |

### Class S129 (Speaking)
| Type     | Entries |
| -------- | ------- |
| Homework | 3 days  |
| Lessons  | 2 days  |

---

## 🚧 Planned / In Progress

- [ ] Add more homework entries as the course progresses
- [ ] Add more class groups (e.g., S130, S131) when new cohorts begin
- [ ] Sync `ADD_HOMEWORK.md` with the live local-audio `audioUrls` schema
- [ ] Restore visible timer progress-ring CSS or remove the unused `--progress` updates from timer logic
- [ ] Implement or remove the unused `notificationContainer` toast mount point
- [ ] Consider adding a "mark as done" toggle per card for student self-tracking
- [ ] Consider adding a review/notes text area per lesson entry
- [ ] Accessibility: broader focus management and keyboard support beyond current arrow-key part navigation

---

## 🎨 Layout Alignment & Technical Guides

<details>
<summary><b>Mobile Layout Alignment Guide (< 600px)</b></summary>

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
| Problem                                                 | Root Cause                                                                                                                                                                                                                           | Fix                                                                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar button and theme toggle not vertically aligned  | Sidebar button is a **flex child** inside `.main-top-bar` — setting `top` on the button itself does nothing. Its vertical position is controlled by `.main-top-bar { top }`. The theme toggle IS independently `position: absolute`. | Set `.main-top-bar { top: 20px }`. Calculate toggle top so both share the same vertical center: `toggle-top = (bar-top + button-height/2) - toggle-height/2`. |
| Badge too far from card                                 | `.homework-viewer` has `gap: var(--space-xl)` (~24px) in the base CSS. `margin-bottom` on `.viewer-header` was fighting the flex gap.                                                                                                | Override `.homework-viewer { gap: 16px }` in the mobile media query.                                                                                          |
| Two `.homework-viewer` rules in the same `@media` block | An earlier fix added `gap: 6px`, then a later fix added `gap: 14px` in a separate rule above. The 6px rule appeared later in the file and silently won.                                                                              | **Always consolidate** — search for duplicates before adding a new rule. One rule per selector per media query.                                               |
| Card height was constrained / cut off                   | `.part-card { max-height: 100% }` in the base CSS, combined with flex containers, capped card height.                                                                                                                                | Override to `max-height: none` on mobile. Also set `height: auto` and `flex: none` on `.card-container`, `.card-track`, and `.homework-viewer`.               |
| Audio controls misaligned                               | Timestamp was below seeker, shifting the buttons container height.                                                                                                                                                                   | Moved timestamp inline (horizontal) and removed vertical margin hacks. Now all controls share a common flex baseline.                                         |
| Glassy button borders look thick on mobile              | Sub-pixel scaling combined `border` + `inset-shadow` into a heavy 2px band.                                                                                                                                                          | Re-engineered glassy styles to use razor-thin 1px borders with NO inset shadows on mobile.                                                                    |

</details>

<details>
<summary><b>Case Study: The "Ghost Cache" Navigation Bug</b></summary>

### The Core Objective
Enable the user to click and drag the microphone navigation bar to any position on the screen to prevent it from obstructing content.

### Troubleshooting Phases

1. **Phase 1: The "Pointer: Coarse" Blocker**
   - **Discovery:** `window.matchMedia("(pointer: coarse)")` was causing the script to return early on modern "hybrid" laptops.
   - **Fix:** Removed the check and migrated to the unified **Pointer Events API**.

2. **Phase 2: The WebKit Hit-Testing Bug**
   - **Discovery:** `backdrop-filter` elements inside `pointer-events: none` parents fail hit-testing in Safari.
   - **Fix:** Removed `pointer-events: none` and added legacy vendor prefixes.

3. **Phase 3: CSS & Event Brute Force**
   - **Discovery:** Browser ignored `mousedown` on flex container empty space.
   - **Fix:** Applied `cursor: grab !important` and reverted to classic `mousedown` on `window` for stability.

4. **Phase 4: Document-Level Tracking & Visual Debugging**
   - **Discovery:** Diagnostic colors (red/green) failed to appear during clicks.
   - **Fix:** Moved listeners to `document` level to prove event detection.
   - **Result:** **Critical Failure.** Proved the browser was not running the latest code despite hard resets.

5. **Phase 5: The "Ghost Cache" Revelation**
   - **Discovery:** A browser subagent verified the console saw debug logs that no longer existed on disk.
   - **Fix:** Confirmed a "Ghost Cache" where the browser served an old script version from memory.

### Final Resolution: The Surgical Strike
1. **ID Renaming:** Changed ID from `bottomNav` to `bottomNav_v14` to break links with cached scripts.
2. **Inline Logic:** Moved the drag-and-drop JS into an **inline `<script>` tag** in `index.html`.
3. **Restoration:** Once the cache was busted, successfully returned to the original `bottomNav` ID.

**Result:** **SUCCESS.** The navigation bar is now fully draggable across all browsers.

---

### 🧠 AI Recovery Protocol: If Dragging Breaks Again
> **ATTENTION FUTURE ASSISTANTS:** This project is extremely sensitive to "Ghost Caching." If you modify the drag logic and the user says "nothing changed," **DO NOT** keep editing external `.js` files. Follow this protocol:

1. **The ID Maneuver**: Temporarily rename the navigation bar ID in `index.html`, `index.css`, and the script (e.g., `bottomNav` → `bottomNav_RECOVERY`). This forces the browser to ignore any cached scripts targeting the old ID.
2. **The Inline Authority**: Keep the core drag logic **INLINE** within `index.html`. External files (`core.js`) are heavily cached; the HTML itself is the only authority the browser reliably reloads.
3. **Brute Force Coordinates**:
   - The bar starts with `transform: translateX(-50%)` and `left: 50%`. 
   - On `mousedown`, you **MUST** immediately calculate `getBoundingClientRect()`, set the element to `position: fixed`, and hard-code its `top` and `left` to match the rect.
   - **Crucial:** Set `transform: none` and `margin: 0` the moment the drag starts. If you don't, the CSS centering will "double-offset" the movement and make the bar fly off-screen.
4. **Return to Original ID**: Once the feature is confirmed working, you can safely rename the ID back to `bottomNav`.

</details>

---

## 🐛 Known Issues / Watch List

- Documentation drift: `ADD_HOMEWORK.md` still documents local `respond-info-q` around a single `audioUrl` plus `timestamps`, while live `SW Class` data now uses `audioUrls` arrays for separate question clips.
- Timer JS still updates a `--progress` CSS variable, but the current stylesheet does not render a visible progress ring from it.
- `index.html` contains `notificationContainer`, but no toast notification implementation is currently present in `core.js` / `index.css`.

---

## 📅 Session Log

| Date   | What was done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apr 7  | Initial platform design, lesson viewer, dark mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Apr 8  | HW Day 01 data added (S129)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Apr 9  | S128 class + writing task types added                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Apr 10 | Lesson Day 02 added, macOS design language refined                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Apr 11 | Login system implemented, glassmorphism dropdown, sidebar density polished                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Apr 12 | HW Day 03 data added with YouTube audio, image references finalized                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Apr 12 | Authentication feature removed — platform is now open access                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Apr 12 | Refactored architecture into multi-file modules (`sidebar.js`, `viewer.js`, `audio.js`). Refined layout alignments, dropdown scaling, and `100dvh` layout adjustments.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Apr 13 | **Layout & Aesthetic Polish**: Pixel-perfect vertical alignment of navigation icons. Refined date badge to match class-button aesthetics. Symmetrical floating sidebar. Unified root-level scrolling across all views.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Apr 14 | **Part 4 UI & Automation**: Redesigned audio footer for horizontal alignment. Implemented 36px circular play button and 26px bookmark dots. Refined "Watch on YouTube" icon. Established automated extraction protocol for YouTube transcripts and scenarios. Formally documented extraction workflow in `ADD_HOMEWORK.md`. Cleaned up data for S129 Day 03.                                                                                                                                                                                                                                                                                                                                                                      |
| Apr 14 | **UI/UX Polish**: Investigated UI flows with visual bot. Fixed dark mode image glare via filters. Handled mobile phantom tap highlights. Replaced basic time-hide logic with a hybrid scroll-directional mechanism for the top nav.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Apr 14 | **Glassy UI & Player Refinement**: Implemented Apple-style backdrop-blur finishes for Transcript and Audio buttons. Refined border thickness for distinct desktop/mobile experiences. Replaced generic YT icon with branded SVG and added redirection prompt. Simplified "Transcript" toggle logic.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Apr 21 | **Homework Expansion**: Extracted passages, parsed 20+ images from PDF materials, and fully integrated HW Day 04 through HW Day 08. Configured custom JSON labels for distinct question groupings. **UI Enhancement**: Overhauled sidebar class folders and date dropdown menus with capped dimensions (~5 items) and hidden slick scrollbars for cleaner UI density. Fixed global card-container padding to enable end-of-page mobile auto-hide logic.                                                                                                                                                                                                                                                                           |
| Apr 25 | **Global Image Zoom**: Implemented a universal full-screen image modal overlay with a glassmorphism backdrop. Added 'Escape' key dismissal, disabled background keyboard navigation while zooming, and added native tooltips. **Performance & UX**: Resolved page-load transition flashes (FOUC) using a strategic `.preload` class. Rebranded core class tab from "Homework" to "SW Class" and properly migrated data files. Confirmed In-Memory JSON caching is functional for optimal load times.                                                                                                                                                                                                                              |
| Apr 26 | **Schema Normalization & Content Updates**: Transitioned `respond-questions` to strict typing (`respond-questions-15` and `respond-questions-30`) in `core.js` and JSON data to eliminate manual `responseTime` fields. Standardized the label for `respond-info-q` to remove redundant numbering. Appended comprehensive "Local Audio Transcript Extraction Guide" to `ADD_HOMEWORK.md` and added generic placeholders for variable response times in `topic-prep`. Extracted and integrated HW Day 10 content from workbook PDF with WebP image conversion. **CSS Refactoring**: Modularized `index.css` by moving monolithic mobile media queries inline beneath respective desktop components.                                |
| Apr 27 | **Respond Questions Cleanup**: Migrated remaining `respond-questions` JSON entries in `SW Class` and `S129` to strict `respond-questions-15` / `respond-questions-30` types, removed redundant `responseTime` fields for those cards, removed the legacy renderer fallback from `core.js`, and updated `ADD_HOMEWORK.md` to block new legacy usage.                                                                                                                                                                                                                                                                                                                                                                               |
| Apr 27 | **Recording & Navigation Overhaul**: Integrated immediate "Redo" functionality and forced a permanent mobile nav bar for active recording sessions. Prioritized `.mp4` format for iOS devices. Implemented a 2-minute recording limit safeguard. Added a premium "Save Rename Modal" for customized file downloads. Refined CSS transitions for the bottom nav pill and timer reveal.                                                                                                                                                                                                                                                                                                                                             |
| Apr 28 | **Unified Media Player & UI Polish**: Redesigned the recorder into a "Music Player" squircle with a seeker bar that expands when a recording is ready. Added **desktop dragging** support for the nav bar. **Aesthetic Overhaul**: Implemented a "Clean Glass" light mode with accent tints and high-contrast charcoal icons. **Stability**: Fixed the "Ghost Timer" bug that caused recordings to stop prematurely at 8s/24s. Adjusted HW Day 18 Question 9 timestamp for better audio alignment.                                                                                                                                                                                                                                |
| Apr 28 | **Recorder Interaction Refinement**: Converted the center recorder into a true stateful control (record, stop, play, pause), repurposed the side playback button into delete-with-confirmation, relabeled the left action to `Record again`, added a first-use redo warning stored in `localStorage`, and rebalanced icon/timer weights so side controls no longer overpower the primary action.                                                                                                                                                                                                                                                                                                                                  |
| Apr 29 | **Mobile UI Finalization**: Restored and refined the hybrid mobile auto-hide logic. Implemented the strict **"Empty Surface Only"** touch-to-reveal rule, ensuring that tapping background areas reveals the UI while swiping cards or reading text does not. Fought the **"Ghost Cache"** once more by using inline scripts for verification before moving back to `core.js`. Consolidated sidebar toggle definitions to prevent script crashes.                                                                                                                                                                                                                                                                                 |
| Apr 30 | **Refinement & Robustness**: Migrated the bottom navigation drag logic from `index.html` into `core.js` and resolved local development connectivity issues for mobile testing. **Universal Alignment**: Replaced hardcoded vertical positions with a mathematical CSS variable system (`--header-center-y`) that guarantees perfect icon alignment on both platforms. Reduced mobile sidebar width to 220px for improved viewport density. **Nav Interaction Fix**: Resolved a bug where the bottom nav would "stick" or expand incorrectly after dragging; implemented a system to clear fixed dimensions on `mouseup` to allow for dynamic growth when the seeker expands. Refined drag targets to prevent accidental movement. |
| Apr 30 | **Naming Standardization**: Unified the homework and lesson naming convention to `[HW-XX] DD/MM` and `[Lesson-XX] DD/MM` across the entire platform. Updated `data.js`, all class JSON files, and documentation. Refined the sidebar rendering logic in `core.js` to preserve brackets in labels and updated recording filename regex to support the new naming scheme for robustness. |
| May 01 | **Drafting Area Final Polish**: Implemented a professional **Theater Mode** with a dimming backdrop and blur effect. Standardized the platform's **z-index hierarchy** (Notepad: 2100, Backdrop: 2050, Nav: 2200) to eliminate transition flickering. Added intuitive exit paths including **Esc** key support and auto-exit on minimize. Integrated **Deepgram Nova-2** for pro-level, cross-browser voice transcription and refined all hover/active button states for a minimalist, premium look. |

---

## 🔑 Access

The platform is now open — no login required.
