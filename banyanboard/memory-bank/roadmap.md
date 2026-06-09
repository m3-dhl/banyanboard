# Product Roadmap

## Summary
- **Total Features**: 2
- **Released Versions**: 0
- **Active Versions**: 0
- **Planning Versions**: 1
- **Backlog (next)**: 1

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
  - FEAT-002: Board CRUD Endpoints (in_progress) [Level 2]

---

## Features

### FEAT-002: Board CRUD Endpoints
- **Version**: next
- **Status**: in_progress
- **Priority**: high
- **Complexity**: Level 2
- **Description**: Create a Board model with full CRUD endpoints (GET all, GET by id, POST, PATCH, DELETE) and comprehensive tests. Includes pg integration, repository layer, service layer, controller, routes, and jest-mocked unit/integration tests.
- **Linked Tasks**: TASK-002 (IN_PROGRESS)
- **Branch**: feature/FEAT-002-board-crud-endpoints
- **Created**: 2026-06-09

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
