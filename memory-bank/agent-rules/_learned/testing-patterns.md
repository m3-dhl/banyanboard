---
name: "Learned: Testing Patterns"
globs: ["*.test.ts", "*.spec.ts", "*.test.tsx", "*.spec.tsx"]
topics: ["testing", "express", "backend"]
priority: low
evidence_count: 2
last_updated: 2026-06-09
auto_generated: true
---

# Testing Patterns

- Export Express app from a standalone module (e.g., `app.ts`) and keep HTTP `listen()` in a separate entry point (`server.ts`) so integration tests can import the app without binding a port.
- Use `jest.resetAllMocks()` in `beforeEach` and define shared fixture objects once at the top of the test file to prevent state leakage between test cases.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| Express app/server split for supertest | [reflection-TASK-001.md](../reflection/reflection-TASK-001.md) | 2026-06-09 |
| jest.resetAllMocks + shared fixtures prevent test state leakage | [reflection-TASK-002.md](../reflection/reflection-TASK-002.md) | 2026-06-09 |
