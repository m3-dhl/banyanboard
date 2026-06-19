---
name: "Learned: Security Patterns"
globs: ["*.tsx", "*.ts", "frontend/src/**", "*.test.tsx", "*.test.ts"]
topics: ["security", "xss", "testing", "frontend", "markdown"]
priority: medium
evidence_count: 1
last_updated: 2026-06-19
auto_generated: true
---

# Security Patterns

- Verify XSS safety of Markdown renderers with an explicit jsdom assertion (`expect(container.querySelector('script')).toBeNull()`) on a `<script>alert(1)</script>` payload — do not rely on library documentation alone.

## Evidence

| Learning | Source | Date |
|----------|--------|------|
| XSS assertion for Markdown renderer via jsdom querySelector('script') | [reflection-TASK-017.md](../reflection/reflection-TASK-017.md) | 2026-06-19 |
