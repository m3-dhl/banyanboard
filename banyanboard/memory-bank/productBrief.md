# Product Brief

> This document captures the business and product context for development teams.
> It ensures all agents understand the product's purpose, users, and constraints.

## Product Overview

- **Name**: BanyanBoard
- **Value Proposition**: Simple kanban board for small teams who need visual task tracking without the overhead of enterprise tools
- **Product Type**: Self-hosted web application
- **Stage**: MVP

## Key Functionality

- Create and manage boards with customizable columns (To Do, In Progress, Done)
- Create cards with title, description, due date, and labels
- Drag-and-drop cards between columns
- Multi-user boards for team collaboration
- Label-based card filtering and organization

## Markets Serviced

- **Primary Market**: Small software development teams (2–10 people)
- **Secondary Markets**: Small business teams, freelancer groups, side project collaborators
- **Geographic Focus**: Global
- **Market Size**: Long tail of small teams who find Jira/Linear too heavy and Trello too limited

## Competitive Landscape

- **Direct Competitors**: Trello, Planka, WeKan
- **Indirect Competitors**: GitHub Projects, Linear, Jira, Notion databases
- **Key Differentiators**: Self-hosted, no SaaS lock-in, minimal setup via Docker Compose
- **Competitive Advantages**: Runs locally, no per-seat pricing, clean simple UX

## Key Personas

### Primary Users

| Persona | Role | Goals | Pain Points | Success Metrics |
|---------|------|-------|-------------|-----------------|
| Dev Team Member | Software developer on a small team | See what's in progress, move own cards, know what's blocked | Enterprise tools are slow and complex; Trello lacks structure | Cards moved per week; time to find assigned work < 10s |
| Team Lead | Tech lead or project manager (2–8 person team) | Maintain board structure, see overall progress, assign work | No clear overview in spreadsheets; Jira overkill | Full board visible at a glance; able to create/organize board in < 5 min |

### Secondary Users

| Persona | Role | Goals |
|---------|------|-------|
| Solo Developer | Indie developer or freelancer | Personal task tracking with kanban discipline |

### Administrators/Operators

| Persona | Role | Responsibilities |
|---------|------|------------------|
| Self-Hosting Admin | DevOps or developer who deploys the app | Start/stop via Docker Compose, manage DB backups, handle upgrades |

## User Flows

- **Primary Flow**: Open board → scan columns → drag card to new column → done
- **Onboarding**: Start Docker Compose → open browser → create first board → add columns → add cards
- **Key Workflows**:
  - Create a new card with title + description + due date + label, assign to column
  - Move a card across columns via drag-and-drop
  - Filter cards by label to focus on a specific workstream
  - Create a new board for a new project

## Success Metrics & KPIs

### Business Metrics
- N/A (self-hosted, no monetization in scope)

### Product Metrics
- Cards moved per session (engagement signal)
- Boards created per deployment (adoption signal)
- Time from Docker Compose up to first card created (onboarding friction)

### Technical Metrics
- API p95 response time < 200ms
- Page load (initial) < 2s on localhost
- Zero data loss on container restart (Postgres volume persists)

## Non-Functional Requirements

### Performance

- **Response Time**: p95 < 200ms for all API calls; drag-and-drop update < 100ms perceived
- **Throughput**: Single-team workload (~10 concurrent users max)
- **Concurrent Users**: 2–15 simultaneous users per deployment
- **Page Load Time**: < 2s initial load; < 500ms subsequent navigation

### Scalability

- **Users**: 2–15 users per self-hosted instance (not designed for multi-tenant SaaS)
- **Data Volume**: Hundreds of cards per board; dozens of boards per instance
- **Growth Rate**: Static — no horizontal scaling requirement
- **Peak Load**: Full team online simultaneously (~15 users)

### Security

- **Authentication**: Session-based auth or JWT; username/password login
- **Authorization**: Board-level access control (members vs non-members)
- **Compliance**: None required (self-hosted, no PII beyond usernames/emails)
- **Data Classification**: Internal — no sensitive/regulated data
- **Encryption**: HTTPS recommended for production; HTTP acceptable for local dev

### Availability & Reliability

- **Uptime Target**: Best-effort (self-hosted; no SLA)
- **Recovery Time Objective (RTO)**: < 5 minutes (Docker Compose restart)
- **Recovery Point Objective (RPO)**: Last DB backup (user-managed)
- **Disaster Recovery**: Docker volume backup; no automated DR required
- **Backup Strategy**: User-managed Postgres volume snapshots

### Data & Privacy

- **Data Residency**: User's own infrastructure (fully self-hosted)
- **Data Retention**: User-managed; no automatic expiry
- **Privacy Requirements**: None beyond standard web hygiene (no tracking, no analytics)
- **PII Handling**: Email/username stored; no external transmission
- **Data Portability**: Board export as JSON (nice-to-have)
- **Right to Deletion**: Admin deletes user account manually

### Accessibility

- **Target Compliance**: WCAG 2.1 AA (reasonable effort)
- **Key Requirements**:
  - [x] Keyboard navigation (card creation, column navigation)
  - [x] Color contrast compliance
  - [x] Focus indicators
  - [ ] Screen reader compatibility (nice-to-have)
  - [ ] Alt text for images (no images in scope)
  - [ ] Captions for video/audio (not applicable)

### Internationalization (i18n)

- **Supported Languages**: English only (MVP)
- **Localization Needs**: None in scope

### Browser/Platform Support

- **Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: Responsive layout desirable; drag-and-drop on mobile is best-effort
- **Desktop**: Primary target; Windows, macOS, Linux via Docker

## Integration Points

### External Systems

| System | Purpose | Protocol | Direction |
|--------|---------|----------|-----------|
| PostgreSQL | Persistent storage for boards, columns, cards, users | TCP (pg protocol) | Outbound from backend |

### APIs Consumed

| API | Provider | Purpose |
|-----|----------|---------|
| None | — | No external API dependencies in MVP |

### APIs Provided

| API | Purpose | Consumers |
|-----|---------|-----------|
| REST API (/api/v1) | CRUD for boards, columns, cards, users | React frontend |

### Data Sources

| Source | Type | Frequency |
|--------|------|-----------|
| PostgreSQL | Relational database | Real-time (per request) |

## Constraints & Assumptions

### Business Constraints

- MVP scope: no billing, no SaaS infrastructure, no email integrations
- No mobile-native app in scope

### Technical Constraints

- Must run via `docker compose up` with no other dependencies
- React frontend, TypeScript/Express backend, PostgreSQL — stack is fixed
- Clean architecture with simplicity over abstraction (avoid over-engineering)
- No microservices — monolithic backend is correct for this scale

### Assumptions

- Single deployment serves one team (no multi-tenancy required in MVP)
- Users trust the admin who runs the instance (no enterprise SSO required)
- Internet connectivity not required — fully local operation is a feature

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Drag-and-drop UX complexity | Medium | High | Use a proven DnD library (e.g., @hello-pangea/dnd) |
| Schema migrations on self-hosted instances | Medium | Medium | Use migration tool (e.g., node-pg-migrate or Flyway) from day one |
| Auth implementation vulnerabilities | Low | High | Use established session/JWT library; no custom crypto |
| Docker Compose setup friction | Low | Medium | Provide single `docker-compose.yml` with sane defaults and a README |

## Open Questions

- [ ] Should boards support custom column names/ordering beyond To Do / In Progress / Done?
- [ ] Is real-time sync (WebSockets) required for MVP or is polling acceptable?
- [ ] Should cards support file attachments or just text?

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-06-09 | banyan-init | Initial creation from placeholder |
| 2026-06-09 | user | Populated with BanyanBoard product context |

## Last Refreshed

2026-06-09
