---
name: "Learned: Frontend Architecture Patterns"
globs: ["*.tsx", "*.ts", "frontend/src/**"]
topics: ["frontend", "react", "typescript", "vite", "architecture"]
priority: low
evidence_count: 1
last_updated: 2026-06-16
auto_generated: true
---

# Frontend Architecture Patterns

- Declare column/zone identifiers as a TypeScript string union type (e.g., `type ColumnId = 'todo' | 'in-progress' | 'done'`) rather than an enum so droppableId strings from the DnD library can be cast to the type without an import.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| ColumnId string union enables clean DnD cast without import | [reflection-TASK-005.md](../reflection/reflection-TASK-005.md) | 2026-06-16 |
