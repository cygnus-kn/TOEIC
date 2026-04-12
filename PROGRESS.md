# TOEIC Homework Platform — Progress Tracker

> Last updated: 2026-04-13

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
- [x] Drag-to-resize handle (180px – 400px range) with smooth, instant resizing with transitions disabled
- [x] Sub-pixel boundary fixes utilizing 100dvh responsiveness constraints
- [x] Persistent width + collapsed state via `localStorage` (instantly applies on load without jumpy CSS animations)
- [x] Hierarchical navigation: Class → Homework / Lesson → Date entries
- [x] Expand/collapse per class group and category
- [x] Mobile hamburger menu with tap-outside-to-close

### 📄 Homework Viewer
- [x] Card-based layout with horizontal slide navigation
- [x] Swipe / trackpad scroll to navigate between parts
- [x] Pagination dots (clickable)
- [x] Glassmorphism date badge with dropdown to switch between homework dates
- [x] All timers reset when switching parts or homework dates

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
- [x] Custom play/pause button
- [x] Seekbar with live time display (`MM:SS / MM:SS`)
- [x] Audio paused automatically when navigating to another part

### 📚 Lesson Viewer
- [x] Vocabulary section with word, definition, and example
- [x] Sentence structure section with pattern + examples
- [x] Glassmorphism date badge with dropdown to switch between lesson dates

### 🌙 Theme
- [x] Light / Dark mode toggle
- [x] Respects `prefers-color-scheme` on first load
- [x] Theme persisted in `localStorage`

### 🔔 Notifications
- [x] Toast notification system (e.g., "This is not your class")
- [x] Auto-dismiss with fade-out animation

### ⚡ Optimization & Performance
- [x] **Lazy-Loaded Audio**: YouTube IFrame API now only loads when a task requiring audio is active.
- [x] **Modular Data Architecture**: Monolithic `data.js` split into a lightweight manifest + per-class JSON files.
- [x] **Demand-Driven Loading**: Assignment details are fetched via `fetch()` only when the student selects them.
- [x] **Script Consolidation**: Merged multiple JS files into a single `core.js` to reduce HTTP requests.

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
| Apr 13 | **Performance Sprint**: Consolidated separate JS files into `core.js`. Modularized the data system into JSON files for on-demand loading. Implemented lazy-loading for the YouTube API. Pushed major performance and cleanliness updates. |

---

## 🔑 Access

The platform is now open — no login required.
