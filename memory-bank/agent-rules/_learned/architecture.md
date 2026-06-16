---
name: "Learned: Architecture Patterns"
globs: ["src/services/*.ts", "src/controllers/*.ts", "src/config/*.ts", "app.ts"]
topics: ["architecture", "error-handling", "express", "backend", "middleware"]
priority: low
evidence_count: 3
last_updated: 2026-06-16
auto_generated: true
---

# Architecture Patterns

- Define domain error classes (e.g., `ValidationError`) in the service layer and import them into controllers for `instanceof` discrimination — avoid duplicating error-type logic across layers.
- Mount cross-cutting Express middleware (CORS, rate-limiting, compression) as the first `app.use()` call before body parsers and routers to ensure it intercepts all requests including OPTIONS preflight.
- For optimistic UI updates that touch multiple state arrays, derive the rollback target from the client-generated UUID and filter all affected arrays in a single `setState` call to keep rollback atomic.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| ValidationError in service layer, re-exported to controller | [reflection-TASK-002.md](../reflection/reflection-TASK-002.md) | 2026-06-09 |
| CORS middleware must be first app.use() to catch OPTIONS preflight | [reflection-TASK-003.md](../reflection/reflection-TASK-003.md) | 2026-06-09 |
| Atomic rollback across multiple state arrays via single setState + UUID filter | [reflection-TASK-007.md](../reflection/reflection-TASK-007.md) | 2026-06-16 |
