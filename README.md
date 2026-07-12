# Propaga Challenge

## Overview

This repository contains my solution for the Propaga Fullstack Engineer
technical challenge.

The application is an operations console that allows operators to
review, approve and reject credit disbursements before they are
processed.

------------------------------------------------------------------------

# Features

-   List credit disbursements.
-   Filter by status, distributor and amount range.
-   Cursor-based pagination.
-   View disbursement details.
-   Approve pending disbursements.
-   Reject pending disbursements with a reason.
-   Immutable append-only audit log.
-   Optimistic concurrency control.
-   Idempotent decision endpoints.
-   Shared API contracts between frontend and backend.

------------------------------------------------------------------------

# Technology Stack

  Component           Technology
  ------------------- --------------------
  Language            TypeScript
  Backend             NestJS
  Frontend            Next.js App Router
  Database            PostgreSQL
  ORM                 Prisma
  Package Manager     pnpm Workspaces
  Local Environment   Docker Compose

------------------------------------------------------------------------

# Repository Architecture

``` text
apps/
  api/
  web/

packages/
  contracts/
```

-   **apps/api**: NestJS backend.
-   **apps/web**: Next.js frontend.
-   **packages/contracts**: Shared DTOs, enums, response types and Zod
    schemas.

------------------------------------------------------------------------

# Backend Architecture

``` text
domain/
application/
infrastructure/
```

-   **Domain**: entities, business rules and state machine.
-   **Application**: use cases, repository contracts and application
    errors.
-   **Infrastructure**: controllers, Prisma repositories and
    persistence.

Patterns used:

-   Repository Pattern
-   Use Case Pattern
-   Dependency Inversion
-   State Machine

------------------------------------------------------------------------

# Frontend Architecture

``` text
src/
  app/
  components/
  lib/
```

-   **app**: routing and pages.
-   **components**: reusable UI.
-   **lib**: API client and utilities.

State-changing operations use optimistic UI updates and rollback on
failure.

------------------------------------------------------------------------

# Shared Contracts

The `packages/contracts` package is the single source of truth shared by
the frontend and backend.

It contains:

-   DTOs
-   Enums
-   Response models
-   Zod schemas

------------------------------------------------------------------------

# Domain Design

States:

``` text
pending
approved
rejected
```

Allowed transitions:

``` text
pending -> approved
pending -> rejected
```

Conflicting transitions return **409 Conflict**.

Every successful transition generates an immutable audit record
containing:

-   actor
-   timestamp
-   rejection reason

------------------------------------------------------------------------

# Getting Started

## Requirements

-   Node.js 20+
-   pnpm
-   Docker Desktop

## Environment

``` bash
cp .env.example .env
```

``` env
POSTGRES_USER=propaga
POSTGRES_PASSWORD=propaga
POSTGRES_DB=propaga
POSTGRES_PORT=5432

DATABASE_URL=postgresql://propaga:propaga@localhost:5432/propaga?schema=public
```

## Start PostgreSQL

``` bash
docker compose up -d
```

## Install dependencies

``` bash
pnpm install
```

## Build contracts

``` bash
pnpm --filter @propaga/contracts build
```

## Generate Prisma Client

``` bash
pnpm --filter @propaga/api prisma:generate
```

## Apply migrations

``` bash
pnpm --filter @propaga/api prisma:migrate:deploy
```

## Start backend

``` bash
pnpm --filter @propaga/api start:dev
```

http://localhost:3000

## Start frontend

``` bash
pnpm --filter @propaga/web dev
```

http://localhost:3001

------------------------------------------------------------------------

# API Endpoints

  Method   Endpoint
  -------- -------------------------------
  POST     /v1/disbursements/seed
  GET      /v1/disbursements
  GET      /v1/disbursements/:id
  POST     /v1/disbursements/:id/approve
  POST     /v1/disbursements/:id/reject

------------------------------------------------------------------------

# Database Design

Tables:

-   disbursements
-   disbursement_audit_logs

The current state is stored separately from the immutable append-only
audit history.

------------------------------------------------------------------------

# Idempotency

The API implements idempotency through:

1.  Domain state machine.
2.  Optimistic concurrency.
3.  Atomic conditional updates.
4.  Immutable audit log.

No idempotency keys are used.

Only successful transitions generate audit records.

------------------------------------------------------------------------

# Concurrency Strategy

Concurrent requests are handled through optimistic concurrency by
updating records only when both:

-   the disbursement ID
-   the expected current status

match the database state.

------------------------------------------------------------------------

# Seed Endpoint

    POST /v1/disbursements/seed

Characteristics:

-   deterministic UUIDs
-   createMany + skipDuplicates
-   safe to execute multiple times
-   development only

------------------------------------------------------------------------

# Error Handling

  Status   Meaning
  -------- ----------------------------
  400      Validation error
  404      Not found
  409      Invalid transition
  409      Concurrent update conflict

------------------------------------------------------------------------

# Testing

Run unit tests:

``` bash
pnpm --filter @propaga/api test
```

Integration:

``` bash
pnpm --filter @propaga/api test:integration
```

End-to-end:

``` bash
pnpm --filter @propaga/api test:e2e
```

------------------------------------------------------------------------

# API Testing with Postman

A Postman collection is included in:

``` text
docs/postman/Propaga-Challenge.postman_collection.json
```

It includes requests for:

-   Seed
-   List
-   Filters
-   Get by ID
-   Approve
-   Reject
-   Idempotent approval
-   Invalid transition

Import the collection, configure the `baseUrl` variable if necessary and
execute the Seed request before testing.

------------------------------------------------------------------------

# Verifying Idempotency

``` bash
DISBURSEMENT_ID="11111111-1111-4111-8111-111111111111"

curl -i -X POST \
"http://localhost:3000/v1/disbursements/$DISBURSEMENT_ID/approve" \
-H "x-actor-id: operator-1" &

curl -i -X POST \
"http://localhost:3000/v1/disbursements/$DISBURSEMENT_ID/approve" \
-H "x-actor-id: operator-1" &

wait
```

Expected:

-   One transition is persisted.
-   Final state is approved.
-   No duplicate audit records.
-   Repeating the request creates no additional side effects.

------------------------------------------------------------------------

# What I Would Improve With More Time

## Frontend

-   Implement the disbursement detail page with audit history.
-   Introduce internationalization (i18n) for all UI copy.
-   Add authentication flows.
-   Protect routes based on authentication.
-   Show UI actions according to user roles.
-   Improve accessibility.
-   Improve pagination UX.
-   Increase frontend test coverage.

## Backend

-   Add JWT or external identity provider authentication.
-   Implement RBAC.
-   Protect endpoints using NestJS Guards.
-   Add structured logging.
-   Add distributed tracing.
-   Improve monitoring and observability.
-   Increase integration and end-to-end tests.

## DevOps

-   Configure CI/CD pipelines.
-   Automate linting, testing and migrations.
-   Improve environment configuration.

------------------------------------------------------------------------

# Production Considerations

-   Remove or protect the seed endpoint.
-   Store secrets in a secret manager.
-   Implement authentication.
-   Implement RBAC.
-   Protect frontend routes.
-   Protect backend endpoints.
-   Add rate limiting.
-   Configure monitoring and alerting.
-   Configure distributed tracing.
-   Configure automated backups.
-   Separate development, staging and production environments.
-   Deploy behind a reverse proxy and load balancer.
-   Configure HTTPS.

------------------------------------------------------------------------

# Time Spent

The implementation took approximately **7 hours**, distributed across
**3 days**.

The elapsed time was longer than the actual development effort because I
experienced intermittent power outages that caused temporary internet
connectivity issues during the implementation.
