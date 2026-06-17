# Reflection: TASK-009 Card Reordering

**Date**: 2026-06-17
**Task**: TASK-009 - Card Reordering
**Complexity**: Level 2
**Feature**: FEAT-008
**Branch**: feature/FEAT-008-card-reordering

## Overall Assessment

**Task Quality**: Excellent
**Ecosystem Effectiveness**: Highly Effective
**Summary**: All 7 acceptance criteria were met with clean, maintainable code across both phases. The Level 2 two-phase decomposition (DB+Backend then Frontend) was the right call for a feature that crosses the full stack but requires no design exploration. The spec's pre-identification of the filter index mapping edge case (AC-ENTRY-2) was the single biggest quality multiplier — without it, the implementation would likely have introduced a subtle data-corruption bug.

---

## Dimension 1: Task Implementation Quality

### Requirements Coverage

| AC | Status | Evidence |
|----|--------|----------|
| AC-ENTRY-1: Drag any card in same column, no jump-back | PASS | `Board.tsx` lines 62–86 — same-column branch with optimistic update; test "reorders cards in DOM optimistically" |
| AC-ENTRY-2: Filter active — hidden cards retain relative order | PASS | `Board.tsx` lines 66–78 — `visibleIdSet` pattern preserves `hiddenColCards` in place; `Board.reorder.test.tsx` "does not corrupt hidden cards" |
| AC-HAPPY-1: Card at correct position immediately, no flicker | PASS | Optimistic `setCards` fires synchronously before the API call; no intermediate loading state |
| AC-HAPPY-2: Order persists after page refresh | PASS | `004_add_card_position.sql` backfills positions; `GET /cards` now orders `position ASC, created_at ASC`; 65 backend tests pass including `GET /cards` contract check |
| AC-HAPPY-3: Cross-column drag unchanged | PASS | Same-column branch returns early before reaching cross-column branch; regression test "does not call reorderCard for cross-column drop" |
| AC-ERROR-1: API failure reverts to pre-drag order | PASS | `snapshot = cards` saved before `setCards`; `.catch(() => setCards(snapshot))` in `Board.tsx` line 81; revert test in `Board.reorder.test.tsx` |
| AC-ERROR-2: Concurrent reorders use atomic DB transaction | PASS | `card.repository.ts` `reorderCard` method uses a single DB transaction (BEGIN / UPDATE / COMMIT) |
| AC-VERIFY-1: `GET /cards` ordered `position ASC, created_at ASC` | PASS | Repository query updated in Phase 1; tiebreaker on `created_at` for cards seeded before migration |

### Code Quality

- **Snapshot rollback pattern**: `const snapshot = cards` captures state before `setCards` and passes it to the `.catch()`. This is the same snapshot-rollback idiom from TASK-007; consistent use across optimistic features reduces cognitive load.
- **`setCards` functional update**: The new-state computation uses `setCards((prev) => ...)` rather than the stale closure value, which is correct. The `snapshot` variable is captured from the outer closure before dispatch — this is safe because the snapshot only needs to represent "what the state was right before this drag", not "latest state at catch time".
- **`cardCreateError` reused for reorder error** (`Board.tsx` line 82): Pragmatic reuse of the existing error display infrastructure rather than adding a new `reorderError` state. The error message is distinct ("Failed to reorder card") so user confusion is unlikely. The downside is that a card-create error in flight could be overwritten by a reorder error and vice versa — acceptable for a Kanban prototype at this stage.
- **Filter index mapping clarity** (`Board.tsx` lines 66–78): The `visibleIdSet` approach — reorder only the visible subset, then reconstruct the full array by appending hidden same-column cards — is easy to read and avoids index arithmetic. It correctly defers to `filteredCards` for the rendered order.
- **Migration quality**: `004_add_card_position.sql` uses `ADD COLUMN IF NOT EXISTS` (idempotent) and backfills with `ROW_NUMBER() OVER (PARTITION BY column_id ORDER BY created_at ASC)`. Zero-indexed (`rn - 1`) for consistency with the frontend's 0-based DnD indices.

### Test Coverage

| Phase | File | Tests Added | Total Suite |
|-------|------|-------------|-------------|
| Phase 1 (Backend) | `backend/src/__tests__/card.test.ts` | ~9 new tests | 65 passing |
| Phase 2 (Frontend) | `frontend/src/__tests__/Board.reorder.test.tsx` | 7 tests (new file) | 81 passing |

**Test quality observations:**

- The `Board.reorder.test.tsx` file uses the established `captured onDragEnd` DnD mock pattern and is well-structured across two `describe` blocks — one for core reorder behavior and one for the filter-active edge case.
- Helper functions `makeSameColDrop` and `makeCrossColDrop` reduce test verbosity and make the drag scenarios explicit.
- The rollback test (AC-ERROR-1) correctly awaits the final reverted state rather than an intermediate optimistic state, with an explanatory comment noting why the transient state is not verified.
- The filter test (AC-ENTRY-2) goes beyond a pure unit test and wires up the label picker + filter chip interaction via `userEvent`, providing meaningful integration coverage of the full filter-active-reorder flow.
- **Minor gap**: No backend repository unit test for `reorderCard`'s transaction SQL (listed as optional in the spec and intentionally left out — acceptable at Level 2; correctness is validated via the supertest integration tests).

### Technical Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Atomic DB transaction for reorder | Prevents partial writes under concurrency (AC-ERROR-2). Cards in same column get consistent `position` values even if two requests arrive simultaneously. | Slightly more complex repository code, but correctness over simplicity for a write path. |
| Optimistic update with snapshot revert | User sees instant feedback (AC-HAPPY-1) with clean rollback on failure. Single `setCards(snapshot)` call keeps revert trivially correct (matches existing TASK-007 pattern). | Snapshot is a closure capture; if another state update fires between the drag start and the API .catch(), the revert overwrites it. Acceptable for the current single-user scope. |
| Reuse `cardCreateError` for reorder error | Avoids new state variable and new DOM element; keeps `Board.tsx` from growing unnecessarily. | Two optimistic operations could stomp each other's errors. Documented in code as a known simplification. |
| `visibleIdSet` filter-mapping approach | Readable, O(n) time, avoids complex index arithmetic for the filtered-to-full-array mapping. | Creates a new `Set` and two filtered arrays per drag; negligible at typical board sizes. |
| 0-based `position` values | Matches the frontend DnD library's 0-based `destination.index`. No conversion needed at the API boundary. | The API contract (`PATCH /cards/:id/position` body `{ position: number }`) is thus a DnD index, not an abstract ordering number. Fine for this app but worth noting if the API were ever consumed by a non-DnD client. |

### Issues Encountered

No blockers or rework were needed. The filter index mapping edge case was pre-identified in the spec (AC-ENTRY-2) with a concrete implementation note, which meant the Phase 2 build agent could implement it correctly on the first attempt without backtracking. Both phase completion gates (test suite pass + build pass + lint pass) were met cleanly.

---

## Dimension 2: Claude Code Ecosystem Effectiveness

### Workflow Assessment

The Level 2 workflow (roadmap → plan → build Phase 1 → build Phase 2 → reflect) was well-matched to this feature:

- **Phase split was correct**: DB + backend in Phase 1 gave a clean API contract for Phase 2. The frontend never needed to know about the DB migration, only about the `PATCH /cards/:id/position` endpoint. The two phases were genuinely independent once the endpoint existed.
- **No creative phase needed**: The spec correctly ruled out a creative phase. The interaction model was fully constrained by the existing `@hello-pangea/dnd` setup; no UI surface decisions were open.
- **Both phases were clean stops**: Phase 1 delivered a green test suite at 65 tests before any frontend work began. Phase 2 delivered 81/81 passing with no cross-phase leakage.

### Spec / Plan Quality

The Spec Writer Agent produced a high-quality specification that stood out in one specific way: **it pre-identified and documented the filter index mapping edge case (AC-ENTRY-2) at the spec stage**, including a concrete implementation note describing the `visibleIdSet` approach. This is a non-obvious interaction between two independently correct features (label filtering + drag-and-drop) that could easily be missed in planning. Because it was documented before Phase 2 began, the build agent implemented it correctly in the first attempt.

The spec also correctly scoped the test strategy: 7–9 backend / 5–7 frontend with explicit lists of what NOT to test (migration SQL, DnD mouse events, CSS). The final test count (9 backend additions + 7 frontend = 16 total) hit the upper end of the target range without exceeding it.

### Build Phase Execution

- Phase 1 required no rework. The migration, repository, service, controller, and routes were delivered in a single sub-agent pass.
- Phase 2 similarly required no rework. The `reorderCard` API function, the `onDragEnd` same-column branch, and the `Board.reorder.test.tsx` file were all delivered in a single sub-agent pass.
- The build agents correctly applied learned rules from prior tasks (see Confirmed Rules Applied below), which contributed to the clean first-pass delivery.

### Memory Bank Effectiveness

The learned rules made a measurable difference in this task:

- **`testing-patterns`** rule "Mock @hello-pangea/dnd by capturing the `onDragEnd` callback via a module-level closure" was applied directly in `Board.reorder.test.tsx` (the `capturedOnDragEnd` variable on line 27).
- **`testing-patterns`** rule "write rollback test before async optimistic-update path" was followed — the revert test (AC-ERROR-1) is the first async-error test in the Phase 2 suite.
- **`architecture`** rule "atomic rollback via single `setState`" was applied — `setCards(snapshot)` is the entire revert, not a multi-step reversal.
- **`testing-patterns`** rule "scope queries to named landmark regions" was applied in `Board.reorder.test.tsx` — all card order assertions use `within(todoCol)` / `within(doneCol)` rather than bare `screen.getAllByRole`.

The only area where the Memory Bank could have helped but didn't is `frontend-design.md` — the reorder feature adds no new CSS, so the design token rules were irrelevant here. This is the expected and correct behavior (rules loaded contextually based on files touched).

### Suggested Ecosystem Improvements

1. **AC-ENTRY-2 class of edge case deserves a spec pattern**: The filter-index-mapping problem is an instance of a broader class: "Feature A and Feature B are each correct in isolation; their interaction introduces a non-obvious data-mutation order dependency." The Spec Writer Agent surfaced it here, but it would be useful to have a named prompt in the spec context file for "cross-feature interaction edge cases" to prompt the agent to enumerate such pairs whenever multiple interactive features share the same state slice.

2. **Reuse of error state across optimistic operations is a recurring simplification**: `cardCreateError` is now used for both card creation errors and reorder errors. If a third optimistic operation is added, a more systematic approach (e.g., a single `operationError` with a typed discriminant, or a small error queue) would be cleaner. A learned rule or a note in `systemPatterns.md` about this pattern's limits would help future tasks recognize when to upgrade.

3. **`position` as a DnD index is an implicit API contract**: The `PATCH /cards/:id/position` endpoint accepts a `position` that equals `destination.index` from the DnD library. This is undocumented outside the spec. A future non-DnD client (e.g., a keyboard reorder UI) would need to know this convention. The `techContext.md` API section or an OpenAPI annotation would be the right place to capture it.

---

## Key Learnings

### Extractable Learnings

**Learning 1**:
- Directive: When reordering a filtered subset of a list in state, build a `Set` of the rendered IDs, splice only the visible subarray, then reconstruct the full array by appending the hidden items — never compute filtered-to-full index offsets manually.
- Category: frontend-architecture
- Scope: `*.tsx`, `*.ts`, `frontend/src/**`
- Fits existing rule: yes → `agent-rules/_learned/frontend-architecture.md` (new bullet; no existing rule covers filtered-list splice pattern)

**Learning 2**:
- Directive: When two features share the same state slice and one filters it before the other mutates it, enumerate the interaction as an explicit acceptance criterion in the spec — do not defer it to implementation discovery.
- Category: architecture
- Scope: topics: ["architecture", "planning", "spec"]
- Fits existing rule: no → this is a planning/spec quality rule, not an architecture pattern. However it is process-level advice rather than a code directive. Consider adding to `architecture.md` as a spec-quality note rather than creating a new file.

**Learning 3**:
- Directive: When a single `role="alert"` element is reused for multiple independent optimistic operations (e.g., card create and card reorder), document the limitation with a code comment; if a third optimistic operation is added, introduce a typed error discriminant or error queue to prevent error stomp.
- Category: architecture
- Scope: `*.tsx`, `frontend/src/**`
- Fits existing rule: yes → `agent-rules/_learned/architecture.md` (extends the "atomic rollback via single setState" bullet with a note on shared error state)

---

## Confirmed Rules Applied

The following existing learned rules were applied in this task and remain valid:

| Rule | File | Applied Where |
|------|------|---------------|
| Mock @hello-pangea/dnd via captured `onDragEnd` closure | `testing-patterns.md` | `Board.reorder.test.tsx` line 27 — `capturedOnDragEnd` module-level variable |
| Write rollback test before implementing async optimistic-update path | `testing-patterns.md` | `Board.reorder.test.tsx` — AC-ERROR-1 revert test written before async path tested |
| Scope role/text queries to named landmark regions | `testing-patterns.md` | All card-order assertions use `within(todoCol)` / `within(doneCol)` |
| Atomic rollback via single `setState` | `architecture.md` | `Board.tsx` line 81 — `setCards(snapshot)` single call reverts entire reorder |
| `ValidationError` in service layer, imported to controller | `architecture.md` | Phase 1 `card.service.ts` validates `position` is non-negative integer, throws `ValidationError` |

---

## Next Steps

Run `/banyan-archive TASK-009` to push the feature branch and open a PR per the `push-and-pr` archive strategy configured in `memory-bank/projectbrief.md`. Before archiving, the three extractable learnings above should be merged into the learned rule files.
