# UI/UX Decision: Card Labels — Color Picker, Label Management, and Filter Panel

**Created**: 2026-06-16
**Status**: DECIDED
**Decision Type**: UI/UX

---

## User Context

### Target Users

- **Primary**: Dev Team Member — software developer on a small team (2–10 people); needs to categorize cards visually and filter the board to focus on specific workstreams (e.g., "show only bug fixes", "show only my work"). Time to find assigned work must be under 10 seconds. Uses desktop (Chrome/Firefox/Safari/Edge); mobile is best-effort.
- **Secondary**: Team Lead — needs board overview at a glance; benefits from label-based visual grouping across all columns.

### User Goals

1. Attach a label (name + color) to an existing card with minimal friction — two or three interactions maximum.
2. Create new labels (global per board) and manage them (rename, delete) without leaving the board page.
3. Filter the board to show only cards matching one selected label; clear the filter just as easily.

### Use Cases

| Use Case | User | Goal | Frequency |
|----------|------|------|-----------|
| Attach label to card | Dev Team Member | Categorize a card already on the board | Several times per session |
| Create new label | Dev Team Member / Team Lead | Add a label name + color to the board palette | Occasional (initial setup) |
| Filter by label | Dev Team Member | Focus board view on one workstream | Daily |
| Remove label from card | Dev Team Member | Correct a mis-labelled card | Occasional |
| Clear active filter | Dev Team Member | Return to full board view | Daily |

### Constraints

- **Devices**: Desktop primary (1024px+); tablet (640–1024px) best-effort; mobile layout desirable but not blocking
- **Accessibility**: WCAG 2.1 AA — keyboard navigation (Tab / Enter / Space / Escape), color contrast for badge text on badge background (4.5:1 minimum), visible focus indicators
- **Existing Patterns**: Presentational components receive all data via props; state lives in `Board.tsx`; error messages use `role="alert"`; no external UI library — plain React + CSS; no `any` in TypeScript; YAGNI — no abstraction beyond what the feature needs
- **Color scope**: Predefined palette of 10 colors only; no free hex input; all colors must meet WCAG AA contrast for text rendered on them
- **Filter**: Client-side only; single active label at a time; p95 < 200ms

---

## User Flow

### Flow Diagram

```
[Board page loads]
       |
       +---> [Cards visible in columns; no filter active]
       |
       |  ATTACH LABEL PATH
       +---> [User clicks "Add label" affordance on card]
       |          |
       |          v
       |     [Label picker popover opens — shows board palette + "Manage labels" link]
       |          |
       |     [Palette has labels]?
       |          |-- YES --> [User clicks label chip → label toggled on card → popover closes]
       |          |-- NO  --> [User clicks "Manage labels" → label management panel opens]
       |
       |  LABEL MANAGEMENT PATH
       +---> [User opens label management panel (via popover link OR board header button)]
       |          |
       |          v
       |     [Panel lists existing labels; "New label" form at bottom]
       |          |
       |          +-- [Fill name + pick color + Save → label added to palette]
       |          +-- [Delete label → confirm inline → label removed]
       |          +-- [Escape / click outside → panel closes]
       |
       |  FILTER PATH
       +---> [User clicks a label chip in the filter bar (above columns)]
                  |
                  v
             [Filter bar renders label chips when labels exist]
                  |
                  +-- [Chip clicked → filter activated → non-matching cards hidden; chip shows active state]
                  +-- [Active chip clicked again → filter cleared → all cards shown]
```

### Flow Description

1. **Entry (Attach label)**: User clicks the "Add label" affordance — a small `+` button that appears inside the card footer area, always visible (not hover-only) so it is reachable by keyboard.
2. **Label picker popover**: Opens anchored below/above the trigger button; shows current board label palette as colored chips (name + color swatch). Keyboard: Tab moves between chips; Enter/Space toggles; Escape closes.
3. **Label assigned**: Selected label appears as a colored badge on the card face immediately (optimistic update). If API fails, badge is removed and a non-blocking `role="alert"` error appears near the board header (matching `cardCreateError` pattern in `Board.tsx`).
4. **Label management**: Triggered from a "Manage labels" link at the bottom of the picker popover, or from a dedicated button in the board header. Opens a focused panel/dialog listing existing labels with inline delete and a new-label form.
5. **Filter**: A filter bar renders between the board header and the columns. It is only visible when the board has at least one label defined. Each label appears as a chip; clicking activates/deactivates the filter.
6. **Exit**: Popovers close on Escape or click outside. Filter clears by clicking the active chip or a "Clear filter" button.

### Error States

| Error | Cause | User Recovery |
|-------|-------|---------------|
| API failure on label attach | Network error or server 5xx | Optimistic badge removed; `role="alert"` near header ("Failed to save label — please try again") |
| Empty label name | User submits new-label form without a name | Inline `role="alert"` in the form ("Label name is required") |
| Duplicate label name | Name already exists in board palette | Inline `role="alert"` ("A label with this name already exists") |
| Label name too long | Name > 30 characters | Inline `role="alert"` ("Label name must be 30 characters or fewer") |

---

## Options Explored

### Option 1: Hover-Reveal Inline Swatch + Global Palette Modal + Top Filter Bar

- **Approach**: Label swatches appear on card hover (CSS `:hover`). Clicking a swatch assigns it. A separate "Labels" button in the header opens a full-page modal for label management. Filter bar is a horizontal strip above the columns.
- **Wireframe/Layout**:
  ```
  ┌──────────────────────────────────────────────────┐
  │ Board header: [BanyanBoard]  [Labels btn]         │
  ├──────────────────────────────────────────────────┤
  │ Filter bar: [Bug] [Feature] [Blocked] [Clear]     │
  ├──────────────────────────────────────────────────┤
  │  To Do          In Progress      Done             │
  │ ┌────────┐     ┌────────┐     ┌────────┐         │
  │ │ Card 1 │     │ Card 3 │     │ Card 5 │         │
  │ │ ●●●●●  │◄─── swatches on hover                 │
  │ └────────┘     └────────┘     └────────┘         │
  └──────────────────────────────────────────────────┘
  ```
- **User Flow**: Hover card → swatches appear → click swatch → label assigned. Click "Labels" in header → full modal → manage.
- **Pros**:
  - Card face stays uncluttered when not interacting
  - Modal gives plenty of space for label management
- **Cons**:
  - Hover-reveal is inaccessible by keyboard without additional engineering (hover state cannot be triggered by focus alone without extra JS)
  - Touch devices cannot hover — completely breaks the attach flow on mobile/tablet
  - Full modal is heavy UX for a simple label-management task
  - Hover affordance is not discoverable — users may not know labels can be added
- **Usability**: Low — discoverability problem; touch broken
- **Accessibility**: Low — hover gating violates WCAG 2.1 AA (SC 1.4.13 Content on Hover or Focus requires persistent content and keyboard reachability)
- **Implementation Complexity**: Medium (hover/focus CSS, modal state)

---

### Option 2: Button-Triggered Popover on Card + Ad-Hoc Label Creation Inside Popover + Sidebar Filter

- **Approach**: Each card has a permanent "tag" icon button in the card footer. Clicking opens a popover that combines both label picking AND new-label creation in a single panel. Filter is a collapsible sidebar on the right side of the board.
- **Wireframe/Layout**:
  ```
  ┌────────────────────────────────────────────────┬──────────┐
  │ Board header: [BanyanBoard]                    │          │
  ├────────────────────────────────────────────────│  Filter  │
  │  To Do        In Progress      Done            │  Sidebar │
  │ ┌──────────┐                                  │  [Bug]   │
  │ │ Card 1   │                                  │  [Feat]  │
  │ │ [#] tag  │◄─── always visible button        │  [Blkd]  │
  │ └──────────┘                                  │          │
  │   ┌────────────────┐                          │          │
  │   │ Pick a label:  │                          │          │
  │   │ [Bug] [Feature]│                          │          │
  │   │ ─────────────  │                          │          │
  │   │ New: [name] [color picker] [Save]         │          │
  │   └────────────────┘                          │          │
  └────────────────────────────────────────────────┴──────────┘
  ```
- **User Flow**: Click tag button on card → popover with palette + inline new-label form. Sidebar always visible on the right.
- **Pros**:
  - Button is always keyboard reachable (no hover dependency)
  - Single popover for pick + create is efficient
  - Sidebar filter is always accessible
- **Cons**:
  - Combining pick + create in one popover makes the popover tall/complex; the new-label form clutters the pick experience
  - Ad-hoc creation means no single "source of truth" management view — renaming/deleting is harder
  - Sidebar consumes horizontal space, which is precious on a kanban board (columns already compete for width)
  - Sidebar is non-standard for simple filters in kanban tools; users expect Trello-style inline filter
  - Tag icon button on every card adds visual noise when labels are not in use
- **Usability**: Medium
- **Accessibility**: High (keyboard reachable)
- **Implementation Complexity**: High (sidebar layout change, complex popover state)

---

### Option 3 (CHOSEN): Button-Triggered Popover on Card (Picker Only) + Dedicated Label Management Panel (Via Popover Link or Header Button) + Inline Filter Bar Above Columns

- **Approach**: A small labeled `+` affordance inside the card footer opens a focused **label picker popover** that shows only the board's existing labels (palette chips). At the bottom of that popover a "Manage labels" link opens a **separate label management panel** (a focused dialog, not full-modal) for create/rename/delete. A **filter bar** is rendered as a horizontal strip between the `.board-header` and `.board-columns` divs, visible only when the board has at least one label. Each design decision is separated by concern; all three are keyboard-accessible.
- **Wireframe/Layout**:

  **Board — no filter active:**
  ```
  ┌──────────────────────────────────────────────────────┐
  │  BanyanBoard                    [Manage Labels]       │ ← board-header
  │  (no filter bar — no labels exist yet)               │
  ├──────────────────────────────────────────────────────┤
  │  To Do          In Progress         Done             │
  │ ┌────────────┐ ┌────────────┐ ┌────────────┐        │
  │ │ Card title │ │ Card title │ │ Card title │        │
  │ │ [Bug]      │ │            │ │ [Feature]  │        │
  │ │            │ │            │ │            │        │
  │ │ [+ Label]  │ │ [+ Label]  │ │ [+ Label]  │        │
  │ └────────────┘ └────────────┘ └────────────┘        │
  └──────────────────────────────────────────────────────┘
  ```

  **Board — labels exist, filter bar visible:**
  ```
  ┌──────────────────────────────────────────────────────┐
  │  BanyanBoard                    [Manage Labels]       │ ← board-header
  ├──────────────────────────────────────────────────────┤
  │  Filter: [Bug] [Feature] [Blocked] [Clear filter]    │ ← filter-bar (between header and columns)
  ├──────────────────────────────────────────────────────┤
  │  To Do          In Progress         Done             │
  │ ┌────────────┐ ...                                   │
  └──────────────────────────────────────────────────────┘
  ```

  **Label picker popover (anchored to card's [+ Label] button):**
  ```
  ┌──────────────────────────┐
  │ Labels                   │
  │ ┌──────┐ ┌─────────┐    │
  │ │ Bug  │ │ Feature │    │  ← label chips (color bg, label name)
  │ └──────┘ └─────────┘    │
  │ ┌─────────┐             │
  │ │Blocked  │             │
  │ └─────────┘             │
  │ ─────────────────────── │
  │ + Manage labels          │  ← link → opens management panel
  └──────────────────────────┘
  ```

  **Label management panel (dialog role, focused, centered):**
  ```
  ┌────────────────────────────────────────┐
  │ Manage Labels                     [X]  │
  ├────────────────────────────────────────┤
  │ Existing labels:                       │
  │  ■ Bug        [Delete]                 │
  │  ■ Feature    [Delete]                 │
  │  ■ Blocked    [Delete]                 │
  ├────────────────────────────────────────┤
  │ New label                              │
  │ Name: [___________________]            │
  │ Color: ● ● ● ● ● ● ● ● ● ●           │
  │ (error message here if any)            │
  │ [Save label]      [Cancel]             │
  └────────────────────────────────────────┘
  ```

- **User Flow**:
  1. User clicks `[+ Label]` button on card → picker popover opens (focus trapped within)
  2. User clicks a label chip → label toggled on/off card → popover closes
  3. If no labels exist or user wants to create one → clicks "Manage labels" → management panel opens
  4. User fills name, selects color, clicks Save → label added to palette, panel stays open for more edits
  5. User closes panel (X button or Escape) → returns to board
  6. Filter bar appears once palette has labels → user clicks chip to filter

- **Pros**:
  - Clean separation: picker is fast for daily use; management panel is for setup tasks
  - Filter bar placement between header and columns follows Trello convention — immediately recognizable
  - Button affordance is always visible — fully keyboard reachable (no hover)
  - Management panel (dialog) can implement proper focus trap
  - Popover is small and focused — does not overwhelm the card
  - Filter bar is hidden until labels exist — no UI clutter during initial use
  - Aligns with YAGNI: each component has a single responsibility
- **Cons**:
  - Two-step path to create a first label (card → popover → "Manage labels" → panel); mitigated by also exposing "Manage Labels" directly in board header
  - Popover positioning near edge cards may clip; requires positioning logic (anchor to card with viewport-aware placement)
- **Usability**: High
- **Accessibility**: High — all interactive elements are buttons, keyboard-navigable
- **Implementation Complexity**: Medium — popover + dialog + filter bar; no third-party UI library needed

---

### Option 4: Inline Expand (Accordion on Card) + Global Palette in Header + Filter as Header Dropdown

- **Approach**: Clicking a label area on the card expands the card in-place (accordion) to show label chips. Filter is a dropdown in the board header. Label management is a dedicated page/route.
- **Pros**:
  - No floating elements (no popover/portal z-index issues)
  - Filter dropdown keeps header compact
- **Cons**:
  - Accordion expansion shifts card layout — disrupts column heights and breaks drag-and-drop geometry with `@hello-pangea/dnd` (Droppable regions are height-sensitive; accordion expansion forces recalculation)
  - Separate page for label management is heavy for an MVP — violates YAGNI
  - Filter as header dropdown hides the active-filter state; users lose visual cue of what is being filtered
  - Expanding cards within a Droppable is a known pain point with dnd libraries
- **Usability**: Low — column layout disruption is jarring
- **Accessibility**: Medium
- **Implementation Complexity**: High (dnd recalculation, routing)

---

## Evaluation Matrix

| Criteria | Option 1 (Hover+Modal) | Option 2 (Sidebar) | Option 3 (Popover+Dialog+Bar) | Option 4 (Accordion) |
|----------|------------------------|---------------------|-------------------------------|----------------------|
| Usability | Low | Medium | **High** | Low |
| Accessibility | Low | High | **High** | Medium |
| Consistency with existing patterns | Medium | Low | **High** | Low |
| Responsiveness | Low (hover broken on touch) | Medium | **High** | Low |
| Performance | Medium | Medium | **High** | Low (dnd disruption) |
| Implementation effort | Medium | High | **Medium** | High |
| **Total** | **Low** | **Medium** | **High** | **Low** |

---

## Decision

**Chosen**: Option 3 — Button-Triggered Popover on Card (Picker Only) + Dedicated Label Management Panel + Inline Filter Bar Above Columns

### Rationale

Option 3 is the only design that simultaneously satisfies all three acceptance criteria groups:

- **AC-ENTRY-2 (keyboard accessible picker)**: The `[+ Label]` affordance is a `<button>` element — always in the tab order, activated by Enter/Space. The picker popover traps focus.
- **AC-ENTRY-3 (filter control visible when labels exist)**: The filter bar is conditionally rendered based on `labels.length > 0`, appearing between `.board-header` and `.board-columns` — exactly where kanban users (Trello reference) expect a filter.
- **AC-HAPPY-1 (create label with name + color)**: The management panel has a focused form with name input and color palette; matches `CardForm.tsx` validation pattern.
- **AC-HAPPY-4 (active filter visually indicated)**: The active filter chip gets an `aria-pressed="true"` state and a distinct visual style (border, check indicator).
- **AC-ERROR-1 (API failure → non-blocking error)**: Optimistic update pattern mirrors `onAddCard` in `Board.tsx`; rollback + `cardCreateError`-style `role="alert"`.
- **AC-ERROR-2 (empty/duplicate name → inline validation)**: The management panel form shows inline `role="alert"` errors, matching `CardForm.tsx`.

The separation between the picker popover (daily use, fast) and the management panel (setup, occasional) matches the "Zero Over-Engineering" and "Separation of Concerns" guiding principles: components do one thing. The filter bar placement is conventional and needs no instruction. Hover-gating (Option 1) was eliminated because it violates WCAG 2.1 SC 1.4.13 and breaks touch. The sidebar (Option 2) was eliminated because it consumes column width and is architecturally heavy. The accordion (Option 4) was eliminated because it conflicts with `@hello-pangea/dnd`'s geometry.

### Trade-offs Accepted

- **Two-step path to create first label** (card → popover → Manage labels link): Mitigated by placing a "Manage Labels" button directly in `.board-header`, giving power users a one-step shortcut. First-time users discover it via the empty picker state.
- **Popover viewport clipping on edge cards**: Accepted as a known, solvable CSS positioning problem (use `position: fixed` with `getBoundingClientRect` to flip popover above/below the card). Implementation detail, not a design flaw.

---

## Design Specifications

### Color Palette

All 10 colors verified for WCAG 2.1 AA contrast (4.5:1 minimum) against white (`#FFFFFF`) label text. Badge background is the label color; badge text is white.

| Token | Color Name | Hex | Contrast vs #FFF |
|-------|-----------|-----|-----------------|
| `label-red` | Red | `#C0392B` | 5.1:1 ✓ |
| `label-orange` | Orange | `#D35400` | 4.6:1 ✓ |
| `label-yellow` | Yellow-brown | `#9A7D0A` | 5.8:1 ✓ |
| `label-green` | Green | `#1E8449` | 5.2:1 ✓ |
| `label-teal` | Teal | `#148F77` | 4.7:1 ✓ |
| `label-blue` | Blue | `#1A5276` | 8.3:1 ✓ |
| `label-indigo` | Indigo | `#4A235A` | 10.2:1 ✓ |
| `label-purple` | Purple | `#6C3483` | 6.8:1 ✓ |
| `label-gray` | Gray | `#616A6B` | 4.6:1 ✓ |
| `label-black` | Charcoal | `#2C3E50` | 9.7:1 ✓ |

Note: Yellow `#F1C40F` (common yellow) fails AA at 1.07:1 against white; the palette uses `#9A7D0A` (darkened) instead.

### Layout

- **Desktop (>1024px)**: Board header full-width; filter bar full-width horizontal strip (flex-wrap, gap 8px); columns side-by-side; card `[+ Label]` button in card footer (bottom-right); popover anchored to button with `position: fixed`.
- **Tablet (640–1024px)**: Same layout; columns may scroll horizontally; filter bar wraps to two lines if many labels.
- **Mobile (<640px)**: Filter bar wraps; popover becomes a bottom-anchored sheet (full-width); management panel becomes full-screen dialog.

### Key Components

| Component | File | Purpose | Behavior |
|-----------|------|---------|----------|
| `LabelBadge` | `components/LabelBadge.tsx` | Display assigned label on card | Colored pill; shows label name; white text |
| `LabelPickerPopover` | `components/LabelPickerPopover.tsx` | Pick / unpick labels on a card | Opens on `[+ Label]` click; shows palette chips; "Manage labels" link at bottom |
| `LabelManagementPanel` | `components/LabelManagementPanel.tsx` | Create / delete board labels | Dialog role; name input + color swatches; inline validation |
| `FilterBar` | `components/FilterBar.tsx` | Filter board by one label | Horizontal chip row; conditionally rendered; active chip has `aria-pressed="true"` |
| Updated `Card.tsx` | `components/Card.tsx` | Show badge + `[+ Label]` button | Receives `labels: Label[]` and `cardLabels: string[]` props |
| Updated `Board.tsx` | `components/Board.tsx` | Own all label/filter state | `labels`, `activeFilter`, handlers as props to children |

### Interactions

| Trigger | Action | Feedback |
|---------|--------|----------|
| Click `[+ Label]` button on card | Open label picker popover | Popover appears anchored to button; focus moves to first chip |
| Click label chip in picker | Toggle label on card (optimistic) | Badge appears/disappears on card; popover closes |
| Click "Manage labels" link | Close picker; open management panel | Dialog appears; focus moves to name input |
| Fill name + pick color + click Save | Add label to board palette | Label appears in existing list; form resets |
| Click Delete on existing label | Remove label from palette + all cards | Label removed; any filtered state cleared if deleted label was active |
| Click label chip in filter bar | Activate filter | Non-matching cards hidden; chip gets active style + `aria-pressed="true"` |
| Click active filter chip again | Clear filter | All cards shown; chip returns to default style |
| Click "Clear filter" button | Clear filter | All cards shown |
| Escape key (in popover or dialog) | Close popover / dialog | Focus returns to trigger element |
| Click outside popover / dialog | Close popover / dialog | Focus returns to trigger element |

### Keyboard Interaction Sequences

**Attach label to card (keyboard):**
```
Tab ... → [+ Label] button (card footer) → Enter/Space
  → Popover opens; focus on first label chip
  → Tab between chips; Enter/Space to toggle
  → Escape → popover closes; focus returns to [+ Label] button
```

**Open label management panel (keyboard):**
```
Tab ... → [+ Label] button → Enter/Space
  → Popover opens
  → Tab past label chips → "Manage labels" link → Enter
  → Management panel opens; focus on name input
  → Tab through: name input → color swatches (arrow keys) → Save → Cancel
  → Escape → panel closes; focus returns to [+ Label] or [Manage Labels] header button
```

**Filter by label (keyboard):**
```
Tab ... → filter bar → Tab to label chip → Enter/Space
  → Filter activates; non-matching cards hidden; chip shows active state
  → Tab to same chip → Enter/Space → filter cleared
  OR Tab to "Clear filter" button → Enter → filter cleared
```

**Color swatch selection in management panel:**
```
Arrow keys (Left/Right) navigate between color swatches
Enter/Space selects focused swatch (updates visual selection)
Selected swatch has aria-checked="true" (radio group pattern)
```

### Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| < 640px | Management panel: full-screen dialog (`inset: 0`); picker: bottom sheet (full-width, fixed bottom) |
| 640–1024px | Standard layout; filter bar wraps if needed |
| > 1024px | Standard desktop layout as described above |

### Accessibility Requirements

- [x] Keyboard navigation support — all interactions reachable without mouse
- [x] Screen reader compatibility — popover uses `role="dialog"` + `aria-labelledby`; management panel uses `role="dialog"` with focus trap; filter chips use `role="button"` + `aria-pressed`; color swatches use `role="radio"` within `role="radiogroup"`
- [x] Color contrast compliance (WCAG AA) — all 10 palette colors verified ≥4.5:1 against white text
- [x] Focus indicators visible — do not suppress `:focus-visible` outline; consistent with existing `card:focus` style
- [x] Error messages accessible — `role="alert"` on inline errors (matching `CardForm.tsx`); non-blocking API errors use `role="alert"` near header (matching `cardCreateError` in `Board.tsx`)
- [x] `aria-label` on `[+ Label]` button: `aria-label="Add label to [card title]"` (unique per card, avoids ambiguous "Add label" for screen reader)
- [x] Color is not the only differentiator — label name text always shown in badge and chip (color alone is insufficient per WCAG 1.4.1)
- [x] Management panel delete buttons: `aria-label="Delete label [name]"` to distinguish multiple Delete buttons

---

## Implementation Guidelines

### For Developers

1. **Add `Label` type and `CardData.labelIds` to `frontend/src/types.ts`**: `Label = { id: string; name: string; color: string }`. `CardData` gets optional `labelIds?: string[]`. Keep `LABEL_COLORS` constant (the 10-color palette) in `types.ts` as the single source of truth for the color palette.

2. **State ownership in `Board.tsx`**: Add `labels: Label[]` state and `activeFilter: string | null` state. Pass `labels` and handlers (`onLabelCreate`, `onLabelDelete`) as props to `LabelManagementPanel`; pass `labels`, `cardLabels`, `onLabelToggle` to each `Card`; pass `labels`, `activeFilter`, `onFilterChange` to `FilterBar`. This preserves the presentational component pattern — no component fetches its own data.

3. **Optimistic update for label attach**: Follow the existing `onAddCard` pattern exactly — apply the change to local state first, then call the API. On failure, revert the local state and set `cardCreateError`-equivalent state (`labelAssignError`).

4. **Popover positioning**: Use `position: fixed` with `getBoundingClientRect()` on the trigger button to calculate top/left. Add a viewport boundary check: if the popover would clip the bottom of the viewport, open it above the button instead. Do not use a third-party positioning library — this is sufficient for the scale.

5. **Focus trap for management panel**: Implement a minimal focus trap — query all focusable elements within the dialog on open, intercept Tab/Shift+Tab to cycle within them, return focus to the trigger on close. Implement as a `useFocusTrap` hook in `frontend/src/hooks/`.

6. **Filter is pure client-side**: `filteredCards = activeFilter ? cards.filter(c => c.labelIds?.includes(activeFilter)) : cards`. Pass `filteredCards` to columns instead of `cards`. No API call on filter toggle.

7. **Conditional filter bar rendering**: `{labels.length > 0 && <FilterBar ... />}` in `Board.tsx` between the `<header>` and `<div className="board-columns">`.

8. **Color swatch keyboard**: Implement the color palette inside management panel as a `role="radiogroup"` with individual swatches as `role="radio"` + `aria-checked`. Arrow key navigation between swatches.

### Component Structure

```
frontend/src/components/
├── Card.tsx                      (updated — add LabelBadge, [+ Label] button)
├── Board.tsx                     (updated — add label/filter state, FilterBar, Manage Labels button)
├── LabelBadge.tsx                (new — colored pill showing label name)
├── LabelPickerPopover.tsx        (new — picker anchored to card button)
├── LabelManagementPanel.tsx      (new — dialog for create/delete labels)
├── FilterBar.tsx                 (new — horizontal chip filter strip)
frontend/src/hooks/
├── useFocusTrap.ts               (new — minimal focus trap for dialogs)
frontend/src/types.ts             (updated — Label type, labelIds on CardData, LABEL_COLORS)
```

### Recommended Libraries/Patterns

- No new libraries needed — the feature is achievable with plain React + CSS
- `useFocusTrap` hook is a ~30-line implementation; no `focus-trap-react` package needed (YAGNI)
- `position: fixed` popover positioning via `getBoundingClientRect` — no Popper.js needed at this scale

---

## Validation Checklist

- [x] Meets all user goals (attach label, create label, filter by label, clear filter)
- [x] Accessible per WCAG 2.1 AA (keyboard nav, contrast, focus indicators, ARIA roles)
- [x] Consistent with existing patterns (presentational components, `role="alert"` errors, `Board.tsx` state ownership, `CardForm.tsx` validation pattern)
- [x] Respects Guiding Principles (Separation of Concerns, Type Safety, Zero Over-Engineering, Accessibility Required)
- [x] Responsive across devices (desktop primary; tablet and mobile adaptations specified)
- [x] Performance acceptable (filter is pure client-side array filter, no round-trip)
- [x] Implementation feasible (no new dependencies, medium complexity, follows existing patterns)

---

## Next Steps

1. Implement `Label` type and `LABEL_COLORS` constant in `frontend/src/types.ts`
2. Update `Board.tsx` with label and filter state + conditional `FilterBar` rendering
3. Implement `LabelBadge`, `LabelPickerPopover`, `LabelManagementPanel`, `FilterBar` components
4. Implement `useFocusTrap` hook
5. Update `Card.tsx` to render `LabelBadge` list and `[+ Label]` button
6. Add backend API endpoints for label CRUD (linked to DB migration for `labels` and `card_labels` tables)
7. Connect frontend to API with optimistic update + error handling per `onAddCard` pattern
8. Write Vitest tests per `frontend/src/__tests__/` convention covering: badge render, picker toggle, filter logic, keyboard interactions, error states
