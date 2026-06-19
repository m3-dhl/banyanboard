---
name: "Learned: Testing Patterns"
globs: ["*.test.ts", "*.spec.ts", "*.test.tsx", "*.spec.tsx"]
topics: ["testing", "express", "backend", "react", "frontend", "vitest"]
priority: medium
evidence_count: 9
last_updated: 2026-06-19
auto_generated: true
---

# Testing Patterns

- Export Express app from a standalone module (e.g., `app.ts`) and keep HTTP `listen()` in a separate entry point (`server.ts`) so integration tests can import the app without binding a port.
- Use `jest.resetAllMocks()` / `vi.restoreAllMocks()` in `beforeEach`/`afterEach` and define shared fixture objects once at the top of the test file to prevent state leakage between test cases.
- Mock @hello-pangea/dnd by capturing the `onDragEnd` callback via a module-level closure and invoking it inside `act()` — do not simulate mouse or pointer events to trigger drag-and-drop state changes.
- When adding a new always-visible UI section to an existing component, scope all existing role/text queries in that component's tests to named landmark regions to prevent false matches against the new section.
- When adding async optimistic-update with rollback to a component, write the rollback test (pending item removed on API error) before implementing the async path — it pins the exact state shape needed for clean rollback.
- In Express controllers, guard custom error classes with both `instanceof` and `.name === 'ClassName'` checks; Jest module isolation can reconstruct error objects on a different prototype chain, causing `instanceof` to return false for the correct class.
- When adding a new user-facing concern to an existing component (e.g., deletion to `Card.tsx`), create a new `Component.concern.test.tsx` rather than extending the existing test file — prevents query-scope conflicts and scopes test intent without requiring region narrowing.
- When fixing a broken API URL, search for mock handlers in test files that reference the old URL and update them in the same commit to keep the test suite green.
- Wrap `vi.useFakeTimers()` setup in a dedicated `describe` block with `afterEach(() => vi.useRealTimers())` to prevent fake timer state from leaking into sibling test blocks in the same file.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| Express app/server split for supertest | [reflection-TASK-001.md](../reflection/reflection-TASK-001.md) | 2026-06-09 |
| jest.resetAllMocks + shared fixtures prevent test state leakage | [reflection-TASK-002.md](../reflection/reflection-TASK-002.md) | 2026-06-09 |
| @hello-pangea/dnd mock via captured onDragEnd closure + act() | [reflection-TASK-005.md](../reflection/reflection-TASK-005.md) | 2026-06-16 |
| Scope existing component test queries to named regions before adding new always-visible sections | [reflection-TASK-006.md](../reflection/reflection-TASK-006.md) | 2026-06-16 |
| Write rollback test before implementing async optimistic-update | [reflection-TASK-007.md](../reflection/reflection-TASK-007.md) | 2026-06-16 |
| Dual instanceof/name guard for custom errors in controllers (Jest module isolation) | [reflection-TASK-008.md](../reflection/reflection-TASK-008.md) | 2026-06-16 |
| Create Component.concern.test.tsx for new concerns vs. extending existing test file | [reflection-TASK-012.md](../reflection/reflection-TASK-012.md) | 2026-06-17 |
| Update mock handlers referencing old API URL in same commit as the route fix | [reflection-TASK-013.md](../reflection/reflection-TASK-013.md) | 2026-06-19 |
| vi.useFakeTimers() in describe block with afterEach(vi.useRealTimers) to prevent timer state leak | [reflection-TASK-017.md](../reflection/reflection-TASK-017.md) | 2026-06-19 |
