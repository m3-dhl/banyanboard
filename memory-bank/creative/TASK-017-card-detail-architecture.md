# Architecture Decision: Card Detail View — Markdown Library, Fetch Strategy, and Comment State

**Created**: 2026-06-19
**Status**: DECIDED
**Decision Type**: Architecture

---

## Context

### System Requirements

- Render Markdown descriptions inside a `CardDetailModal.tsx` portal without XSS risk
- Fetch card detail fields (`description`, `dueDate`) without breaking the existing board-load flow
- Display and post comments within the card detail modal
- New backend: 2 DB tables (`card_details`, `comments`), 4 new endpoints
- Frontend: `CardDetailModal.tsx` rendered as a ReactDOM portal into `document.body`

### Technical Constraints

- Stack is fixed: React/Vite frontend, TypeScript/Express backend, PostgreSQL
- Zero over-engineering (YAGNI principle); services/repositories added only when features need them
- Existing `Presentational Component Pattern`: components receive all data via props, no fetch logic inside them
- Existing portal pattern (`LabelPickerPopover`, `LabelManagementPanel`) for fixed overlays inside DnD containers — `CardDetailModal` will follow the same portal approach
- No external API dependencies; fully self-hosted
- Bundle size matters for a self-hosted tool that targets slow networks only incidentally, but initial page load < 2s on localhost is the NFR

### Non-Functional Requirements

- **Security**: No XSS from user-supplied Markdown; this is the primary security concern for this feature
- **Performance**: API p95 < 200ms; page load < 2s; no unnecessary network waterfalls
- **Accessibility**: WCAG 2.1 AA — modal must trap focus (existing `useFocusTrap` hook available), rendered HTML must have correct semantic structure
- **Scalability**: < 100 cards per board; single-team, self-hosted; no horizontal scale requirement
- **License**: MIT preferred (project has no license restrictions beyond that)
- **Maintainability**: Chosen libraries must be actively maintained; avoid abandoned packages

---

## Component Analysis

### Core Components

| Component | Purpose | Responsibilities |
|-----------|---------|------------------|
| `CardDetailModal.tsx` | Portal-rendered modal showing full card detail | Render description as Markdown, show due date, host comments thread, accept edit actions |
| `MarkdownRenderer.tsx` | Presentational sub-component | Convert Markdown string to safe HTML or React elements; no fetch logic |
| `CommentsThread.tsx` | Presentational sub-component | Render list of comments; post new comment via callback prop |
| `api.ts` additions | Network layer | `fetchCardDetail(id)`, `fetchComments(cardId)`, `postComment(cardId, body)`, `updateCardDetail(id, patch)` |
| `Board.tsx` | Stateful ancestor | May or may not own comments state (see Question 3 below) |

### Component Interactions

```
Board.tsx
  ├── holds cards[]  (already in place)
  ├── on card click → sets selectedCardId state
  └── renders CardDetailModal (portal)
        ├── fetches or receives description+dueDate
        ├── MarkdownRenderer (presentational — receives markdown string)
        └── CommentsThread (presentational or lightly stateful — see Question 3)
```

---

## Question 1: Markdown Renderer Library

### Option 1A: `marked` + DOMPurify

- **Description**: `marked` parses Markdown to an HTML string. The string is then sanitized with DOMPurify before being injected via `dangerouslySetInnerHTML`. Two libraries required.
- **Bundle size**: `marked` ~24 kB gzipped; `DOMPurify` ~6 kB gzipped. Total: ~30 kB.
- **XSS safety**: `marked` alone is NOT safe — it does not sanitize. DOMPurify adds an explicit sanitization layer. Safe when both are used together; dangerous if DOMPurify is omitted by a future maintainer.
- **React integration**: HTML string → `dangerouslySetInnerHTML`. Works but exposes the React escape hatch.
- **License**: MIT for both.
- **Maintenance**: Both actively maintained. `marked` is one of the most downloaded packages in the ecosystem.
- **Pros**:
  - Very mature, widely documented
  - DOMPurify is the de-facto standard HTML sanitizer
  - Both have excellent TypeScript types
- **Cons**:
  - Two packages to install and keep in sync
  - Requires `dangerouslySetInnerHTML` — a React escape hatch that suppresses React's XSS protection
  - XSS safety depends on the developer always remembering to pipe through DOMPurify; one missed call = vulnerability
  - DOMPurify adds a DOM dependency (requires `jsdom` in test environments)
- **Technical Fit**: Medium — works, but `dangerouslySetInnerHTML` is a pattern the codebase has not yet established
- **Complexity**: Low (install, sanitize, inject)
- **Scalability**: High (parsing is pure CPU; negligible at this scale)

### Option 1B: `micromark`

- **Description**: `micromark` is a low-level, spec-compliant (CommonMark) Markdown parser that produces HTML strings. It does not sanitize output. It is the underlying parser used by `remark`. Designed for tooling authors, not direct application use.
- **Bundle size**: ~15 kB gzipped (core only, without extensions).
- **XSS safety**: Not built-in. Requires DOMPurify just like `marked`.
- **React integration**: HTML string → `dangerouslySetInnerHTML` + DOMPurify.
- **License**: MIT.
- **Pros**:
  - Smallest raw bundle of the three parsers
  - Strictly compliant with the CommonMark specification
- **Cons**:
  - Low-level API — designed for tooling authors, not application developers
  - No sanitization; still needs DOMPurify
  - Less documentation and fewer examples for direct app use
  - Same `dangerouslySetInnerHTML` concern as Option 1A
  - Adding extensions (GFM tables, strikethrough, etc.) requires extra packages
- **Technical Fit**: Low — overkill as a build tool primitive; under-engineered for direct app use
- **Complexity**: Medium (low-level API, extension system to understand)
- **Scalability**: High

### Option 1C: `react-markdown`

- **Description**: `react-markdown` (powered by `remark` under the hood) parses Markdown and renders it directly to React elements without ever producing an HTML string. No `dangerouslySetInnerHTML` is used. XSS-safe by construction because React's own element system handles all escaping.
- **Bundle size**: `react-markdown` ~15 kB gzipped (includes `remark-parse`, `rehype-react`, `unified` core). DOMPurify is NOT needed.
- **XSS safety**: Safe by default. Because the output is React elements — not an HTML string — malicious `<script>` tags or event handlers are never inserted into the DOM. Custom renderers (via `components` prop) remain in React's control.
- **React integration**: Native. Returns JSX. No escape hatch.
- **License**: MIT.
- **Maintenance**: Actively maintained; ~2M weekly npm downloads; used by GitHub docs, Vercel docs, and many OSS projects.
- **Pros**:
  - XSS-safe by construction — no sanitization step required, no DOMPurify dependency
  - Native React elements — no `dangerouslySetInnerHTML`
  - Single package (vs two for the marked+DOMPurify combo)
  - Easy to customize via `components` prop (e.g., open links in new tab)
  - Supports GFM (tables, strikethrough, task lists) via `remark-gfm` plugin if needed later
  - Strong TypeScript types
- **Cons**:
  - Slightly larger than `marked` alone (~15 kB vs ~24 kB, but `marked`+DOMPurify is ~30 kB total — so `react-markdown` is actually smaller overall)
  - Remark/unified ecosystem can feel unfamiliar at first, but the `react-markdown` API surface is very simple for basic use
- **Technical Fit**: High — React-native output, no escape hatches, single dependency
- **Complexity**: Low (one package, simple `<ReactMarkdown>` component)
- **Scalability**: High

### Evaluation Matrix — Question 1

| Criteria | 1A: marked + DOMPurify | 1B: micromark | 1C: react-markdown |
|----------|------------------------|---------------|--------------------|
| Bundle size (gzipped) | ~30 kB (two packages) | ~15 kB + DOMPurify ~6 kB = ~21 kB | ~15 kB (no DOMPurify needed) |
| XSS safety | High (if DOMPurify always used) | Medium (easy to forget DOMPurify) | High by construction |
| React integration | Low (dangerouslySetInnerHTML) | Low (dangerouslySetInnerHTML) | High (native elements) |
| Maintainability | High | Medium | High |
| Implementation Cost | Low | Medium | Low |
| License | MIT | MIT | MIT |

### Decision — Question 1

**Chosen**: Option 1C — `react-markdown`

**Rationale**: `react-markdown` is the only option that is XSS-safe by construction without requiring a separate sanitization library. It is lighter on the wire than `marked + DOMPurify` (15 kB vs 30 kB gzipped). It integrates natively with React — no `dangerouslySetInnerHTML` escape hatch, no DOMPurify DOM dependency (which would complicate Vitest/jsdom test setup). The API is as simple as `<ReactMarkdown>{markdownString}</ReactMarkdown>`, which fits the project's zero-over-engineering principle.

**Trade-offs accepted**:
- The `remark`/`unified` ecosystem is less instantly recognizable than `marked`, but the `react-markdown` API surface that application code touches is trivial — no remark knowledge is needed for basic use.
- If GFM extensions (tables, task lists) are needed later, they require adding `remark-gfm` (a single additional package), which is a minor future cost.

---

## Question 2: Card Detail State Shape — Eager vs Lazy Fetch

### Option 2A: Eager — Enrich `GET /cards` with `description` and `dueDate`

- **Description**: The `GET /cards` endpoint is modified to include `description` and `dueDate` in every card object. `CardData` in `types.ts` gains optional `description?: string` and `dueDate?: string | null` fields. When a modal opens, no additional fetch is needed.
- **Architecture diagram**:
  ```
  Board mounts
    → GET /cards (returns [{id, title, columnId, labels, description, dueDate}, ...])
    → cards[] in Board.tsx state is fully enriched
    → User clicks card → modal opens instantly (no loading state)
    → modal reads card.description, card.dueDate from already-loaded state
  ```
- **Pros**:
  - Zero-latency modal open — no loading spinner, no waterfall
  - Simpler state management — modal receives a fully-typed `CardData` prop; no async logic inside modal
  - Fewer network requests over a session
  - `CardData` type stays the canonical shape; no dual-type complexity
- **Cons**:
  - `GET /cards` response grows as descriptions accumulate (each description could be hundreds of characters). With ~100 cards, this could be ~20–50 kB of text added to the initial load.
  - Every board load fetches all descriptions even when the user may never open any modal
  - Schema growth risk: if `CardData` keeps gaining optional fields, it becomes a grab-bag type
  - Changes to card detail schema require updating the list endpoint response and the `CardData` type
- **Technical Fit**: Medium — aligns with the existing pattern (Board.tsx does all fetching upfront), but grows the payload and the `CardData` type
- **Complexity**: Low
- **Scalability**: Low-Medium — acceptable at < 100 cards, but descriptions are unbounded text fields

### Option 2B: Lazy — `GET /cards` returns lightweight cards; `GET /cards/:id` fetches detail on modal open

- **Description**: `GET /cards` continues to return only `{ id, title, columnId, labels }` (current shape, unchanged). When a modal opens for card X, a separate `GET /cards/:id` call fetches `{ id, title, columnId, labels, description, dueDate, comments }`. Modal shows a brief loading state.
- **Architecture diagram**:
  ```
  Board mounts
    → GET /cards (lightweight — no description, no dueDate)
    → cards[] = [{id, title, columnId, labels}, ...]

  User clicks card X
    → modal opens, shows loading spinner
    → GET /cards/:id (returns full detail: description, dueDate)
    → modal renders content
  ```
- **Pros**:
  - `GET /cards` payload stays lean and stable regardless of description length
  - `CardData` type stays small and well-scoped (no optional detail fields polluting the list type)
  - Clean separation: list API returns list-appropriate fields; detail API returns detail-appropriate fields. This is the REST convention.
  - Schema growth is isolated: adding fields to card detail does not change the list endpoint or the list-level `CardData` type
  - Safer as the schema grows (the task description explicitly notes this concern)
- **Cons**:
  - Modal open triggers a network request → brief loading state required
  - Slightly more implementation work: `CardDetailModal` or its stateful ancestor must handle the fetch, loading, and error states
  - At `<100 cards per board` on `localhost`, the extra request is imperceptible (< 5ms round trip). But the loading state must still be coded.
- **Technical Fit**: High — follows REST conventions; matches the repo pattern (`CARD_WITH_LABELS_QUERY` already shows per-card queries are used internally)
- **Complexity**: Low-Medium (one additional fetch function, one loading state)
- **Scalability**: High — description payload isolated to on-demand fetches

### Option 2C: Hybrid — Eager basic fields, lazy comments

- **Description**: `GET /cards` adds `description` and `dueDate` (small scalar fields), but NOT comments (unbounded relation). Comments are always lazy-fetched on modal open.
- **Pros**: Instant modal with description/due-date; comments load separately
- **Cons**: `CardData` still grows; still requires a loading state for comments; two fetch patterns to maintain
- **Technical Fit**: Medium
- **Complexity**: Medium (two fetch strategies, dual loading states)
- **Scalability**: Medium

### Evaluation Matrix — Question 2

| Criteria | 2A: Eager (all in GET /cards) | 2B: Lazy (GET /cards/:id on open) | 2C: Hybrid |
|----------|-------------------------------|-----------------------------------|------------|
| Implementation simplicity | High | Medium | Low |
| Schema growth safety | Low | High | Medium |
| Network efficiency | Low (fetches unused descriptions) | High (fetches only on demand) | Medium |
| Modal UX (loading state) | None needed | Brief spinner | Two loading states |
| REST convention alignment | Low | High | Medium |
| Type safety/cleanliness | Low (pollutes CardData) | High (separate DetailData type) | Medium |

### Decision — Question 2

**Chosen**: Option 2B — Lazy fetch via `GET /cards/:id`

**Rationale**: The task description explicitly notes "which is safer as the schema grows?" — Option 2B wins this decisively. Descriptions are unbounded text. If each of the ~100 cards has a 500-character description, that is ~50 kB of data fetched on every board load, whether or not the user opens any modal. More critically, Option 2A causes the `CardData` type to accumulate optional fields for every new detail-level concept (description, dueDate, and any future additions like attachments, subtasks). This violates the principle of a clean, minimal list type.

Option 2B follows REST conventions correctly: the list endpoint returns list-appropriate fields; the detail endpoint returns the full resource. A brief loading state in the modal is a trivially small UX cost at this scale (< 100 cards, self-hosted, local network).

**Trade-offs accepted**:
- Modal open shows a loading spinner for the network round trip. At local/LAN latency this is imperceptible, but the spinner must be coded. This is acceptable given the schema safety benefit.
- `fetchCardDetail(id)` must be added to `api.ts` and the modal (or its stateful ancestor) must handle loading/error states. This is a small but real implementation cost.

**New type to introduce in `types.ts`**:
```typescript
export interface CardDetail {
  id: string
  title: string
  columnId: ColumnId
  labels: Label[]
  description: string | null
  dueDate: string | null  // ISO 8601 date string
}
```
`CardData` (the list type) remains unchanged.

---

## Question 3: Comment State Ownership

### Background — Presentational Component Pattern Analysis

The `systemPatterns.md` Presentational Component Pattern states:

> "Components receive all data via props and own no fetch logic. State lives in the nearest stateful ancestor (currently `Board.tsx`) and is passed down."

This pattern was established for `ActivityFeed`, `Column`, `FilterBar`, and `LabelPickerPopover` — all of which are rendered as part of the permanent board UI. The question is whether `CardDetailModal`, which is a contextually-opened overlay with its own lifecycle, qualifies as its own "nearest stateful ancestor" for comment data.

### Option 3A: Comments owned locally within `CardDetailModal.tsx`

- **Description**: `CardDetailModal` manages its own `comments` state. On mount, it fires `GET /cards/:id/comments`. When a new comment is posted, it fires `POST /cards/:id/comments` and updates local state. `Board.tsx` has no knowledge of comments.
- **Architecture diagram**:
  ```
  Board.tsx
    └── <CardDetailModal cardId={selectedCardId}>
          ├── [local state] comments: Comment[]
          ├── [local state] commentsLoading: boolean
          ├── useEffect: fetchComments(cardId) on mount
          ├── onPostComment(): POST + setComments(...)
          └── <CommentsThread comments={comments} onPost={onPostComment} />
  ```
- **Relationship to Presentational Pattern**: `CardDetailModal` IS the nearest stateful ancestor for comment data. The pattern says "state lives in the nearest stateful ancestor" — `CardDetailModal` is that ancestor for its own sub-data. `Board.tsx` is not a justified ancestor for data that only exists when a specific modal is open.
- **Pros**:
  - Clean encapsulation — `Board.tsx` remains focused on board-level state (cards, labels, columns, activity feed); it does not grow to own transient modal sub-data
  - Comment state lifecycle is tied to modal lifecycle (unmounts when modal closes — automatically freed)
  - `CommentsThread` remains fully presentational (receives comments via props, emits events via callbacks)
  - Easier to test: `CardDetailModal` can be tested in isolation with mock fetch
  - No prop-drilling of comments through Board → CardDetailModal
  - Consistent with how `LabelManagementPanel` manages its own interaction state
- **Cons**:
  - `CardDetailModal` breaks the strict reading of the Presentational Component Pattern (it owns fetch logic)
  - If a future feature requires Board-level awareness of comment counts or unread badges, this state would need to be lifted later
- **Technical Fit**: High — `CardDetailModal` is a self-contained feature boundary, not a reusable presentational widget
- **Complexity**: Low
- **Scalability**: High

### Option 3B: Comments owned in `Board.tsx`

- **Description**: `Board.tsx` fetches all comments (or comments for the selected card) and passes them down as props. `Board.tsx` owns `comments: Record<string, Comment[]>` in state. It is the single source of truth for comment data.
- **Architecture diagram**:
  ```
  Board.tsx
    ├── [state] comments: Record<cardId, Comment[]>
    ├── onCardOpen(cardId): fetchComments(cardId) → setComments(...)
    ├── onPostComment(cardId, body): POST + setComments(...)
    └── <CardDetailModal comments={comments[selectedCardId]} onPost={onPostComment} />
  ```
- **Pros**:
  - Strictly follows the Presentational Pattern — `CardDetailModal` is purely presentational (receives everything via props)
  - Board holds all state; consistent with how labels are managed today
  - If comment counts are needed on the board later (e.g., badge on card), the data is already in Board state
- **Cons**:
  - `Board.tsx` is already a large stateful component (8 state variables, 5 async handlers). Adding comment fetch logic and a `Record<string, Comment[]>` makes it significantly heavier for data that is only relevant when a modal is open.
  - Comments are modal-scoped data that have no meaning to the board view. Keeping them in Board state is a misapplication of the "nearest stateful ancestor" principle — `Board.tsx` is not the nearest ancestor for modal-specific data; it is just the only current ancestor.
  - When the modal is closed, comment state remains in Board memory unnecessarily.
  - Comment-count badge is a speculative future requirement; YAGNI applies.
- **Technical Fit**: Medium — technically consistent with the strict Presentational Pattern, but semantically wrong (Board owns data it never uses)
- **Complexity**: Medium (Board grows larger; comment state tied to Board lifecycle)
- **Scalability**: Low-Medium (Board state grows with every card that is opened)

### Evaluation Matrix — Question 3

| Criteria | 3A: Comments in CardDetailModal | 3B: Comments in Board.tsx |
|----------|---------------------------------|---------------------------|
| Encapsulation | High | Low (Board grows unbounded) |
| Pattern compliance (strict reading) | Medium (justified exception) | High |
| Implementation complexity | Low | Medium |
| Memory efficiency | High (freed on modal close) | Low (persists in Board state) |
| Board.tsx complexity growth | None | Significant |
| Future extensibility | High (easy to lift if needed) | Medium |

### Decision — Question 3

**Chosen**: Option 3A — Comments owned locally within `CardDetailModal.tsx`

**Pattern compliance note (deviation from strict Presentational Pattern)**: The Presentational Component Pattern was designed for the permanent board UI components (`Column`, `ActivityFeed`, `FilterBar`) that are always mounted and whose data flows naturally from Board. `CardDetailModal` is a contextually-opened overlay with its own lifecycle. It is itself the "nearest stateful ancestor" for comment data — the pattern's intent is satisfied, not violated, by Option 3A. The key principle is that *presentational* sub-components (`CommentsThread`, `MarkdownRenderer`) remain prop-driven and fetch-free. `CardDetailModal` itself is a stateful container for its feature boundary, analogous to how `Board.tsx` is a stateful container for the board feature boundary.

This is a documented deviation: `CardDetailModal.tsx` is classified as a **stateful feature container** (like `Board.tsx`), not a presentational component. The `systemPatterns.md` should be updated to reflect this pattern as: "Presentational sub-components receive all data via props; stateful feature containers own fetch logic for their feature scope."

**Trade-offs accepted**:
- Strict reading of the Presentational Pattern is relaxed for feature containers. This is explicitly documented here and in `systemPatterns.md`.
- If a future feature needs comment counts on the board card (e.g., a badge), state will need to be lifted to `Board.tsx`. At that point, the refactor is straightforward: move the fetch up and pass counts down as props.

---

## Observability Architecture

This is a frontend-heavy feature. Observability applies primarily to the new backend endpoints.

### Logging

- **Library**: Existing structured logger in the Express backend (aligned with CLAUDE.md standards)
- **Format**: Structured JSON with traceId, spanId, service, version fields
- **Configuration**: `LOG_LEVEL`, `LOG_FORMAT`, `LOG_OUTPUT` environment variables (existing pattern)
- **Scope**: New `card.controller.ts` additions (`getCardDetail`, `getComments`, `postComment`, `updateCardDetail`) must use structured logger — no `console.log`

### Distributed Tracing

- **SDK**: OpenTelemetry (W3C Trace Context)
- **Service Boundaries**:

  | From | To | Protocol | Propagation Method |
  |------|----|----------|--------------------|
  | React frontend | Express backend (`GET /cards/:id`) | HTTP | Standard fetch (traceparent not injected in MVP — frontend has no OTel SDK yet) |
  | Express backend | PostgreSQL | TCP | pg driver spans via OTel pg instrumentation |

- **Note**: Frontend OTel tracing is out of scope for this task. Backend spans for the new endpoints follow the existing pattern.

### Metrics

- **Standard Metrics** (existing backend middleware):
  - `http_requests_total{method, route, status_code}` — covers new routes automatically
  - `http_request_duration_seconds{method, route}` — covers new routes automatically
- **Custom Business Metrics** (optional, not required for MVP):
  - `card_detail_fetches_total` — usage signal for modal opens

### Configuration Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `LOG_LEVEL` | Log verbosity | `info` |
| `LOG_FORMAT` | Output format | `json` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector endpoint | — |
| `OTEL_SERVICE_NAME` | Service identifier | `banyanboard-backend` |
| `OTEL_TRACES_SAMPLER_ARG` | Sampling ratio | `1.0` (dev) |

---

## Summary Decision Table

| Question | Decision | Rationale |
|----------|----------|-----------|
| Markdown library | `react-markdown` (~15 kB gzipped) | XSS-safe by construction, native React elements, single dependency, smallest total bundle |
| Card detail fetch strategy | Lazy — `GET /cards/:id` on modal open | Schema-safe, REST-correct, keeps `CardData` type clean, tiny UX cost |
| Comment state ownership | Local to `CardDetailModal.tsx` | `CardDetailModal` is a stateful feature container; encapsulation > strict prop-drilling; Board.tsx stays focused |

---

## Implementation Guidelines

1. **Install `react-markdown`** (no DOMPurify needed). Create `MarkdownRenderer.tsx` as a thin presentational wrapper: `<ReactMarkdown className="markdown-body">{content ?? ''}</ReactMarkdown>`. Apply CSS prose styles to `.markdown-body`.

2. **Add `CardDetail` interface** to `types.ts` without modifying `CardData`. Add `fetchCardDetail(id: string): Promise<CardDetail>` to `api.ts` following the existing pattern (same error-checking, same base URL).

3. **`CardDetailModal.tsx`** is a stateful feature container. It owns three state variables: `detail: CardDetail | null`, `detailLoading: boolean`, `comments: Comment[]`. It fires `fetchCardDetail(cardId)` and `fetchComments(cardId)` in a single `useEffect` on mount. Use `Promise.allSettled` so a comments failure does not block description rendering.

4. **`CommentsThread.tsx`** is fully presentational — receives `comments: Comment[]` and `onPost: (body: string) => Promise<void>`. It does not call `fetch`.

5. **Backend**: Add `GET /cards/:id` (full detail), `GET /cards/:id/comments`, `POST /cards/:id/comments`, `PATCH /cards/:id` (update description/dueDate) to `card.routes.ts`. Follow the existing pattern: route → controller → repository. No service layer needed unless business validation is required.

6. **Portal rendering**: Use `ReactDOM.createPortal(modal, document.body)` consistent with `LabelPickerPopover`. Apply `useFocusTrap` hook (already in `frontend/src/hooks/useFocusTrap.ts`) for WCAG 2.1 AA compliance.

7. **Loading state**: Modal renders a skeleton or spinner while `detailLoading === true`. Error state renders an inline error message (consistent with existing `cardCreateError` pattern in Board.tsx).

8. **No `dangerouslySetInnerHTML`**: The Markdown renderer must use `react-markdown` elements only. If a custom renderer is ever needed, it must remain within React's element model.

---

## Validation Checklist

- [x] Meets all system requirements (modal, Markdown, due date, comments)
- [x] Respects technical constraints (no new stack changes, TypeScript strict, YAGNI)
- [x] Addresses non-functional requirements (XSS safety, accessibility via useFocusTrap, performance via lazy fetch)
- [x] Technically feasible with current stack
- [x] Risks identified and acceptable
- [x] Complies with Guiding Principles in systemPatterns.md — deviation for CardDetailModal as stateful container explicitly documented
- [x] Respects established patterns (portal pattern, Repository Pattern, Error Handling Pattern, useFocusTrap)
- [x] Observability architecture defined
- [x] Logging strategy consistent with CLAUDE.md observability standards
- [x] Metrics strategy: new routes covered by existing middleware automatically

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| XSS via Markdown if library is swapped or bypassed | Low | High | `react-markdown` chosen specifically for construction-time safety; document in `systemPatterns.md` that `dangerouslySetInnerHTML` is banned for Markdown rendering |
| `CardDetailModal` stateful pattern spreads uncontrolled | Low | Medium | Document the two-tier pattern (stateful container vs presentational) explicitly in `systemPatterns.md`; code review gate |
| Lazy fetch adds visible latency on poor localhost setup | Low | Low | Skeleton loading state hides perceived latency; at LAN speeds this is < 10ms |
| `description` unbounded text causes slow DB reads | Low | Low | Add `TEXT` column with no server-side size limit; at < 100 cards this is negligible |
| Comment state drift if modal is opened/closed rapidly | Low | Medium | Cancel inflight fetch on unmount via `AbortController` in `useEffect` cleanup |

---

## Next Steps

1. Update `memory-bank/systemPatterns.md` to add the "Stateful Feature Container" pattern distinguishing `Board.tsx` and `CardDetailModal.tsx` from presentational components.
2. Install `react-markdown` in `frontend/`.
3. Add `CardDetail` and `Comment` interfaces to `frontend/src/types.ts`.
4. Add `fetchCardDetail`, `fetchComments`, `postComment`, `updateCardDetail` to `frontend/src/api.ts`.
5. Create DB migrations: `card_details` (description, dueDate as nullable columns on `cards` or a join table), `comments` (id, cardId, body, createdAt).
6. Implement backend: repository functions → controllers → routes (4 endpoints).
7. Implement `CardDetailModal.tsx`, `MarkdownRenderer.tsx`, `CommentsThread.tsx`.
8. Wire `Board.tsx`: add `selectedCardId: string | null` state; render `CardDetailModal` conditionally.
