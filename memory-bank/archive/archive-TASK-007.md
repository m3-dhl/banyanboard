# Archive: Task Creation System

## Metadata
- **Task ID**: TASK-007
- **Feature**: FEAT-006
- **Complexity**: Level 2 (user-capped; natural eval = Level 3)
- **Branch**: feature/FEAT-006-task-creation-system
- **Completed**: 2026-06-16
- **Phases**: 2

## Summary

Added end-to-end card creation to BanyanBoard: a per-column inline "Add card" form (Phase 1, in-memory) backed by a `POST /cards` REST endpoint with optimistic update and rollback (Phase 2). All 6 acceptance criteria met. 80 tests pass (43 frontend Vitest + 37 backend Jest + Supertest).

## Solution

### Phase 1 — Frontend inline form + in-memory state
- Extracted `CardForm.tsx` component with `onAddCard(title, columnId)` callback
- Integrated into `Column.tsx` — "Add card" button always visible at column bottom
- Extended `ActivityFeedEntry` in `types.ts` with discriminated union `action: 'move' | 'create'`
- Wired card creation into `Board.tsx` `useState<CardData[]>` + feed
- Client-side validation: empty/whitespace blocked, focus management, `aria-describedby` for error

### Phase 2 — Backend persistence + optimistic rollback
- DB migration `002_create_cards.sql` — `cards` table with `id`, `title`, `column_id`, `created_at`
- Layered backend: `card.types.ts` → `card.repository.ts` → `card.service.ts` → `card.controller.ts` → `card.routes.ts` → registered in `app.ts`
- `POST /cards` validates title (non-empty, ≤100 chars) and `columnId` (enum)
- `createCard()` added to `frontend/src/api.ts` using `VITE_API_BASE`
- `Board.tsx` uses client-generated UUID for optimistic add; on error removes both card and feed entry in single `setState` call

## Files Changed

### New Files
- `frontend/src/components/CardForm.tsx` — inline card creation form
- `frontend/src/__tests__/CardForm.test.tsx` — 11 tests
- `backend/src/db/migrations/002_create_cards.sql` — cards table DDL
- `backend/src/types/card.types.ts` — Card, CreateCardDto types
- `backend/src/repositories/card.repository.ts` — insert + findById
- `backend/src/services/card.service.ts` — validation + ValidationError
- `backend/src/controllers/card.controller.ts` — POST /cards handler
- `backend/src/routes/card.routes.ts` — Express router
- `backend/src/__tests__/card.test.ts` — 8 backend integration tests

### Modified Files
- `frontend/src/types.ts` — discriminated union `ActivityFeedEntry`
- `frontend/src/components/Column.tsx` — "Add card" button + CardForm integration
- `frontend/src/components/Board.tsx` — async `onAddCard` + optimistic update + rollback
- `frontend/src/components/ActivityFeed.tsx` — render both move and create events
- `frontend/src/api.ts` — `createCard()` fetch function
- `backend/src/app.ts` — mounted `/cards` router
- `frontend/src/__tests__/Column.test.tsx` — 4 new tests scoped to named regions
- `frontend/src/__tests__/ActivityFeed.test.tsx` — 1 new creation-event test
- `frontend/src/__tests__/Board.feed.test.tsx` — card creation + rollback tests

## Key Decisions

1. **Discriminated union for ActivityFeedEntry** — `action: 'move' | 'create'` allows single feed array and component; no parallel type tree
2. **Optimistic UUID-filter rollback** — client UUID used to remove both card and feed entry atomically on backend error
3. **CardForm as separate component** — keeps Column.tsx readable; enables focused 11-test file
4. **columnId enum validation in backend** — keeps backend in sync with frontend `ColumnId` type

## Test Coverage

| Suite | Tests | Result |
|-------|------:|-------|
| Frontend (Vitest) | 43 | PASS |
| Backend (Jest) | 37 | PASS |
| **Total** | **80** | **PASS** |

## Lessons Learned

1. **Full-stack + rollback = Level 3** — any feature combining new backend layer + optimistic UI + rollback is structurally Level 3; Level 2 cap created planning pressure
2. **UI-first phasing validated** — Phase 1 delivered shippable UX with zero backend dependency; Phase 2 layered persistence cleanly
3. **Learned rules reused directly** — `testing-patterns.md` (scope queries to named regions), `architecture.md` (ValidationError in service), `frontend-architecture.md` (ColumnId string union) all applied without redesign

## Notes

- Card `position` not persisted (append-only); migration needed if ordering is added
- `POST /cards` is board-implicit; `boardId` param needed when multi-board lands
- UUID swap (client→backend) on success is acceptable at p95 < 200ms; revisit if latency degrades
