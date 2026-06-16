---
name: "Learned: Frontend Architecture Patterns"
globs: ["*.tsx", "*.ts", "frontend/src/**"]
topics: ["frontend", "react", "typescript", "vite", "architecture", "dnd", "accessibility"]
priority: low
evidence_count: 3
last_updated: 2026-06-16
auto_generated: true
---

# Frontend Architecture Patterns

- Declare column/zone identifiers as a TypeScript string union type (e.g., `type ColumnId = 'todo' | 'in-progress' | 'done'`) rather than an enum so droppableId strings from the DnD library can be cast to the type without an import.
- Use `ReactDOM.createPortal(popover, document.body)` for any popover that opens from inside a @hello-pangea/dnd Draggable; the Draggable CSS transform creates a stacking context that clips `position: absolute` descendants.
- Scope Escape key listeners to the container element (not `document`) in components that coexist with @hello-pangea/dnd to prevent intercepting the dnd library's own keyboard drag-cancel handler.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| ColumnId string union enables clean DnD cast without import | [reflection-TASK-005.md](../reflection/reflection-TASK-005.md) | 2026-06-16 |
| ReactDOM portal for dnd-adjacent popover (stacking context escape) | [reflection-TASK-008.md](../reflection/reflection-TASK-008.md) | 2026-06-16 |
| Escape key listener scoped to container in dnd-adjacent components | [reflection-TASK-008.md](../reflection/reflection-TASK-008.md) | 2026-06-16 |
