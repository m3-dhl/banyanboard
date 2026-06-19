---
name: "Learned: API Design"
globs: ["frontend/src/api.ts", "src/api/**/*.ts", "**/*.ts"]
topics: ["api-design", "frontend", "routes", "http"]
priority: low
evidence_count: 1
last_updated: 2026-06-19
auto_generated: true
---

# API Design

- When adding or changing frontend API calls, verify the route path against the actual backend router mount point before assuming a nested path exists.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| Frontend called `/boards/:id/labels` but backend mounted at `/labels` — caused silent 404 | [reflection-TASK-013.md](../reflection/reflection-TASK-013.md) | 2026-06-19 |
