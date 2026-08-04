# TeachKit Board Clone: Architecture & Implementation Guide

This guide provides a blueprint for recreating the TeachKit Board (https://teachkit.dqnotes.com/tools/board) using modern web technologies. 

> [!NOTE]
> The original site relies heavily on the TanStack ecosystem. This guide replicates that bleeding-edge tech stack for a highly performant and modern developer experience.

## 1. Core Tech Stack
- **Framework:** TanStack Start (Full-stack React framework)
- **Routing:** TanStack Router (Type-safe routing)
- **State/Fetching:** TanStack Query (React Query)
- **Styling:** Tailwind CSS (Utility-first styling)
- **Components:** Radix UI Primitives (Accessible, unstyled components)
- **Icons:** Lucide React
- **Canvas/Whiteboard:** You can build a custom HTML5 `<canvas>` / SVG solution using `zustand` for state, or use a headless library like TLDraw.

## 2. Project Initialization

Bootstrap a new TanStack Start project:
```bash
npx create-tsrouter-app@latest my-board-app
```
*(Select TanStack Start, React, TypeScript, and Vite when prompted).*

Next, install the required UI dependencies:
```bash
npm install tailwindcss postcss autoprefixer
npm install lucide-react clsx tailwind-merge
npm install @radix-ui/react-tooltip @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install zustand
```

Configure Tailwind CSS according to their [official guide](https://tailwindcss.com/docs/installation).

## 3. UI/UX & Theming (CSS Variables)

TeachKit uses a sophisticated CSS variable system for theming (light/dark modes) and specific board colors. Add this to your main CSS file (e.g., `index.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-base: #ffffff;
    --surface: rgba(248, 250, 252, 0.9);
    --surface-strong: #f1f5f9;
    --line: #e2e8f0;
    
    /* Text Colors */
    --sea-ink: #0f172a;
    --sea-ink-soft: #475569;
    
    /* Brand Colors */
    --lagoon-deep: #0369a1;

    /* Board Ink Colors */
    --board-ink: #1e293b;
    --board-red: #ef4444;
    --board-blue: #3b82f6;
    --board-green: #22c55e;
    --board-yellow: #eab308;
    --board-purple: #a855f7;
  }

  .dark {
    --bg-base: #0f172a;
    --surface: rgba(30, 41, 59, 0.9);
    --surface-strong: #334155;
    --line: #334155;
    
    --sea-ink: #f8fafc;
    --sea-ink-soft: #cbd5e1;
    --lagoon-deep: #38bdf8;
  }
}
```

## 4. Application Layout & Component Structure

The board consists of four primary UI overlays sitting on top of an infinite canvas layer.

### A. The Infinite Canvas Layer
```tsx
<div className="fixed inset-0 overflow-hidden bg-[var(--bg-base)]">
  {/* Dot Grid Background */}
  <div 
    className="pointer-events-none absolute inset-0 opacity-100" 
    style={{
      backgroundImage: "radial-gradient(circle, var(--line) 1.2px, transparent 1.2px)",
      backgroundSize: "64px 64px"
    }}
  />
  {/* Canvas / SVG Elements go here */}
</div>
```

### B. Top Left: Navigation & Meta
A floating pill showing the back button and document name.
- **Classes:** `absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 shadow-sm backdrop-blur`

### C. Top Right: Document Actions
Actions like User roster, Saved boards, Export PNG/PDF, Clear, Fullscreen.
- **Classes:** `absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 shadow-sm backdrop-blur`

### D. Bottom Center: The Main Tool Palette
The core drawing tools (Select, Hand, Pen, Highlighter, Eraser, Text, Sticky Note, Shapes, Color Picker, Undo/Redo, Zoom to Fit).
- **Classes:** `pointer-events-auto relative w-max flex items-center gap-0.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-1.5 py-1 shadow-lg backdrop-blur`
- **Active Tool Styling:** When a tool is active, give it a background of `bg-[var(--lagoon-deep)]/15` and text color `text-[var(--lagoon-deep)]`.

### E. Bottom Left: Zoom Controls
- **Classes:** `absolute bottom-3 left-3 z-10 flex flex-col gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 shadow-sm backdrop-blur`

## 5. State Management (Zustand)

You will need a robust state manager to handle the whiteboard state (objects, camera position, selected tools).

```typescript
import { create } from 'zustand';

type Tool = 'select' | 'hand' | 'pen' | 'highlighter' | 'eraser' | 'text' | 'sticky' | 'arrow' | 'frame' | 'square';

interface BoardState {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  
  zoom: number;
  setZoom: (zoom: number) => void;
  
  camera: { x: number, y: number };
  setCamera: (pos: { x: number, y: number }) => void;
  
  // Elements array would store all drawings, text, and sticky notes
  elements: any[]; 
}

export const useBoardStore = create<BoardState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  zoom: 100,
  setZoom: (zoom) => set({ zoom }),
  camera: { x: 0, y: 0 },
  setCamera: (camera) => set({ camera }),
  elements: [],
}));
```

## 6. Implementation Milestones

1. **Phase 1: Shell & Styling:** Set up the TanStack app, configure Tailwind CSS variables, and build the floating UI components (Top Left, Top Right, Bottom Center toolbars).
2. **Phase 2: The Canvas Engine:** Integrate a whiteboard engine. You can build a custom SVG-based engine (capturing pointer events for drawing paths) or drop in a headless component like [Tldraw](https://tldraw.dev/) and customize its UI to match TeachKit's aesthetic.
3. **Phase 3: Tool Logic:** Wire up the UI to control the canvas engine (e.g., clicking the Pen icon sets the canvas mode to drawing).
4. **Phase 4: Save & Export:** Implement the PDF/PNG export logic and localStorage/backend saving for boards.

> [!TIP]
> If building the whiteboard from scratch is too time-consuming, the **tldraw** library (`@tldraw/tldraw`) is highly recommended. You can hide its default UI and wire your custom TeachKit-styled UI components to its API.
