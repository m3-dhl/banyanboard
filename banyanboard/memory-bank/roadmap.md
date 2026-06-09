# Product Roadmap

## Summary
- **Total Features**: 1
- **Released Versions**: 0
- **Active Versions**: 0
- **Planning Versions**: 1
- **Backlog (next)**: 0

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
- **Features**: None

---

## Features

### FEAT-001: Project Foundation
- **Version**: v0.1.0
- **Status**: complete
- **Priority**: high
- **Complexity**: Level 1
- **Description**: Stand up the full local development environment. Express API with TypeScript, Docker Compose orchestrating backend + PostgreSQL, health check endpoint (`GET /health`) with integration tests, and a clean architecture directory structure (routes → controllers → services → repositories). Project must start with `docker compose up` and all tests must pass.
- **Linked Tasks**: TASK-001 (COMPLETE)
- **Branch**: feature/FEAT-001-project-foundation
- **Created**: 2026-06-09
