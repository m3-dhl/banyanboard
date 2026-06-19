---
name: Debugging Standards
globs: ["**/*"]
priority: high
---

# Debugging Standards

When a bug is reported in a specific component, column, state, or scenario:

1. **Search all occurrences first** — before writing any fix, grep the codebase for the same pattern, function, or logic that produces the bug. A bug in one place is evidence of a systemic pattern; assume it exists elsewhere until proven otherwise.

2. **Enumerate all trigger conditions** — list every input, state, prop combination, or runtime condition where the same bug could surface. Do not limit scope to the reported case.

3. **Map edge cases explicitly** — document edge cases before implementing:
   - All values/states at the boundary (min, max, empty, null, first, last)
   - Every UI location where the component renders (not just the one in the bug report)
   - All code paths through the faulty logic

4. **Fix must cover all cases** — the implementation must address every occurrence found in steps 1-3. A fix that only patches the reported instance is incomplete.

5. **Tests must cover all cases** — write tests for the reported case AND for every other occurrence and edge case identified. Test the rightmost column if the bug is positional. Test empty state, error state, and success state if the bug is stateful.

## Anti-pattern to avoid

> User reports: "Bug in DONE column"
> Agent fixes: only DONE column

Correct behavior:
> Agent finds: `left: anchorRect.left` with no clamp → affects ANY column near right edge
> Agent fixes: generic clamp applied to all positioning branches
> Agent tests: DONE column + any column with anchor > viewport - popoverWidth
