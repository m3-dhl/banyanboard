# Architecture Decision: Card Labels

**Created**: 2026-06-16
**Status**: DECIDED
**Decision Type**: Architecture

---

## Context

### System Requirements

- Labels must be creatable, listable, and deletable per board
- Labels must be attachable to and detachable from individual cards
- `GET /cards` must return each card's associated labels inline
- Deleting a label must cascade — all `card_labels` associations for that label are removed automatically
- Filter use case: "show cards that carry label X" — the data model must support an efficient query for this

### Technical Constraints

- Express + TypeScript + PostgreSQL (pg driver, parameterized queries only — no ORM)
- Clean architecture: routes → controllers → services → repositories
- Must follow existing file/naming conventions: `label.routes.ts`, `label.controller.ts`, `label.service.ts`, `label.repository.ts`, `label.types.ts`
- Migration filename is `003_create_labels.sql`; runner executes migrations in filename order at startup
- No auth or multi-tenancy in scope
- Cards table currently has: `id` (UUID), `title` (VARCHAR 100), `column_id` (VARCHAR 20), `created_at` (TIMESTAMPTZ). No `board_id` column on cards yet — the task scope must address this gap for board-scoped label queries.
- `ValidationError` and `AppError`/`NotFoundError` base classes already exist in `src/errors/`

### Non-Functional Requirements

- API p95 < 200ms for all label and card endpoints
- Scale: 2–15 concurrent users, hundreds of cards per board, dozens of boards per instance
- No horizontal scaling requirement — PostgreSQL with appropriate indexes is sufficient
- Cascade delete: removing a label removes all card associations for that label
- Validation: empty `name` → 400, invalid color hex (not matching `#[0-9a-fA-F]{6}`) → 400, duplicate `name` per board → 400
- WCAG 2.1 AA — color-only labeling must be supplemented with names (already satisfied by requiring `name` field)

---

## Component Analysis

### Core Components

| Component | Purpose | Responsibilities |
|-----------|---------|------------------|
| `label.types.ts` | Shared TypeScript interfaces | `Label`, `CreateLabelDto`, `AttachLabelDto` |
| `label.repository.ts` | Database queries | CRUD for `labels`; join-table operations for `card_labels`; fetch labels by card |
| `label.service.ts` | Business logic + validation | Validate name/color, enforce uniqueness per board, delegate to repository |
| `label.controller.ts` | HTTP request/response | Parse request, call service, map to HTTP response codes |
| `label.routes.ts` | Express router | Mount label routes; mount card-label sub-routes; wire to `app.ts` |
| `003_create_labels.sql` | DDL migration | Create `labels` table and `card_labels` join table with constraints and indexes |
| `card.repository.ts` (extended) | Card queries | Extend `getCards()` to JOIN and aggregate labels per card |

### Component Interactions

```
HTTP Request
    │
    ▼
label.routes.ts ──────────────────────────────────────────
    │                                                      │
    ▼ (label CRUD)                            ▼ (card-label attach/detach)
label.controller.ts                        label.controller.ts
    │                                                      │
    ▼                                                      ▼
label.service.ts ◄──────────────────────────────────────────
    │
    ▼
label.repository.ts
    │
    ▼
PostgreSQL (labels + card_labels tables)

card.routes.ts → card.controller.ts → card.service.ts → card.repository.ts
                                                              │ (JOIN labels)
                                                              ▼
                                                         labels + card_labels
```

---

## Options Explored

### Option A: Global Board Palette (Two-Table: `labels` + `card_labels`)

**Description**: Labels are entities scoped to a board. The `labels` table stores the canonical definition (name, color, board_id). A join table `card_labels` links cards to labels by reference. Cards share labels from the board's palette — a "Bug" label defined once is attached to N cards.

**Architecture Diagram**:
```
boards ──────┐
             │ board_id FK
labels ──────┤
  id         │
  name       │           card_labels
  color      │          ┌──────────┐
  board_id ──┘          │ card_id  │──── cards
  created_at            │ label_id │──── labels (FK, ON DELETE CASCADE)
                        └──────────┘
```

**Pros**:
- Single source of truth for label definitions — rename or recolor a label, all cards reflect it immediately
- Filter query is clean and indexed: `SELECT card_id FROM card_labels WHERE label_id = $1`
- Cascade delete is declarative: `ON DELETE CASCADE` on `card_labels.label_id` FK — zero application logic needed
- Duplicate name per board is enforced by a UNIQUE constraint: `UNIQUE(name, board_id)`
- Scales naturally: hundreds of labels, thousands of card associations — standard relational join performance
- Aligns with how Trello, Planka, and similar tools model labels

**Cons**:
- Slightly more complex DDL (two tables) — minor
- `GET /cards` requires a JOIN or subquery to include labels — addressed in design below

**Technical Fit**: High — perfectly matches the existing pg/repository/migration pattern
**Complexity**: Low — two small tables, standard SQL
**Scalability**: High — normalized, indexed, cascades handled by the DB engine

---

### Option B: Per-Card Ad-Hoc Labels (Single Table, No Sharing)

**Description**: Labels are created inline on each card and stored directly in a `card_labels` table with name + color columns. No board-level palette. Each card independently owns its label records.

**Architecture Diagram**:
```
cards ────── card_labels
              id
              card_id (FK)
              name
              color
              created_at
```

**Pros**:
- Simpler DDL — one table
- No concept of "label management" needed; labels appear as free-form tags

**Cons**:
- Renaming a label requires updating every card's row individually — no shared reference
- Filter by label requires matching on `name` (string equality) or `color` across all cards — fragile, error-prone, cannot use a FK index
- Duplicate labels per card (same name/color) allowed unless enforced with a UNIQUE constraint that doesn't map to UX intent
- No central palette means no `GET /labels?boardId=:id` endpoint is meaningful — the required API contract cannot be cleanly satisfied
- Required endpoint `DELETE /labels/:id` has no corresponding "label entity" to delete by ID — the design doesn't fit the specified API

**Technical Fit**: Low — the required API shape presupposes label entities with IDs
**Complexity**: Medium — simpler DDL but messier application logic for filter and consistency
**Scalability**: Medium — string-match filtering does not index well at volume

---

### Option C: Color-Only Tags (No Name, No Palette)

**Description**: Labels are just color tags stored at the card level. `card_labels` stores `(card_id, color)` as a composite PK. Color values are constrained to a predefined set. No label names, no management UI.

**Architecture Diagram**:
```
cards ────── card_labels
              card_id (FK, PK)
              color   (PK)
```

**Pros**:
- Minimal DDL — one tiny table
- Filter by color is straightforward and indexable

**Cons**:
- WCAG 2.1 AA accessibility: color-only labeling fails accessibility requirements (users cannot distinguish labels without color perception)
- Predefined color set cannot be extended without a schema change
- Required API contract (`POST /labels` with `name` field, `GET /labels` returning named labels) cannot be satisfied
- No semantic meaning — "red" and "urgent" are not equivalent; users need names
- Loses the required `id`-based label management entirely

**Technical Fit**: Low — the specified API contract and accessibility NFR both require named labels
**Complexity**: Low — but wrong for the problem
**Scalability**: High — irrelevant given the functional misfit

---

## Evaluation Matrix

| Criteria | Option A (Global Palette) | Option B (Ad-hoc Per-Card) | Option C (Color-Only) |
|----------|--------------------------|---------------------------|----------------------|
| Scalability | High | Medium | High |
| Maintainability | High — single source of truth | Low — duplicate data sprawl | N/A — wrong fit |
| Performance | High — indexed FK joins | Medium — string matching | High — irrelevant |
| Query complexity (filter) | Low — `WHERE label_id = $1` | High — `WHERE name = $1` across cards | Medium |
| Cascade delete | Declarative (DB constraint) | Manual or UNIQUE workaround | N/A |
| API contract fit | Full — all endpoints map cleanly | Partial — no label entity ID | None — name field missing |
| Accessibility NFR | Compliant — names required | Compliant — names per card | Fails — no names |
| Duplicate enforcement | DB UNIQUE(name, board_id) | Ambiguous per-card | N/A |
| Implementation cost | Low | Medium | Low (wrong fit) |
| Aligns with guiding principles | Yes | Partially | No |

---

## Observability Architecture

### Logging

- **Library**: No bare `console.log` — use the project's structured logger (when adopted) or a thin wrapper over `process.stdout` that emits JSON with `{ level, message, service, traceId?, spanId? }` fields. For MVP, a minimal `logger.ts` in `src/utils/` that wraps `pino` (already in stack or added as a dependency) satisfies the "no console.log in production" requirement.
- **Format**: Structured JSON
- **Configuration**: `LOG_LEVEL` env var (default `info`); `LOG_FORMAT` env var (default `json`)
- **Required log points**: service entry (info), validation errors (warn), repository errors (error), unexpected exceptions (error)

### Distributed Tracing

- **Standard**: W3C Trace Context (traceparent header)
- **SDK**: OpenTelemetry — **aspirational for MVP**. At BanyanBoard's scale (2–15 users, single-instance), full OTEL instrumentation is not required before ship. The architecture is designed so OTEL can be added without refactoring: service functions accept an optional `context` parameter for trace propagation when the OTEL SDK is introduced.
- **Required now**: Each inbound request carries a correlation ID (auto-generated UUID if not provided in `X-Request-ID` header). This ID flows through service and repository log lines.
- **Future**: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_TRACES_SAMPLER_ARG` env vars wired when OTEL is added.

### Metrics

- **Required now**: HTTP response time and status codes are observable via access logs (Express morgan middleware or equivalent).
- **Future**: Prometheus-compatible metrics endpoint (`/metrics`) with `http_requests_total`, `http_request_duration_seconds`, `label_operations_total` when OTEL metrics are introduced.
- **Custom business metrics (future)**: `label_attach_total{board_id}`, `label_detach_total{board_id}`

### Configuration Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `LOG_LEVEL` | Log verbosity | `info` |
| `LOG_FORMAT` | Output format | `json` |
| `LOG_OUTPUT` | Destination | `stdout` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector endpoint (future) | — |
| `OTEL_SERVICE_NAME` | Service identifier (future) | `banyanboard-api` |
| `OTEL_TRACES_SAMPLER_ARG` | Sampling ratio (future) | `1.0` |

---

## Decision

**Chosen**: Option A — Global Board Palette (`labels` table + `card_labels` join table)

### Rationale

Option A is the only choice that satisfies all three hard constraints simultaneously:

1. **API contract**: The required endpoints presuppose label entities with stable UUIDs (`DELETE /labels/:id`, `POST /cards/:id/labels` with `{ labelId }`). Only a global palette creates first-class label entities.
2. **Accessibility NFR**: Labels must carry names; color-only (Option C) is excluded.
3. **Filter semantics**: Board-level filter ("show cards tagged Bug") requires a shared label reference. Ad-hoc labels (Option B) would require fragile string matching.

The board palette pattern also aligns with the domain event pattern noted in `systemPatterns.md` — label attach/detach events carry a stable `label_id` that consumers can reason about without re-parsing display strings.

At BanyanBoard's scale (hundreds of cards, dozens of boards, single instance), the normalized join-table approach has zero performance risk. The required JOIN in `GET /cards` is one standard `LEFT JOIN ... GROUP BY` pattern well within pg's sweet spot.

### Trade-offs Accepted

- `GET /cards` requires a JOIN across three tables (cards + card_labels + labels). At the scale of hundreds of cards per board, this join completes in single-digit milliseconds. Accepted.
- Renaming/recoloring a label affects all cards that carry it — this is the intended behavior (single source of truth) and is not a bug.
- The `labels` table introduces a second level of board-scoped data. Cards will need a `board_id` column (see implementation note below) to efficiently scope label queries without joining through columns — or alternatively label queries are scoped via the board_id on the labels table directly.

---

## SQL DDL — Migration `003_create_labels.sql`

```sql
-- Labels: board-scoped label definitions
CREATE TABLE IF NOT EXISTS labels (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(50)  NOT NULL,
  color      VARCHAR(7)   NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  board_id   UUID         NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_label_name_per_board UNIQUE (name, board_id)
);

-- Card-label associations: many-to-many join table
CREATE TABLE IF NOT EXISTS card_labels (
  card_id    UUID  NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id   UUID  NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- Index for "get all labels on a card" (used in GET /cards JOIN)
CREATE INDEX IF NOT EXISTS idx_card_labels_card_id   ON card_labels (card_id);

-- Index for "get all cards with a given label" (used in filter queries)
CREATE INDEX IF NOT EXISTS idx_card_labels_label_id  ON card_labels (label_id);

-- Index for "get all labels for a board" (used in GET /labels?boardId=:id)
CREATE INDEX IF NOT EXISTS idx_labels_board_id       ON labels (board_id);
```

**Note on `cards.board_id`**: The current `cards` table has no `board_id` column. The label filter use case ("cards on board X with label Y") can be resolved without adding `board_id` to cards by joining through the labels table: `card_labels.label_id → labels.board_id`. However, adding `board_id` to cards is independently correct for card management. This migration should be preceded by (or include) an `ALTER TABLE cards ADD COLUMN board_id UUID REFERENCES boards(id)` if TASK-008 scope includes it. If not in scope, the label filter query uses `JOIN labels ON card_labels.label_id = labels.id WHERE labels.board_id = $1` — which is fully valid and indexed.

---

## Full API Contract

### POST /labels — Create a label

**Request**:
```json
POST /labels
Content-Type: application/json

{
  "name": "Bug",
  "color": "#e11d48",
  "boardId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 201**:
```json
{
  "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
  "name": "Bug",
  "color": "#e11d48",
  "boardId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-06-16T10:00:00.000Z"
}
```

**Error responses**:
| Code | `code` field | Condition |
|------|-------------|-----------|
| 400 | `VALIDATION_ERROR` | `name` missing or empty |
| 400 | `VALIDATION_ERROR` | `color` missing or not matching `#[0-9a-fA-F]{6}` |
| 400 | `VALIDATION_ERROR` | `boardId` missing |
| 400 | `DUPLICATE_LABEL` | Label with same name already exists for this board |
| 404 | `NOT_FOUND` | Board with `boardId` does not exist |

---

### GET /labels?boardId=:id — List labels for a board

**Request**:
```
GET /labels?boardId=550e8400-e29b-41d4-a716-446655440000
```

**Response 200**:
```json
[
  {
    "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
    "name": "Bug",
    "color": "#e11d48",
    "boardId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-06-16T10:00:00.000Z"
  }
]
```

**Error responses**:
| Code | `code` field | Condition |
|------|-------------|-----------|
| 400 | `VALIDATION_ERROR` | `boardId` query param missing |

---

### DELETE /labels/:id — Delete a label (cascades card_labels)

**Request**:
```
DELETE /labels/a3bb189e-8bf9-3888-9912-ace4e6543002
```

**Response**: `204 No Content` (empty body)

**Error responses**:
| Code | `code` field | Condition |
|------|-------------|-----------|
| 404 | `NOT_FOUND` | Label with `:id` does not exist |

**Cascade behavior**: The `ON DELETE CASCADE` on `card_labels.label_id` removes all card associations at the database level — no application-layer cleanup required.

---

### POST /cards/:id/labels — Attach a label to a card

**Request**:
```json
POST /cards/card-uuid-here/labels
Content-Type: application/json

{
  "labelId": "a3bb189e-8bf9-3888-9912-ace4e6543002"
}
```

**Response 201**:
```json
{
  "cardId": "card-uuid-here",
  "labelId": "a3bb189e-8bf9-3888-9912-ace4e6543002"
}
```

**Error responses**:
| Code | `code` field | Condition |
|------|-------------|-----------|
| 400 | `VALIDATION_ERROR` | `labelId` missing |
| 404 | `NOT_FOUND` | Card with `:id` does not exist |
| 404 | `NOT_FOUND` | Label with `labelId` does not exist |
| 409 | `CONFLICT` | Label already attached to this card (PK violation) |

---

### DELETE /cards/:id/labels/:labelId — Detach a label from a card

**Request**:
```
DELETE /cards/card-uuid-here/labels/a3bb189e-8bf9-3888-9912-ace4e6543002
```

**Response**: `204 No Content` (empty body)

**Error responses**:
| Code | `code` field | Condition |
|------|-------------|-----------|
| 404 | `NOT_FOUND` | Association does not exist (card or label not found, or not attached) |

---

### GET /cards — Extended to include labels

**Strategy**: Single JOIN query with `array_agg` — avoids N+1 queries.

**Query pattern**:
```sql
SELECT
  c.id,
  c.title,
  c.column_id,
  c.created_at,
  COALESCE(
    json_agg(
      json_build_object('id', l.id, 'name', l.name, 'color', l.color)
      ORDER BY l.name
    ) FILTER (WHERE l.id IS NOT NULL),
    '[]'
  ) AS labels
FROM cards c
LEFT JOIN card_labels cl ON cl.card_id = c.id
LEFT JOIN labels l       ON l.id = cl.label_id
GROUP BY c.id
ORDER BY c.created_at DESC;
```

**Response 200** (each card object):
```json
[
  {
    "id": "card-uuid-here",
    "title": "Fix login bug",
    "columnId": "in-progress",
    "createdAt": "2026-06-16T09:00:00.000Z",
    "labels": [
      { "id": "label-uuid", "name": "Bug", "color": "#e11d48" }
    ]
  }
]
```

Cards with no labels return `"labels": []`.

**Rationale for JOIN over separate query**: A separate query (one per card) creates an N+1 problem. The single LEFT JOIN with `json_agg` is a single round-trip regardless of card count, and PostgreSQL's aggregate performance at hundreds of rows is well within the p95 < 200ms NFR.

---

## Implementation Guidelines

### Backend Files — New Files to Create

| File | Purpose |
|------|---------|
| `backend/src/types/label.types.ts` | `Label`, `CreateLabelDto`, `LabelSummary` (id, name, color only — used in card responses) |
| `backend/src/repositories/label.repository.ts` | `createLabel`, `getLabelsByBoard`, `getLabelById`, `deleteLabel`, `attachLabelToCard`, `detachLabelFromCard`, `getLabelsByCardId` |
| `backend/src/services/label.service.ts` | `createLabel` (validates name, color, boardId; checks board exists; checks uniqueness), `getLabelsByBoard`, `deleteLabel` (checks exists), `attachLabel` (checks card exists, label exists, not already attached), `detachLabel` |
| `backend/src/controllers/label.controller.ts` | `createLabel`, `listLabels`, `deleteLabel`, `attachLabel`, `detachLabel` |
| `backend/src/routes/label.routes.ts` | `POST /labels`, `GET /labels`, `DELETE /labels/:id`, `POST /cards/:id/labels`, `DELETE /cards/:id/labels/:labelId` |
| `backend/src/db/migrations/003_create_labels.sql` | DDL for `labels` and `card_labels` tables (see above) |

### Backend Files — Existing Files to Modify

| File | Change |
|------|--------|
| `backend/src/app.ts` | Import and mount `label.routes.ts` |
| `backend/src/repositories/card.repository.ts` | Extend `getCards()` query to LEFT JOIN `card_labels` + `labels` and aggregate via `json_agg`; update `rowToCard()` mapper to include `labels: LabelSummary[]` |
| `backend/src/types/card.types.ts` (or `board.types.ts`) | Add `labels: LabelSummary[]` to the `Card` interface |
| `backend/src/__tests__/` | Add `label.test.ts` (~14–16 tests) |

### Test Coverage Target (~14–16 backend tests in `label.test.ts`)

1. `POST /labels` → 201 with valid payload
2. `POST /labels` → 400 when `name` is empty
3. `POST /labels` → 400 when `color` is invalid hex
4. `POST /labels` → 400 when `boardId` is missing
5. `POST /labels` → 400 when name duplicates existing label on same board
6. `POST /labels` → 404 when `boardId` references non-existent board
7. `GET /labels?boardId=:id` → 200 with label array
8. `GET /labels` → 400 when `boardId` param is missing
9. `DELETE /labels/:id` → 204 for existing label
10. `DELETE /labels/:id` → 404 for non-existent label
11. `POST /cards/:id/labels` → 201 when attach succeeds
12. `POST /cards/:id/labels` → 404 when card not found
13. `POST /cards/:id/labels` → 404 when label not found
14. `DELETE /cards/:id/labels/:labelId` → 204 when detach succeeds
15. `DELETE /cards/:id/labels/:labelId` → 404 when association does not exist
16. `GET /cards` → response includes `labels` array per card (even empty)

---

## Validation Checklist

- [x] Meets all system requirements (label CRUD, attach/detach, cascade delete, filter-ready)
- [x] Respects technical constraints (pg parameterized queries, repository pattern, migration runner)
- [x] Addresses non-functional requirements (p95 < 200ms via indexed JOIN; duplicate enforcement via DB constraint)
- [x] Technically feasible (standard PostgreSQL + pg driver, no new dependencies required)
- [x] Risks identified and acceptable (see Risk Assessment below)
- [x] Complies with Guiding Principles in systemPatterns.md — no deviations; Option A follows separation of concerns, type safety, zero over-engineering, and clean container patterns
- [x] Respects established patterns in systemPatterns.md — route/controller/service/repository layering, `rowToX` mappers, `AppError` subclasses, parameterized queries
- [x] Observability architecture defined — no console.log; structured logging required; OTEL aspirational for MVP
- [x] Trace context propagation — correlation ID via `X-Request-ID` header flows through log lines; OTEL deferred
- [x] Logging strategy consistent with CLAUDE.md observability requirements
- [x] Metrics strategy follows naming conventions (aspirational, documented above)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `GET /cards` JOIN degrades performance at very high card count | Low | Medium | At hundreds of cards (stated scale), single JOIN with `json_agg` is ~1–5ms. Index on `card_labels.card_id` ensures pg uses index scan. Re-evaluate only if card count reaches tens of thousands. |
| Cards table lacks `board_id` column, complicating board-scoped label filter | Medium | Low | Label filter query joins through `labels.board_id` without needing `cards.board_id`. Clean workaround; adding `board_id` to cards is a separate concern. |
| Duplicate label name enforcement produces unhelpful error message | Low | Low | Catch pg unique constraint violation (error code `23505`) in repository and re-throw as `ValidationError('A label with this name already exists on this board')`. |
| Color validation regex allows uppercase hex (`#AABBCC`) — must normalize | Low | Low | Service normalizes color to lowercase on write: `color.toLowerCase()`. Regex accepts both; storage is consistent. |
| Missing label entity causes 409 confusion on re-attach | Low | Low | Service checks for existing association before insert and returns 409 `CONFLICT` with clear message. |

---

## Next Steps

1. Implement `003_create_labels.sql` migration following the DDL above
2. Create `label.types.ts` with `Label`, `CreateLabelDto`, `LabelSummary` interfaces
3. Implement `label.repository.ts` with all six repository functions
4. Implement `label.service.ts` with validation logic (hex regex, empty name, board existence, uniqueness)
5. Implement `label.controller.ts` following the `board.controller.ts` pattern (AppError catch, 204 for deletes)
6. Implement `label.routes.ts` and mount in `app.ts`
7. Extend `card.repository.ts` `getCards()` query with LEFT JOIN + `json_agg`; update `Card` type
8. Write `label.test.ts` with 14–16 tests using mocked repository (follow `board.test.ts` pattern)
9. Verify migration runner picks up `003_create_labels.sql` (alphabetical/numeric order enforced by runner)
