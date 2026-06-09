---
name: "Learned: Architecture Patterns"
globs: ["src/services/*.ts", "src/controllers/*.ts"]
topics: ["architecture", "error-handling", "express", "backend"]
priority: low
evidence_count: 1
last_updated: 2026-06-09
auto_generated: true
---

# Architecture Patterns

- Define domain error classes (e.g., `ValidationError`) in the service layer and import them into controllers for `instanceof` discrimination — avoid duplicating error-type logic across layers.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| ValidationError in service layer, re-exported to controller | [reflection-TASK-002.md](../reflection/reflection-TASK-002.md) | 2026-06-09 |
