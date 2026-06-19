---
name: "Learned: UI Positioning"
globs: ["src/components/**/*.tsx", "frontend/src/**/*.tsx"]
topics: ["ui", "positioning", "portal", "popover"]
priority: low
evidence_count: 1
last_updated: 2026-06-19
auto_generated: true
---

# UI Positioning

- Fixed-position popovers anchored to page elements must clamp their horizontal position: `left = Math.min(anchorLeft, window.innerWidth - popoverWidth - margin)` — apply to both open-below and open-above branches to prevent off-screen overflow in rightmost columns.
- Portal-rendered components (ReactDOM.createPortal) require viewport-coordinate mocking in tests (`window.innerWidth`, `getBoundingClientRect` mock); test all column positions (leftmost and rightmost) explicitly.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| TASK-016: DONE column picker unreachable — no horizontal clamping | [reflection-TASK-014.md](../reflection/reflection-TASK-014.md) | 2026-06-19 |
