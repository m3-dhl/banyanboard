# Product Roadmap

## Summary
- **Total Features**: 4
- **Released Versions**: 0
- **Active Versions**: 0
- **Planning Versions**: 1
- **Backlog (next)**: 3

---

## Versions

### v0.1.0 — Foundation (Planning)
- **Status**: planning
- **Target Date**: TBD
- **Description**: Runnable skeleton — Express/TypeScript backend, PostgreSQL via Docker Compose, health check endpoint with tests, and clean project structure. No product features yet; establishes the foundation everything else builds on.
- **Features**:
  - FEAT-001: Project Foundation (complete) [Level 1]

---

### next (Backlog)
- **Status**: planning
- **Features**:
  - FEAT-002: Board CRUD Endpoints (complete) [Level 2]
  - FEAT-003: Add Board CRUD API (planned) [Level 2]
  - FEAT-004: Simple Frontend Kanban Board (planned) [Level 2]

---

## Features

### FEAT-002: Board CRUD Endpoints
- **Version**: next
- **Status**: complete
- **Priority**: high
- **Complexity**: Level 2
- **Description**: Create a Board model with full CRUD endpoints (GET all, GET by id, POST, PATCH, DELETE) and comprehensive tests. Includes pg integration, repository layer, service layer, controller, routes, and jest-mocked unit/integration tests.
- **Linked Tasks**: TASK-002 (COMPLETE)
- **Branch**: feature/FEAT-002-board-crud-endpoints
- **Created**: 2026-06-09
- **Completed**: 2026-06-09

---

### FEAT-003: Add Board CRUD API
- **Version**: next
- **Status**: planned
- **Priority**: medium
- **Complexity**: Level 2
- **Description**: Add input validation and error handling to Board CRUD API endpoints with validation middleware, structured error responses, and comprehensive error scenarios.
- **Linked Tasks**: None
- **Branch**: feature/FEAT-003-add-board-crud-api
- **Created**: 2026-06-09

---

### FEAT-004: Simple Frontend Kanban Board
- **Version**: next
- **Status**: planned
- **Priority**: medium
- **Complexity**: Level 2 (user-capped; natural eval = Level 3)
- **Max Phases**: 2 (user-enforced)
- **Description**: Build a minimal frontend kanban board with 3 columns (Todo, In Progress, Done) and drag-and-drop card movement. Scoped to ≤2 implementation phases.
- **Linked Tasks**: TASK-005 (PLANNING)
- **Branch**: feature/FEAT-004-simple-frontend-kanban-board
- **Created**: 2026-06-16

---

### FEAT-001: Project Foundation
- **Version**: v0.1.0
- **Status**: complete
- **Priority**: high
- **Complexity**: Level 1
- **Description**: Stand up the full local development environment. Express API with TypeScript, Docker Compose orchestrating backend + PostgreSQL, health check endpoint (`GET /health`) with integration tests, and a clean architecture directory structure (routes → controllers → services → repositories). Project must start with `docker compose up` and all tests must pass.
- **Linked Tasks**: TASK-001 (COMPLETE)
- **Branch**: feature/FEAT-001-project-foundation
- **Created**: 2026-06-09
