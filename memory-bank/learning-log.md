# Learning Log

Chronological record of pattern extraction and consolidation events from task reflections.

---

## 2026-06-17 - Consolidation (during TASK-012 archive)

- Files before: 4, Files after: 4
- Merged: 0 files
- Expired: 0 bullets (0 files deleted)
- Promoted: 0 files
- Pruned: 0 excess bullets

---

## 2026-06-19 - TASK-013 Reflection

### Extracted Patterns
- **testing-patterns** → amended `agent-rules/_learned/testing-patterns.md` — update mock handlers referencing old API URL in same commit (evidence count: 8)
- **api-design** → created `agent-rules/_learned/api-design.md` — verify route path against backend mount point before writing frontend call (evidence count: 1)

### systemPatterns.md Updates
- None (no novel architectural patterns)

---

## 2026-06-17 - TASK-012 Reflection

### Extracted Patterns
- **testing-patterns** → amended `agent-rules/_learned/testing-patterns.md` — Component.concern.test.tsx for new concerns vs. extending existing test file (evidence count: 7)
- **frontend-architecture** → amended `agent-rules/_learned/frontend-architecture.md` — local dialog state in Draggable child vs. lifting to board (evidence count: 5)
- **architecture** → amended `agent-rules/_learned/architecture.md` — negative-scope enumeration required for destructive-action features (evidence count: 6)

### Confirmed Rules
- `testing-patterns.md` (rollback test before async path): applied in Board.test.tsx rollback test
- `testing-patterns.md` (dual instanceof/name guard): applied in backend deleteCard controller for NotFoundError
- `frontend-architecture.md` (ReactDOM portal for dnd-adjacent): applied in DeleteCardDialog
- `frontend-architecture.md` (Escape listener scoped to container): applied in DeleteCardDialog
- `architecture.md` (atomic rollback via single setState): applied in Board.onDeleteCard
- `architecture.md` (shared role="alert" limit documented): cardDeleteError added alongside cardCreateError with code comment

### systemPatterns.md Updates
- None (deletion pattern is feature-level refinement of existing optimistic-update architecture)

---

## 2026-06-17 - Consolidation (during TASK-009 archive)

- Files before: 4, Files after: 4
- Merged: 0 files
- Expired: 0 bullets (0 files deleted)
- Promoted: 0 files (all already at medium or below threshold)
- Pruned: 0 excess bullets

---

## 2026-06-17 - TASK-009 Reflection

### Extracted Patterns
- **frontend-architecture** → amended `agent-rules/_learned/frontend-architecture.md` — visibleIdSet splice pattern for filtered-list reorder (evidence count: 4)
- **architecture** → amended `agent-rules/_learned/architecture.md` — cross-feature filter×mutation interactions as explicit ACs (evidence count: 5)
- **architecture** → amended `agent-rules/_learned/architecture.md` — shared role="alert" reuse limit for multiple optimistic ops (evidence count: 5)

### Confirmed Rules
- `testing-patterns.md` (DnD mock via captured onDragEnd): applied in Board.reorder.test.tsx
- `testing-patterns.md` (rollback test before async path): AC-ERROR-1 revert test written first
- `testing-patterns.md` (scope queries to named regions): all assertions use within(todoCol)/within(doneCol)
- `architecture.md` (atomic rollback via single setState): setCards(snapshot) single call
- `architecture.md` (ValidationError in service layer): card.service.ts validates position, throws ValidationError

### systemPatterns.md Updates
- None (no novel architectural patterns — patterns are feature-level refinements of existing approaches)

---

## 2026-06-16 - Consolidation (during TASK-008 archive)

- Files before: 4, Files after: 4
- Merged: 0 files
- Expired: 0 bullets (0 files deleted)
- Promoted: 1 file to medium priority (`frontend-architecture.md`, evidence_count reached 3)
- Pruned: 0 excess bullets

---

## 2026-06-16 - TASK-008 Reflection

### Extracted Patterns
- **frontend-architecture** → amended `agent-rules/_learned/frontend-architecture.md` — ReactDOM portal for dnd-adjacent popovers + Escape key scoped to container (evidence count: 3)
- **testing-patterns** → amended `agent-rules/_learned/testing-patterns.md` — dual instanceof/name guard in controllers for Jest module isolation (evidence count: 6)
- **accessibility** → created `agent-rules/_learned/accessibility.md` — pre-verify WCAG contrast ratios in creative doc (evidence count: 1)

### Confirmed Rules
- `testing-patterns.md` (resetAllMocks/fixture pattern): applied in label.test.ts
- `testing-patterns.md` (dnd mock via captured onDragEnd): applied in Board.feed.test.tsx label feed tests
- `testing-patterns.md` (scope existing queries to named regions): applied when FilterBar added to Board
- `frontend-architecture.md` (ColumnId string union): held correctly throughout

### systemPatterns.md Updates
- ReactDOM portal pattern already captured during Phase 2 build — no new addition needed

---

## 2026-06-16 - TASK-007 Reflection

### Extracted Patterns
- **testing-patterns** → amended `agent-rules/_learned/testing-patterns.md` — write rollback test before implementing async optimistic-update (evidence count: 5)
- **architecture** → amended `agent-rules/_learned/architecture.md` — atomic rollback across multiple state arrays via single setState + UUID filter (evidence count: 3)

### Confirmed Rules
- `testing-patterns.md` (named landmark region scoping): directly reused in Phase 1 and Phase 2 test specs for Column and Board tests
- `architecture.md` (ValidationError in service layer): applied verbatim in card.service.ts → card.controller.ts
- `frontend-architecture.md` (ColumnId string union): reused in discriminated union ActivityFeedEntry branches

### systemPatterns.md Updates
- None (optimistic update/rollback pattern is documented in reflection but is feature-level, not novel architecture)

---

## 2026-06-16 - Consolidation (during TASK-007 archive)

- Files before: 3, Files after: 3
- Merged: 0 files
- Expired: 0 bullets (0 files deleted)
- Promoted: 1 file (`architecture.md` low → medium, evidence_count reached 3)
- Pruned: 0 excess bullets

---

## 2026-06-16 - Consolidation (during TASK-006 archive)

- Files before: 3, Files after: 3
- Merged: 0 files
- Expired: 0 bullets (0 files deleted)
- Promoted: 0 files (all files already at correct priority)
- Pruned: 0 excess bullets

---

## 2026-06-16 - Consolidation (during TASK-005 archive)

- Files before: 3, Files after: 3
- Merged: 0 files
- Expired: 0 bullets (0 files deleted)
- Promoted: 1 file — testing-patterns.md to medium priority (evidence_count=3 ≥ threshold=3)
- Pruned: 0 excess bullets

---

## 2026-06-16 - TASK-005 Reflection

### Extracted Patterns
- **testing-patterns** → amended `agent-rules/_learned/testing-patterns.md` — added @hello-pangea/dnd mock via captured onDragEnd closure (evidence count: 3)
- **frontend-architecture** → created `agent-rules/_learned/frontend-architecture.md` — ColumnId string union for DnD cast (evidence count: 1)

### Confirmed Rules
- `testing-patterns.md` (resetAllMocks/fixture pattern): confirmed applicable via Vitest equivalent `vi.restoreAllMocks()` — broadened rule to cover both Jest and Vitest

### systemPatterns.md Updates
- None (component hierarchy and state pattern are too task-specific)

---

## 2026-06-16 - TASK-006 Reflection

### Extracted Patterns
- **testing-patterns** → amended `agent-rules/_learned/testing-patterns.md` — scope existing component test queries to named landmark regions before adding new always-visible section (evidence count: 4)

### Confirmed Rules
- `testing-patterns.md` (@hello-pangea/dnd mock pattern): directly reused in Board.feed.test.tsx — third task to use this pattern
- `frontend-architecture.md` (ColumnId string union): reused as-is for ActivityFeedEntry fromColumn/toColumn — type cast from droppableId worked cleanly

### systemPatterns.md Updates
- None (in-memory feed pattern is too task-specific)

---

## 2026-06-09 - TASK-003 Reflection

### Extracted Patterns
- **architecture** → amended `agent-rules/_learned/architecture.md` — Express middleware mount order (evidence count: 2)

### Confirmed Rules
- `testing-patterns.md` (app/server split): confirmed reused in TASK-003 CORS tests — pattern still valid

---

## 2026-06-09 - TASK-002 Reflection

### Extracted Patterns
- **testing-patterns** → amended `agent-rules/_learned/testing-patterns.md` — added jest.resetAllMocks/fixture pattern (evidence count: 2)
- **architecture** → created `agent-rules/_learned/architecture.md` — domain error class in service layer (evidence count: 1)

### Confirmed Rules
- `testing-patterns.md` (app/server split from TASK-001): confirmed reused in TASK-002 board tests — evidence count reinforced

---

## 2026-06-09 - Consolidation (during TASK-002 archive)

- Files before: 2, Files after: 2
- Merged: 0 files
- Expired: 0 bullets (0 files deleted)
- Promoted: 0 files (testing-patterns at evidence_count=2, threshold=3)
- Pruned: 0 excess bullets

---

## 2026-06-09 - TASK-001 Reflection

### Extracted Patterns
- **testing-patterns** → created `agent-rules/_learned/testing-patterns.md` (evidence count: 1)

### systemPatterns.md Updates
- None (no novel architectural patterns for Level 1 scaffold)
