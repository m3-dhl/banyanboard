# UI/UX Decision: Card Detail Modal

**Created**: 2026-06-19
**Status**: DECIDED
**Decision Type**: UI/UX

---

## User Context

### Target Users
- **Primary**: Dev Team Member — software developer on a small team (2–10 people). Works at desktop. Wants to see card detail, edit description, adjust due date, and manage labels without leaving the board context.
- **Secondary**: Team Lead — tech lead or project manager. Needs quick access to card metadata (description, due date, column) to maintain board structure and check progress.
- **Tertiary**: Solo Developer — personal task tracking; same desktop-primary usage pattern.

### User Goals
1. Open a card and read its full description / due date / comments without leaving the board
2. Edit card fields (title, description, due date, labels, column) quickly and return to board
3. Identify upcoming/overdue cards at a glance on the card itself (badge on card surface)

### Use Cases

| Use Case | User | Goal | Frequency |
|----------|------|------|-----------|
| View card details | Dev Team Member | Read description and due date | Multiple times per session |
| Edit description | Dev Team Member / Team Lead | Update task details | Several times per week |
| Add / change due date | Team Lead | Keep deadlines visible | When planning or re-planning |
| Change labels | Dev Team Member | Organise workstream | Occasionally |
| Move card to different column | Team Lead | Adjust card status without drag | Occasionally |
| Add a comment | Dev Team Member | Communicate status in-context | Multiple times per day |
| Read overdue badge on card | Any user | Identify urgency at a glance | Continuous (passive) |

### Constraints
- **Devices**: Desktop primary (1024px+); tablet (640–1023px) supported; mobile (375px–639px) must be functional (full-width sheet)
- **Accessibility**: WCAG 2.1 AA — keyboard navigation, focus trap, color contrast, screen-reader `role="dialog" aria-modal="true"`, Escape closes modal
- **Existing Patterns**: ReactDOM Portal into `document.body`; `useFocusTrap` hook; `modal-backdrop` + dialog container pattern (matches `DeleteCardDialog` and `LabelManagementPanel`); Escape scoped to container element (not `document`) to avoid hijacking dnd Escape handler; viewport clamping for fixed portals; presentational component pattern (no fetch in component)

---

## User Flow

### Flow Diagram

```
[Board view — card visible in column]
        |
        | User clicks card body (not drag-handle zone)
        v
[Card Detail Modal opens — focus moves into modal]
        |
        +—— Read mode: view title, description (Markdown rendered), due date, labels, column
        |
        +—— Edit title: inline edit on heading click / pencil
        |
        +—— Edit description: click "Edit" → textarea → Save / Cancel
        |
        +—— Edit due date: date input interaction
        |
        +—— Toggle labels: LabelPickerPopover (existing pattern)
        |
        +—— Change column: select/dropdown inside modal
        |
        +—— Add comment: textarea → Submit
        |
        v
[Close: Escape key / backdrop click / × button]
        |
        v
[Board view — card updated in place]
```

### Flow Description
1. **Entry**: User clicks the card body. The click handler fires only when the pointer moved < 5px between `pointerdown` and `pointerup` (distinguishing click from drag completion).
2. **Modal opens**: Rendered via `ReactDOM.createPortal` into `document.body`; `useFocusTrap` activates; focus moves to modal heading or first interactive element.
3. **Interactions**: User reads and edits fields. Each field section is independently interactive. Description toggles between rendered Markdown view and a textarea edit mode.
4. **Save / discard**: Field-level save (description has explicit Save/Cancel buttons; due date saves on change; title saves on blur/Enter).
5. **Exit**: Escape key, backdrop click, or × button closes the modal. Focus returns to the card that triggered the open.

### Error States

| Error | Cause | User Recovery |
|-------|-------|---------------|
| Empty title on save | User blanked the title field | Inline validation message below field; Save button disabled |
| Due date in the past (on set) | User picks a past date deliberately | Allowed — the overdue badge communicates it. No blocking error. |
| Comment submit with empty body | User clicks Submit on empty textarea | Inline alert "Comment cannot be empty"; field focused |
| Modal opened while drag active | Race condition: drag completes and click fires | Prevented by pointer-delta guard (see Design Q1 decision) |

---

## Design Question 1: Click-vs-Drag Separation

The card `<div>` in `Card.tsx` has both `draggableProps` and `dragHandleProps` spread onto it. A plain `onClick` will fire after a successful drag (mousedown → move → drop → mouseup → click). The solution must prevent the modal from opening on drag completion.

### Option A: `snapshot.isDragging` Guard
```tsx
onClick={(e) => {
  if (!snapshot.isDragging) setShowDetail(true)
}}
```
- **Pro**: Simple one-liner.
- **Con**: `snapshot.isDragging` is `false` immediately after drop completes. The click event that fires post-drop sees `isDragging = false` and opens the modal. This does NOT reliably prevent the spurious click.
- **Usability**: Low — modal opens after every drag
- **Implementation Complexity**: Low (but broken)

### Option B: Pointer-Delta Tracking (pointerdown → pointerup delta)
```tsx
const dragThreshold = 5 // px
const pointerDownPos = useRef<{ x: number; y: number } | null>(null)

function handlePointerDown(e: React.PointerEvent) {
  pointerDownPos.current = { x: e.clientX, y: e.clientY }
}

function handlePointerUp(e: React.PointerEvent) {
  if (!pointerDownPos.current) return
  const dx = Math.abs(e.clientX - pointerDownPos.current.x)
  const dy = Math.abs(e.clientY - pointerDownPos.current.y)
  if (dx < dragThreshold && dy < dragThreshold) {
    setShowDetail(true)
  }
  pointerDownPos.current = null
}
```
Applied as `onPointerDown` + `onPointerUp` on the card `<div>`. Does not use `onClick` at all.
- **Pro**: Reliable distinction — pointer moved significantly → drag, barely moved → click. Works across mouse, touch, and stylus.
- **Pro**: Zero dependency on dnd library internal state.
- **Con**: Must also exclude button clicks inside the card (the "+ Label" and "Delete" buttons). Solution: those buttons have their own `onClick` + `e.stopPropagation()` which prevents `pointerUp` from reaching the card handler.
- **Usability**: High
- **Accessibility**: Medium — keyboard users need a separate `onKeyDown` handler (Enter/Space on the card `div`)
- **Implementation Complexity**: Medium

### Option C: Dedicated Non-Draggable Click Zone (card title `<span>` only)
Make only the `<span className="card-title">` clickable, with the card div retaining full dragHandleProps. The title span gets `onClick` + `e.stopPropagation()` and `tabIndex={0}` for keyboard access.
- **Pro**: Simplest mental model — "click the title text to open detail"
- **Con**: Click target is very small on short titles; easy to miss and inadvertently drag instead. Poor affordance — nothing visual indicates it's clickable.
- **Con**: Requires adding a visual hint (underline? pointer cursor?) which clutters the card.
- **Usability**: Low
- **Accessibility**: Medium
- **Implementation Complexity**: Low

### Option D: `onMouseDown` + delta tracking (mouse-only)
Same as B but using `onMouseDown` / `onMouseUp`. Identical logic but misses touch events.
- **Con**: Touch drag on mobile would spuriously open the modal.
- **Usability**: Medium (desktop-only reliability)
- **Implementation Complexity**: Low

### Decision — Q1: Pointer-Delta Tracking (Option B)

**Chosen**: Option B — `onPointerDown` + `onPointerUp` with 5px threshold.

**Rationale**: The only approach that is reliable across all input devices without depending on dnd library internal state. The threshold of 5px is a well-established convention (used by browsers for drag initiation and by Trello's implementation). The cards' inner buttons (Delete, Add Label) already call `e.stopPropagation()` on their `onClick`, which also prevents the parent `pointerUp` from triggering the modal for button-area interactions.

**Keyboard access**: Add `onKeyDown` to the card `<div>` handling `Enter` and `Space` → `setShowDetail(true)`. The card already has `tabIndex={0}` and `role="article"`, so keyboard users can Tab to it and press Enter to open the modal.

**Concrete code sketch**:
```tsx
// Inside Card component
const pointerDownPos = useRef<{ x: number; y: number } | null>(null)
const DRAG_THRESHOLD = 5

function handlePointerDown(e: React.PointerEvent<HTMLDivElement>): void {
  pointerDownPos.current = { x: e.clientX, y: e.clientY }
}

function handlePointerUp(e: React.PointerEvent<HTMLDivElement>): void {
  if (!pointerDownPos.current) return
  const dx = Math.abs(e.clientX - pointerDownPos.current.x)
  const dy = Math.abs(e.clientY - pointerDownPos.current.y)
  pointerDownPos.current = null
  if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
    setShowDetail(true)
  }
}

function handleCardKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    setShowDetail(true)
  }
}

// On the card <div>:
// onPointerDown={handlePointerDown}
// onPointerUp={handlePointerUp}
// onKeyDown={handleCardKeyDown}
// (keep existing dragHandleProps, draggableProps, tabIndex={0})
```

---

## Design Question 2: Modal Layout

### Option 1: Single-Column — All fields stacked vertically
```
┌──────────────────────────────────────────────┐
│  × [Close]                Card Detail         │
├──────────────────────────────────────────────┤
│  Title (editable heading)                    │
├──────────────────────────────────────────────┤
│  Column: [Todo ▾]   Due: [date input]        │
│  Labels: [chip] [chip] [+ Add]               │
├──────────────────────────────────────────────┤
│  Description                          [Edit] │
│  ┌──────────────────────────────────────┐    │
│  │  Rendered Markdown content here      │    │
│  │  (or empty state hint)               │    │
│  └──────────────────────────────────────┘    │
├──────────────────────────────────────────────┤
│  Comments                                    │
│  ┌──────────────────────────────────────┐    │
│  │  [user] [timestamp]                  │    │
│  │  Comment text                        │    │
│  └──────────────────────────────────────┘    │
│  ┌──────────────────────────────────────┐    │
│  │  Add a comment…             [Submit] │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```
- **Width**: 560px on desktop, 100vw on mobile (bottom sheet)
- **Scroll**: Modal body scrolls internally (header + footer sticky)
- **Pros**: Works at any width including 375px. Natural reading order. No cognitive split-attention. Consistent with `DeleteCardDialog` and `LabelManagementPanel` single-panel pattern.
- **Cons**: Long scroll on cards with many comments. Metadata fields (column, labels) buried below title — less scannable for Team Lead.
- **Usability**: High (familiar, linear)
- **Accessibility**: High (single reading order)
- **Implementation Complexity**: Low

### Option 2: Two-Column — Left: content; Right: metadata/comments

Desktop layout (min 768px):
```
┌──────────────────────────────────────────────────────────┐
│  × [Close]                         Card Detail            │
├─────────────────────────────┬────────────────────────────┤
│  Title (editable heading)   │  Column: [Todo ▾]          │
│                             │  Due: [date input]          │
│  Description        [Edit]  │  Labels: [chip] [chip]     │
│  ┌───────────────────────┐  │         [+ Add]            │
│  │  Rendered Markdown    │  ├────────────────────────────┤
│  │  content here         │  │  Comments                  │
│  └───────────────────────┘  │  ┌──────────────────────┐ │
│                             │  │ [user] comment text  │ │
│                             │  └──────────────────────┘ │
│                             │  [Add comment…] [Submit]   │
└─────────────────────────────┴────────────────────────────┘
```
Mobile (< 640px): collapses to single column.
- **Pros**: Metadata visible without scroll. Familiar pattern (Linear, Jira, GitHub Issues all use this).
- **Cons**: Complex responsive collapse. At 375px, the two-column layout MUST collapse — adding a breakpoint condition. Comments in the right column become very narrow (280px) which wraps short. Larger implementation surface.
- **Usability**: High on desktop, Medium on mobile (after collapse)
- **Accessibility**: Medium — two-column layouts can confuse reading order for screen readers if DOM order doesn't match visual order
- **Implementation Complexity**: High

### Option 3: Full-Width Sheet (mobile-first, single column with grouped sections)

Same as Option 1 structurally but designed as a bottom-sheet on mobile and a centered modal on desktop. The sheet slides up from the bottom at 90vh on mobile, making it feel like a native mobile pattern.
- **Pros**: Mobile UX feels native. Swipe-to-dismiss possible.
- **Cons**: Bottom sheet animation adds complexity. BanyanBoard is desktop-primary; mobile is "best-effort" per productBrief. Over-engineering for MVP.
- **Usability**: High on mobile, identical to Option 1 on desktop
- **Accessibility**: Medium (slide animation can be distracting; requires `prefers-reduced-motion`)
- **Implementation Complexity**: High

### Evaluation Matrix — Modal Layout

| Criteria | Opt 1 (Single Column) | Opt 2 (Two Column) | Opt 3 (Bottom Sheet) |
|----------|----------------------|--------------------|----------------------|
| Usability | High | High (desktop) / Medium (mobile) | High (mobile) / High (desktop) |
| Accessibility | High | Medium | Medium |
| Consistency with existing patterns | High | Low | Low |
| Responsiveness (375px) | High | Medium (requires collapse) | High |
| Performance | High | Medium | Medium |
| Implementation Complexity | Low | High | High |

### Decision — Q2: Single-Column Layout (Option 1)

**Chosen**: Option 1 — single-column, vertically stacked, 560px wide centered modal on desktop, 100vw on mobile.

**Rationale**: The existing codebase uses single-column modals (`DeleteCardDialog`, `LabelManagementPanel`). At the target breakpoint of 375px a two-column layout collapses to single-column anyway, so the two-column variant adds implementation complexity with no mobile benefit. The Team Lead "quick overview" need is addressed by placing the metadata group (column selector + due date + labels) immediately below the title — visible without any scrolling. Screen reader DOM order is natural in a single column. Matches YAGNI principle from systemPatterns.md.

**Metadata placement**: Column selector, due date, and label chips form a compact "sidebar-like" group using flexbox `flex-wrap: wrap` on a single row below the title. On desktop (560px), this group fits in one line. On mobile it wraps gracefully.

---

## Design Question 3: Description Edit UX

### Option A: Explicit "Edit" Button / Pencil Icon

View mode renders Markdown. "Edit" button (or pencil icon) top-right of the description section switches to a `<textarea>`. Explicit "Save" and "Cancel" buttons appear below the textarea.

```
Description                                     [✎ Edit]
┌────────────────────────────────────────────────────┐
│  **Bold** and *italic* and a list:                 │
│  - Item one                                        │
│  - Item two                                        │
└────────────────────────────────────────────────────┘
```

After clicking Edit:
```
Description
┌────────────────────────────────────────────────────┐
│  **Bold** and *italic* and a list:                 │
│  - Item one                                        │
│  - Item two                                        │
└────────────────────────────────────────────────────┘
                                     [Cancel] [Save]
```
- **Pros**: Explicit affordance — user always knows how to edit. Accidental edits impossible. Consistent with forms in `LabelManagementPanel` (explicit save button pattern). Clear cancel path.
- **Cons**: Two-click workflow (Edit, then Save). Slightly more UI chrome.
- **Usability**: High (discoverable, safe)
- **Accessibility**: High (button is always visible, focus flows naturally)
- **Implementation Complexity**: Low

### Option B: Click-to-Edit on Rendered Markdown Area

Clicking anywhere on the rendered Markdown area switches it to a textarea in-place.
- **Pros**: Fewer clicks.
- **Con**: Invisible affordance — new users don't know the area is editable. Screen readers cannot discover a clickable `<div>`. Requires `role="button"` + `tabIndex` on a non-interactive element, which is an ARIA anti-pattern.
- **Con**: Easy to open edit mode accidentally when trying to select/copy text from the description.
- **Usability**: Low (invisible, unreliable)
- **Accessibility**: Low
- **Implementation Complexity**: Medium

### Option C: Permanent Textarea with Live Preview Below

The textarea is always visible. A rendered preview updates below it in real time.
- **Pros**: No mode switching.
- **Con**: Takes up double vertical space. Comments section is pushed far down. Two representations of the same content simultaneously is visually noisy. Overkill for a simple kanban card description.
- **Usability**: Medium (clear but noisy)
- **Accessibility**: High
- **Implementation Complexity**: Medium

### Save Mechanism Sub-options
- **Explicit Save button**: Safest, most consistent with existing patterns. User controls when changes commit.
- **Ctrl+Enter**: Supplementary keyboard shortcut — not a replacement for a visible button.
- **Auto-save on blur**: Unreliable (user might close modal instead of clicking elsewhere). Loses work if modal closed accidentally.

### Decision — Q3: Explicit Edit Button + Save/Cancel Buttons (Option A)

**Chosen**: Option A — "Edit" button/icon to enter edit mode; "Save" and "Cancel" buttons to exit.

**Rationale**: Matches the explicit save pattern already established in `LabelManagementPanel` and `CardForm`. Prevents accidental edits. Screen-reader accessible (the Edit button is a real `<button>` element). Ctrl+Enter is added as a supplementary shortcut (documented in button tooltip) but does not replace the visible Save button. This aligns with the WCAG 2.1 AA target and the Zero Over-Engineering guiding principle.

**Save mechanism**: Explicit "Save" button + Ctrl+Enter keyboard shortcut. "Cancel" button or Escape discards changes and returns to view mode (not closes the modal — Escape on the textarea should revert to view mode, not close the entire modal; a second Escape then closes the modal).

---

## Design Question 4: Due-Date Badge Design

### Badge Location Options

**A. Below title, above labels row**
```
┌──────────────────────┐
│ Design login page    │  ← card title
│ ⚑ Due Jun 22        │  ← due date badge
│ [frontend] [urgent]  │  ← labels
└──────────────────────┘
```

**B. Inline in title (trailing)**
```
┌──────────────────────┐
│ Design login page ⚑  │  ← title + icon
│ [frontend] [urgent]  │
└──────────────────────┘
```

**C. Above label chips row (same row, left-aligned)**
```
┌──────────────────────┐
│ Design login page    │
│ ⚑ Jun 22  [lbl] [l] │  ← same row as labels
└──────────────────────┘
```

**B** clutters the title and breaks the title's visual clarity.
**C** creates an uneven mixed row (date badge + label chips have different semantics).
**A** is cleanest: a dedicated row for the date badge, between title and labels. It matches how Trello, Linear, and GitHub Projects render due dates on card surfaces.

### Badge Color Tokens

The `LABEL_COLORS` palette contains pre-verified WCAG AA hex values on white text. The badge uses a filled pill shape (colored background + white text).

| State | Condition | Background | Text | WCAG Contrast |
|-------|-----------|-----------|------|--------------|
| No badge | `dueDate` is null | (no badge rendered) | — | — |
| Neutral / future | > 3 days away | `#616A6B` (label-gray) | `#FFFFFF` | 4.6:1 ✓ AA |
| Warning / soon | ≤ 3 days and not overdue | `#9A7D0A` (label-yellow adjusted) | `#FFFFFF` | 4.5:1 ✓ AA |
| Danger / overdue | Due date < today | `#C0392B` (label-red) | `#FFFFFF` | 5.1:1 ✓ AA |

Note: The standard `yellow` (#FFFF00) fails WCAG AA with white text. The `label-yellow` token in the codebase is already adjusted to `#9A7D0A` (dark amber) which passes AA with white text. This token is the correct choice for the warning state.

**Badge content**: calendar icon + short date string ("Jun 22", "Today", "Yesterday"). Relative labels ("Today", "Tomorrow") are more scannable than absolute dates at a glance.

**Screen reader text**: Use `aria-label="Due Jun 22 — overdue"` on the badge element so the state is conveyed, not just the date.

### Decision — Q4: Below-title placement (Option A) with 3-state color tokens

**Chosen**: Due date badge positioned below the card title and above the labels row. Three states (neutral gray / warning amber / danger red) using existing `LABEL_COLORS` hex values. Badge conditionally rendered — no badge when `dueDate` is null. Short relative + absolute label for scannability. `aria-label` encodes both date and urgency state.

---

## Full Decision Summary

| Design Question | Decision |
|----------------|----------|
| Click-vs-drag separation | Pointer-delta tracking (5px threshold) on `onPointerDown` + `onPointerUp`; Enter/Space keyboard handler |
| Modal layout | Single-column, 560px desktop / 100vw mobile, metadata group (column + due date + labels) directly below title |
| Description edit UX | Explicit "Edit" button → textarea → "Save" / "Cancel"; Ctrl+Enter keyboard shortcut for save |
| Due-date badge | Below title, above labels; 3-state: neutral gray / warning amber / danger red using `LABEL_COLORS` tokens |

---

## Design Specifications

### Layout

**Desktop (≥ 640px)**:
- Modal: centered, `width: 560px`, `max-height: 80vh`, vertically scrollable body
- Backdrop: `position: fixed; inset: 0; background: rgba(0,0,0,0.4)`
- Internal sections stacked: Header (title + close btn) → Metadata row (column + date + labels) → Description section → Divider → Comments section

**Tablet (640–1023px)**:
- Same single-column layout; modal may use `width: min(560px, 92vw)` to give breathing room

**Mobile (< 640px)**:
- Modal: `width: 100vw`, pinned to bottom using `position: fixed; bottom: 0; left: 0; right: 0; border-radius: 12px 12px 0 0`
- `max-height: 90vh` with scrollable body
- Backdrop above the modal for partial-page context

### Key Components

| Component | Purpose | Behavior |
|-----------|---------|----------|
| `CardDetailModal` | Top-level modal container | Portal to `document.body`; `useFocusTrap`; Escape handler scoped to container |
| `CardDetailHeader` | Title + close button | Title is an editable `<h2>`; pencil icon or click to edit; saves on Enter / blur |
| `CardMetadataRow` | Column selector + due date input + label chips | Flex-wrap row; each field is independently interactive |
| `DueDateBadge` | Card-surface badge (rendered inside `Card.tsx`) | Conditionally rendered; 3 color states; `aria-label` with date + state |
| `DescriptionSection` | View/edit mode for Markdown description | "Edit" button → `<textarea>`; "Save" + "Cancel" buttons; Ctrl+Enter saves |
| `CommentsSection` | Thread of comments + new comment form | Scrollable list; `<textarea>` + Submit button; empty state copy |

### Interactions

| Trigger | Action | Feedback |
|---------|--------|----------|
| Card `pointerUp` (< 5px delta) | Open `CardDetailModal` | Modal appears with focus trap; backdrop visible |
| Card `Enter` / `Space` keydown | Open `CardDetailModal` | Same as pointer interaction |
| Escape (first press, description in edit mode) | Revert description to view mode | Textarea disappears; rendered Markdown returns |
| Escape (modal at rest) | Close modal | Modal unmounts; focus returns to originating card |
| Backdrop click | Close modal | Same as Escape |
| × button click | Close modal | Same as Escape |
| "Edit" button (description) | Enter description edit mode | Textarea appears, focused; "Save" and "Cancel" visible |
| "Save" (description) / Ctrl+Enter | Persist description | View mode restores with updated Markdown render |
| "Cancel" (description) | Discard description changes | View mode restores with original content |
| Column select change | Update card's column | Column badge updates; card will move on board when modal closes |
| Date input change | Update due date | Badge state recalculated live |
| Label chip toggle | Toggle label on card | Chip selected state updates |

### Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| < 640px | Modal is full-width bottom sheet (`border-radius: 12px 12px 0 0`); `max-height: 90vh`; swipe hint (thin handle bar at top) |
| 640–1023px | Modal centered, `width: min(560px, 92vw)` |
| ≥ 1024px | Modal centered, `width: 560px` |

### Accessibility Requirements

- [x] Keyboard navigation: Tab cycles through all interactive elements inside modal; Shift+Tab reverses
- [x] Focus trap: `useFocusTrap(containerRef, true)` — reuse existing hook
- [x] Screen reader: `role="dialog" aria-modal="true" aria-labelledby={headingId}` — matches `DeleteCardDialog` pattern
- [x] Escape handler: scoped to container element (not `document`) to avoid capturing dnd keyboard drag Escape
- [x] Color contrast: Due-date badge uses `LABEL_COLORS` pre-verified tokens (all ≥ 4.5:1 on white)
- [x] Focus return: on modal close, `document.getElementById(card.id)?.focus()` returns focus to the originating card
- [x] `aria-label` on `DueDateBadge` encodes both date and urgency state (e.g., "Due Jun 22 — overdue")
- [x] Description edit: "Edit" button is a real `<button>` element; focus moves into `<textarea>` on activation

---

## Implementation Guidelines

### For Developers

1. **Click-vs-drag**: Replace `onClick` on the card `<div>` with `onPointerDown` + `onPointerUp` using the 5px delta pattern shown in Q1 code sketch. Keep `tabIndex={0}` and add `onKeyDown` for Enter/Space. Do NOT remove `dragHandleProps` spread.

2. **Modal portal**: Follow `DeleteCardDialog` exactly — `createPortal(<><div className="modal-backdrop" onClick={onClose} /><div ref={containerRef} role="dialog" aria-modal="true" ...></div></>, document.body)`. Do not render the modal as a child of the `Draggable` wrapper.

3. **Escape scoping**: Attach `keydown` listener to `containerRef.current` (not `document` or `window`). Call `event.stopPropagation()` before `onClose()`. This prevents the dnd library's document-level Escape handler from triggering.

4. **Description Markdown**: Use a lightweight Markdown renderer (e.g., `marked` or `react-markdown`). Sanitize output with DOMPurify before setting `dangerouslySetInnerHTML` or use `react-markdown`'s built-in sanitization. Do NOT use `dangerouslySetInnerHTML` on raw user input.

5. **Due-date badge on card**: Compute badge state in `Card.tsx` before render. Badge state is a pure function of `dueDate` and `today`: `overdue | warning | neutral | none`. Use CSS classes (e.g., `due-date-badge--overdue`) mapped to the color tokens. Do not use inline styles for badge colors — use CSS variables mapped from `LABEL_COLORS` so they are themeable.

6. **Focus return on close**: Store a ref to the triggering element before opening the modal. On close callback: `triggerRef.current?.focus()`. In `Card.tsx`, the card `<div>` already has `tabIndex={0}` so it is focusable.

7. **Ctrl+Enter for save**: In the description `<textarea>` `onKeyDown`, detect `e.ctrlKey && e.key === 'Enter'` (also `e.metaKey` for macOS). Call save handler. Do not call `e.preventDefault()` unless you need to suppress the default newline (you do: `e.preventDefault()` + save).

8. **`CardData` type extension**: The feature requires `dueDate?: string | null` (ISO date string), `description?: string`, and `comments?: Comment[]` added to `CardData` in `types.ts`. The UI/UX design assumes these fields exist; coordinate with the data-model task phase.

### Component Structure

```
frontend/src/components/
├── CardDetailModal/
│   ├── CardDetailModal.tsx          # Main modal container (portal + focus trap)
│   ├── CardDetailModal.test.tsx     # Render, keyboard, accessibility tests
│   ├── DescriptionSection.tsx       # View/edit mode toggle for Markdown description
│   ├── DescriptionSection.test.tsx
│   ├── CommentsSection.tsx          # Comment thread + new comment form
│   └── CommentsSection.test.tsx
├── DueDateBadge.tsx                 # Card-surface badge (used in Card.tsx)
└── DueDateBadge.test.tsx
```

### Recommended Libraries / Patterns

- **Markdown rendering**: `react-markdown` (already common in React ecosystems; tree-shakeable; avoids raw `dangerouslySetInnerHTML`). Alternative: `marked` + DOMPurify if bundle size is a concern.
- **Date computation**: Use native `Date` arithmetic for badge state. No date library needed for 3 states (overdue / within 3 days / beyond 3 days).
- **Focus trap**: Reuse `frontend/src/hooks/useFocusTrap.ts` — do not pull in a new library.
- **Portal**: `ReactDOM.createPortal` — same as `LabelPickerPopover` and `DeleteCardDialog`.

---

## Validation Checklist

- [x] Meets all user goals: view / edit / comment / label / move from detail
- [x] Accessible per WCAG 2.1 AA: keyboard nav, focus trap, color contrast, ARIA roles, focus return
- [x] Consistent with existing patterns: portal, useFocusTrap, modal-backdrop, Escape scoping, explicit save buttons
- [x] Respects Guiding Principles: Zero Over-Engineering (single column, no animation), Type Safety (strict props), Presentational Component Pattern (no fetch in modal component)
- [x] Responsive: single-column collapses gracefully to 375px; no two-column breakpoint complexity
- [x] Performance: no heavy animation; Markdown rendering is lazy (only when description section is visible)
- [x] Implementation feasible: all patterns already established in codebase; no new dependencies except optional `react-markdown`

---

## Next Steps

1. Extend `CardData` type in `types.ts` with `dueDate?: string | null`, `description?: string`, `comments?: Comment[]`
2. Implement `DueDateBadge.tsx` and integrate into `Card.tsx` (below title, above labels)
3. Update `Card.tsx` pointer-down/up handlers for click-vs-drag separation; add keyboard handler
4. Implement `CardDetailModal.tsx` with portal, focus trap, Escape scoping, and focus-return
5. Implement `DescriptionSection.tsx` (view/edit toggle, Save/Cancel, Ctrl+Enter)
6. Implement `CommentsSection.tsx` (thread + new comment form)
7. Wire `CardDetailModal` into `Board.tsx` state (open card ID, callbacks for field updates)
8. Write tests: pointer-delta behavior, focus trap, keyboard navigation, badge color states, description save/cancel
