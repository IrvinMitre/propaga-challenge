# Propaga Challenge

## Overview
This repository contains the solution for the Propaga Fullstack Engineer technical challenge.

The application is an operations console for reviewing, approving and rejecting credit disbursements before they are processed.

## Technology Stack
| Component | Technology | Purpose |
|------------|------------|----------|
| Language | TypeScript | Provides end-to-end type safety across the project. |
| Backend | NestJS | Builds a modular and maintainable REST API. |
| Frontend | Next.js (App Router) | Implements the operations console using React. |
| Database | PostgreSQL | Stores transactional application data. |
| ORM | Prisma | Provides type-safe database access and schema migrations. |
| Package Manager | pnpm Workspaces | Manages the monorepo and shared dependencies. |
| Local Environment | Docker Compose | Creates a reproducible local development environment. |

## Repository Architecture
The project is organized as a lightweight monorepo.

```
apps/
  api/
  web/

packages/
  contracts/
```

Responsibilities:

- `apps/api` contains the NestJS backend.
- `apps/web` contains the Next.js frontend.
- `packages/contracts` contains public contracts shared between both applications.

pnpm Workspaces manages the applications and shared packages.

## Backend Architecture
The backend uses a simplified layered architecture inspired by Clean Architecture.

```
domain/
application/
infrastructure/
```

### Domain
Contains business rules and valid state transitions.

### Application
Contains use cases and repository contracts that coordinate business operations.

### Infrastructure
Contains HTTP controllers, Prisma repositories and database implementation details.

The main design patterns are:

- Repository Pattern.
- Use Case Pattern.
- Dependency Inversion.
- State Machine.

## Frontend Architecture
The frontend uses Next.js App Router with a feature-oriented structure.

```
app/
components/
features/
lib/
```

Responsibilities:

- `app` contains routes and page composition.
- `components` contains reusable presentation components.
- `features` contains components, hooks and interactions for a specific feature.
- `lib` contains the API client, utilities and shared helpers.

State-changing operations use optimistic updates and restore the previous state when the backend rejects an operation.

## Shared Contracts
The `packages/contracts` package contains only the public communication contract between the backend and frontend.


## Domain Design
A disbursement has three possible states:

```
pending
approved
rejected
```

Valid transitions:

```
pending -> approved
pending -> rejected
```

Any conflicting transition returns `409 Conflict`.

Every successful transition creates an immutable audit record containing the actor, timestamp and optional rejection reason.

## Getting Started

### Requirements

- Node.js 20 or newer.
- pnpm 10.34.5.
- Docker Desktop

## Database Design

The application stores the current state of each disbursement separately from its audit history.

Tables:

- disbursements
- disbursement_audit_logs

This design keeps current queries simple while preserving a complete append-only history of state transitions.