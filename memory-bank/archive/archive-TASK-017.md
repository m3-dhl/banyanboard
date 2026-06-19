# Archive: TASK-017 — Card Detail View

## Metadata
- **Task ID**: TASK-017
- **Complexity**: Level 3
- **Started**: 2026-06-19
- **Completed**: 2026-06-19
- **Roadmap Link**: FEAT-010
- **Branch**: feature/FEAT-010-card-detail-view

---

## Summary

Card Detail Modal for BanyanBoard. Clicking a card body opens a portal-based modal (`CardDetailModal.tsx`) with six independently interactive sections: editable title, Markdown description, due date with visual badge on the card surface, column selector, label toggles, and a chronological comments thread. All field edits are optimistic with rollback. Due-date badge uses 3-state color coding (neutral / warning ≤3 days / overdue). Activity feed extended with `description-changed`, `due-date-changed`, and `comment-added` event kinds.

---

## Requirements

### Success Criteria (all met)
- [x] Modal opens via card body click (pointer-delta disambiguation) or keyboard Enter/Space
- [x] Drag-and-drop does not spuriously open modal on drag completion
- [x] Title, description, due date, column, labels editable from modal with optimistic updates + rollback
- [x] Due-date badge rendered on card surface with 3 urgency states
- [x] Comments thread with optimistic post, rollback, validation, saving indicator
- [x] Portal rendered via `ReactDOM.createPortal` into `document.body`; focus trapped with `useFocusTrap`
- [x] Escape / backdrop / close button dismiss; focus returns to originating card
- [x] PostgreSQL: `description TEXT` + `due_date TIMESTAMPTZ` on `cards`; `card_comments` table
- [x] New endpoints: `GET /cards/:id`, `PATCH /cards/:id`, `GET /cards/:id/comments`, `POST /cards/:id/comments`
- [x] 292 tests passing (112 backend + 180 frontend); TSC clean; lint clean

### Acceptance Criteria Coverage
All 15 ACs met (13 MUST, 2 SHOULD). No MUST criterion deferred.

---

## Implementation

### Phase 1 — Backend: Schema + Card Detail Endpoints

**DB Migrations:**
- `backend/src/db/migrations/005_add_card_description_due_date.sql` — `ALTER TABLE cards ADD COLUMN description TEXT; ALTER TABLE cards ADD COLUMN due_date TIMESTAMPTZ;`
- `backend/src/db/migrations/006_create_card_comments.sql` — `card_comments` table (UUID PK, card_id FK CASCADE, body TEXT CHECK 1–500 chars, created_at TIMESTAMPTZ)

**New/Modified Files:**
- `backend/src/types/card.types.ts` — added `description`, `dueDate`, `UpdateCardDto`
- `backend/src/types/comment.types.ts` — new: `Comment`, `CreateCommentDto`
- `backend/src/repositories/card.repository.ts` — added `getCardById`, `updateCard`
- `backend/src/repositories/comment.repository.ts` — new: `getCommentsByCardId`, `createComment`
- `backend/src/services/comment.service.ts` — new with validation
- `backend/src/controllers/card.controller.ts` — added `getCardById`, `updateCard` handlers
- `backend/src/controllers/comment.controller.ts` — new: `getComments`, `createComment`
- `backend/src/routes/card.routes.ts` — added `GET /:id`, `PATCH /:id`, `GET /:id/comments`, `POST /:id/comments`
- `backend/src/__tests__/card.detail.test.ts` — 20 tests for GET/PATCH /cards/:id
- `backend/src/__tests__/comment.test.ts` — 20 tests for GET/POST /cards/:id/comments

**Test results**: 112/112 PASS

### Phase 2 — Frontend: CardDetailModal + Card Click Handler

**New/Modified Files:**
- `frontend/package.json` — added `react-markdown`
- `frontend/src/types.ts` — added `CardDetail`, `Comment`, `dueDate` to `CardData`, new activity feed entry kinds
- `frontend/src/api.ts` — added `getCard`, `updateCard`, `getComments`, `createComment`
- `frontend/src/components/CardDetailModal.tsx` — stateful feature container: portal, useFocusTrap, lazy fetch, comment state, all edit handlers
- `frontend/src/components/DescriptionSection.tsx` — view/edit toggle, Save/Cancel, Ctrl+Enter
- `frontend/src/components/CommentsSection.tsx` — optimistic thread, rollback, validation, saving indicator
- `frontend/src/components/DueDateBadge.tsx` — 3-state badge component
- `frontend/src/components/Card.tsx` — pointer-delta handler, DueDateBadge, `onOpenDetail` prop
- `frontend/src/components/Board.tsx` — `openDetailCardId` state, modal wiring, extended activity feed
- Test files: `CardDetailModal.detail.test.tsx`, `CardDetailModal.comments.test.tsx`, `Card.click.test.tsx`, `Card.duebadge.test.tsx`

**Test results**: 180/180 PASS

### Phase 3 — Integration + Polish + E2E Tests

**New Test Files:**
- `frontend/src/__tests__/DescriptionSection.xss.test.tsx` — 3 tests: script tag injection, onerror attribute, normal render
- `frontend/src/__tests__/Board.detail.test.tsx` — 3 tests: title propagation, column propagation, focus return via fake timers

**Final results**: 292/292 tests passing, TSC clean, lint clean, code review APPROVED

---

## Design Decisions

Four design questions resolved in the creative phase before any implementation began:

| Decision | Chosen Approach | Why |
|----------|----------------|-----|
| Click-vs-drag | `onPointerDown` + `onPointerUp` with 5px delta threshold | `snapshot.isDragging` unreliable post-drop; delta approach device-agnostic |
| Modal layout | Single-column, 560px desktop / 100vw mobile | Consistent with existing modals; two-column adds complexity with no mobile benefit |
| Description edit UX | Explicit "Edit" button → textarea → Save/Cancel | Matches existing explicit-save pattern; prevents accidental edits |
| Due-date badge | Below title, above labels; 3-state WCAG-AA colors | Clean visual hierarchy; LABEL_COLORS tokens pre-verified |

Architecture decisions:

| Decision | Chosen Approach | Why |
|----------|----------------|-----|
| Markdown library | `react-markdown` v9 | XSS-safe by construction; no dangerouslySetInnerHTML; single dep |
| Card detail fetch | Lazy — GET /cards/:id on modal open | Keeps CardData list type clean; REST-correct |
| Comment state | Local to `CardDetailModal` (stateful feature container) | No board-level consumers; encapsulation > prop-drilling |

References:
- `memory-bank/creative/TASK-017-card-detail-uiux.md`
- `memory-bank/creative/TASK-017-card-detail-architecture.md`

---

## Testing

| Scope | Files | Tests |
|-------|-------|-------|
| Backend: card detail endpoints | `card.detail.test.ts` | 20 |
| Backend: comment endpoints | `comment.test.ts` | 20 |
| Backend: existing (pre-task) | — | 72 |
| Frontend: modal detail | `CardDetailModal.detail.test.tsx` | ~30 |
| Frontend: modal comments | `CardDetailModal.comments.test.tsx` | ~25 |
| Frontend: click-vs-drag | `Card.click.test.tsx` | ~10 |
| Frontend: due-date badge | `Card.duebadge.test.tsx` | ~8 |
| Frontend: board integration | `Board.detail.test.tsx` | 3 |
| Frontend: XSS safety | `DescriptionSection.xss.test.tsx` | 3 |
| Frontend: existing (pre-task) | — | ~101 |
| **TOTAL** | **10 new files** | **292** |

All tests passing ✅ — TSC clean ✅ — Lint clean ✅

---

## Lessons Learned

Four reusable patterns extracted and stored in `agent-rules/_learned/`:

1. **Pointer-delta click-vs-drag** — `onPointerDown` + `onPointerUp` 5px threshold; never use `snapshot.isDragging` → `frontend-architecture.md`
2. **Stateful feature container** — keep modal-scoped async state local when no parent consumes it → `frontend-architecture.md`
3. **`vi.useFakeTimers()` isolation** — wrap in `describe` with `afterEach(vi.useRealTimers)` to prevent leak → `testing-patterns.md`
4. **XSS assertion** — verify Markdown renderers with explicit jsdom `querySelector('script')` test → `security.md` (new file)

Reference: `memory-bank/reflection/reflection-TASK-017.md`

---

## Technical Debt / Follow-up

- Comment author attribution (no user identity in MVP; `user_id` FK column ready to add)
- Comment edit / delete (post-MVP; no UI stub exists)
- Real-time comment sync across tabs (post-MVP; polling/WebSockets)
- `setTimeout(0)` focus return — consider replacing with lifecycle-safe alternative if exit animation added

---

## References
- Plan: `memory-bank/tasks/TASK-017.md`
- Creative (UI/UX): `memory-bank/creative/TASK-017-card-detail-uiux.md`
- Creative (Architecture): `memory-bank/creative/TASK-017-card-detail-architecture.md`
- Reflection: `memory-bank/reflection/reflection-TASK-017.md`
- Progress notes: `memory-bank/progress.md`
