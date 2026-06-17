---
name: BanyanBoard Design System — The Clear Desk
globs: ["*.css", "*.tsx", "*.ts", "*.html"]
paths: ["frontend/src/", "frontend/"]
topics: ["design", "frontend", "ui", "css", "components", "styling"]
priority: high
---

# BanyanBoard Design System

North star: **"The Clear Desk"** — sparse, intentional, disappears behind work.

## Hard rules (blocking violations)

### 1. No hardcoded colors ever
All colors must use CSS custom properties. Never write `#ffffff`, `#172b4d`, `rgba(9, 30, 66, 0.06)`, or any color literal in component CSS.

```css
/* WRONG */
background: #ffffff;
border: 1px solid #dfe1e6;
box-shadow: 0 0 0 2px #172b4d inset;

/* RIGHT */
background: var(--bg-card);
border: 1px solid var(--border);
box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9) inset;
```

### 2. Dark mode via `html[data-theme='dark']` only
Never use `@media (prefers-color-scheme: dark)`. The theme is JS-controlled with localStorage persistence. All dark overrides belong in `App.css`'s `html[data-theme='dark']` block or `index.css`'s equivalent block.

### 3. One Accent Rule — Signal Violet only
`--accent` is the sole accent color (`#aa3bff` light / `#c084fc` dark). No second accent. No `#0052cc` as an accent — that is the focus ring color (`--focus-ring`), used only for keyboard focus outlines.

Wrong fallback pattern: `var(--accent, #0052cc)` — `#0052cc` is Focus Blue, not Signal Violet.
Correct: `var(--accent)` — the variable is always defined.

### 4. Hover tints must use `--hover-tint`
```css
/* WRONG — light mode only, breaks dark */
background: rgba(9, 30, 66, 0.06);

/* RIGHT — has dark override rgba(255,255,255,0.06) */
background: var(--hover-tint);
```

### 5. Z-indexes must use named scale
```css
/* WRONG */
z-index: 1000;
z-index: 1100;

/* RIGHT */
z-index: var(--z-popover);    /* 200 — dropdowns, popovers */
z-index: var(--z-modal-backdrop); /* 300 — overlay behind modal */
z-index: var(--z-modal);      /* 400 — modal dialogs */
```

### 6. Modals must have a backdrop
Every modal/dialog must render a sibling `<div className="modal-backdrop" onClick={onClose} aria-hidden="true" />` before the panel element. The backdrop uses `z-index: var(--z-modal-backdrop)` and dims the screen.

### 7. Board header grid must not be broken
The `.board-header` uses `grid-template-columns: 1fr auto 1fr`. Rules:
- `h1.board-title` → `grid-column: 2` (center, always)
- `.theme-toggle` → `grid-column: 3; justify-self: end` (right, always)
- Any action button in the header (e.g. `.manage-labels-btn`) → `grid-column: 1; justify-self: start` (left)
- Error/notice elements in header → `grid-column: 1 / -1` (full width)

Never add a 4th direct child to `.board-header` without restructuring. New actions go into the left slot or a dedicated toolbar below the header.

## Token reference

### Colors (App.css `:root`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg-board` | `#f4f5f7` | `#13141a` | Page/board background |
| `--bg-column` | `#ebecf0` | `#1e1f2a` | Column background |
| `--bg-card` | `#ffffff` | `#2a2b38` | Card / popover / modal background |
| `--text-board` | `#172b4d` | `#e2e8f0` | Primary text, headings |
| `--text-column-label` | `#5e6c84` | `#8b99b3` | Secondary text, labels, timestamps |
| `--hover-tint` | `rgba(9,30,66,0.06)` | `rgba(255,255,255,0.06)` | Button/chip hover backgrounds |

### Colors (index.css `:root` — inherited)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `#aa3bff` | `#c084fc` | Signal Violet — primary action, active states |
| `--accent-bg` | `rgba(170,59,255,0.10)` | `rgba(192,132,252,0.15)` | Input focus glow |
| `--border` | `#e5e4e7` | `#2e303a` | All borders |
| `--focus-ring` | `#0052cc` | `#0052cc` | Keyboard focus outline only |
| `--sans` | `'DM Sans', system-ui, sans-serif` | same | All UI text |

### Shadows (App.css `:root`)
| Token | Use |
|---|---|
| `--shadow-card` | Resting card |
| `--shadow-card-hover` | Hovered card |
| `--shadow-card-drag` | Dragging card |
| `--shadow-popover` | Dropdowns, popovers |
| `--shadow-modal` | Modal dialogs |

All shadow tokens have dark mode overrides. Never write raw `box-shadow` values with `rgba(9, 30, 66, ...)` — those are light-mode only.

### Z-index scale (App.css `:root`)
| Token | Value | Use |
|---|---|---|
| `--z-popover` | 200 | Dropdowns, tooltips, popovers |
| `--z-modal-backdrop` | 300 | Overlay behind modal |
| `--z-modal` | 400 | Modal dialogs |

### Radii
| Token | Value | Use |
|---|---|---|
| `--radius-card` | `4px` | Cards, small buttons, inputs |
| `--radius-column` | `6px` | Columns |
| `--radius-modal` | `8px` | Modal dialogs |

## Tonal depth stack (Flat-by-Default)
Board (`--bg-board`) → Column (`--bg-column`) → Card (`--bg-card`). Each level is one step lighter in light mode, one step darker in dark mode. New UI surfaces must join this stack — never introduce a background outside it.

Elevation is conveyed by shadow only on interaction (hover, drag, focus), never at rest.

## Typography
- Font: `var(--sans)` = `'DM Sans', system-ui, sans-serif` everywhere
- Never introduce a second font family
- Board title: `1.75rem`, `font-weight: 600`, `letter-spacing: -0.5px`
- Column labels: `0.8125rem`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.06em`
- Card text: `0.875rem`, `line-height: 1.4`

## Component patterns

### Buttons (ghost style)
```css
background: transparent;
border: 1px solid var(--border);
border-radius: var(--radius-card);
color: var(--text-board);
font-family: var(--sans);
transition: background 120ms;

&:hover { background: var(--hover-tint); }
&:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
```

### Primary action button (Signal Violet)
```css
background: var(--accent);
color: #ffffff;
border: none;
transition: opacity 120ms;
&:hover { opacity: 0.88; }
```

### Inputs
```css
background: var(--bg-card);
border: 1px solid var(--border);
color: var(--text-board);
font-family: var(--sans);
&:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-bg); outline: none; }
```

### Popovers
```css
position: fixed;
z-index: var(--z-popover);
background: var(--bg-card);
border: 1px solid var(--border);
box-shadow: var(--shadow-popover);
```

### Modal dialogs
```css
position: fixed;
top: 50%; left: 50%;
transform: translate(-50%, -50%);
z-index: var(--z-modal);
background: var(--bg-card);
border: 1px solid var(--border);
border-radius: var(--radius-modal);
box-shadow: var(--shadow-modal);
```
Always paired with `.modal-backdrop` sibling (see Hard Rule 6).

## What NOT to do
- No `rgba(9, 30, 66, ...)` or `rgba(255, 255, 255, ...)` directly in component styles — these break the opposite mode
- No hardcoded `#172b4d`, `#dfe1e6`, `#ffffff`, `#ebecf0`
- No `z-index: 999`, `z-index: 1000`, `z-index: 9999`
- No `@media (prefers-color-scheme: dark)` — wrong theme mechanism
- No second accent color — Signal Violet is the only accent
- No additional fonts — DM Sans is the only typeface
- No shadows at rest on cards — `--shadow-card` only on hover/drag
- No nested cards (card inside card)
- No gradient text (`background-clip: text`)
- No side-stripe colored borders (`border-left: 3px solid accent`)
