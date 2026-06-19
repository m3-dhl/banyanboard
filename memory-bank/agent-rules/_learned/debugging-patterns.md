---
name: "Learned: Debugging Patterns"
globs: ["frontend/src/**", "src/components/**", "**/*.tsx", "**/*.ts"]
topics: ["debugging", "regression", "api"]
priority: low
evidence_count: 1
last_updated: 2026-06-19
auto_generated: true
---

# Debugging Patterns

- When a user reports "feature X broke after change Y", verify backend API health (network tab / server logs for 4xx/5xx) before assuming a code regression — API failures causing optimistic-update reversions are visually indistinguishable from broken UI logic without a health check.
- Browser automation is a valid mid-investigation diagnostic tool (not just post-build UAT); use it early when the reported behavior is hard to reproduce in unit tests.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| TASK-015: backend SASL error masked as label-add regression | [reflection-TASK-014.md](../reflection/reflection-TASK-014.md) | 2026-06-19 |
