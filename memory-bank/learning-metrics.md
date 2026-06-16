# Learning Metrics

## Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Max learned rule files | 10 | Hard cap on files in `agent-rules/_learned/` |
| Expiry period (days) | 90 | Remove unreinforced bullets after this period |
| Promotion threshold | 3 | Promote to `medium` priority at this evidence count |
| Max bullets per file | 15 | Prune to 10 most-evidenced when exceeded |

## Task History

| Task ID | Date | Learnings Extracted | Rules Amended | Rules Created |
|---------|------|--------------------:|-------------:|-------------:|
| TASK-001 | 2026-06-09 | 1 | 0 | 1 |
| TASK-002 | 2026-06-09 | 2 | 1 | 1 |
| TASK-003 | 2026-06-09 | 1 | 1 | 0 |
| TASK-004 | 2026-06-16 | 0 | 0 | 0 |
| TASK-005 | 2026-06-16 | 2 | 1 | 1 |
| TASK-006 | 2026-06-16 | 1 | 1 | 0 |

## Rule Effectiveness

| File | Topics | Evidence Count | Priority | Last Updated |
|------|--------|---------------:|:--------:|:------------:|
| testing-patterns.md | testing, express, backend, react, frontend, vitest | 4 | medium | 2026-06-16 |
| architecture.md | architecture, error-handling, express, backend, middleware | 2 | low | 2026-06-09 |
| frontend-architecture.md | frontend, react, typescript, vite, architecture | 1 | low | 2026-06-16 |

## Consolidation History

| Date | Rules Before | Rules After | Merged | Expired | Promoted |
|------|------------:|------------:|-------:|--------:|---------:|
| 2026-06-09 | 2 | 2 | 0 | 0 | 0 |
| 2026-06-16 | 2 | 2 | 0 | 0 | 0 |
| 2026-06-16 | 3 | 3 | 0 | 0 | 1 |
