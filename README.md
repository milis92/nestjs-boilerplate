<div align="center">

# NestJS Backend Boilerplate

A production-ready NestJS backend featuring authentication, distributed caching, rate limiting, GraphQL, and
more — designed to be scalable, observable, and easy to extend.

[![Node.js](https://img.shields.io/badge/Node.js-≥20.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)

</div>

---

## Table of Contents

- [Quickstart](#quickstart)
    - [Prerequisites](#prerequisites)
- [Motivation](#motivation)
- [Features](#features)
- [Running Locally](#running-locally)
    - [Database Setup](#database-setup)
    - [Running the Application](#running-the-application)
    - [Running Tests](#running-tests)
    - [Code Quality](#code-quality)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
    - [Why This Separation?](#why-this-separation)
    - [Where to Look](#where-to-look)
- [Testing](#testing)
    - [Test Runner](#test-runner)
    - [Unit Tests](#unit-tests)
    - [E2E Tests](#e2e-tests)
    - [Test Infrastructure](#test-infrastructure)
    - [Test Stubs](#test-stubs)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Quickstart

### Prerequisites

- Node.js >= 20.0.0
- pnpm (recommended) or npm >= 10.0.0
- Docker — must be running (used for PostgreSQL + Redis in dev, and for tests via Testcontainers)

```bash
pnpm install
cp .env.example .env

pnpm docker:up
pnpm db:generate && pnpm db:migrate

pnpm start:dev
```

Then open:

- OpenAPI Docs (Scalar UI): `http://localhost:3000/api/docs`
- GraphQL: `http://localhost:3000/graphql`
- Health Checks: `http://localhost:3000/api/health`

> [!NOTE]
> Ports and routes may differ depending on your `.env` configuration.

---

## Motivation

This boilerplate is built for teams who want to ship **production-grade NestJS services** quickly — without reinventing
foundational infrastructure.

It focuses on:

- **Strong defaults** (security, logging, config validation)
- **Scalability** (Redis-backed caching + throttling)
- **Observability** (structured logs + health checks for infra dependencies)
- **DX** (SWC builds, clean module boundaries, automated API docs)

---

## Features

| Feature                   | Description                                          |
|---------------------------|------------------------------------------------------|
| 🔐 **Authentication**     | BetterAuth with session-based auth                   |
| 🚀 **Two-Level Caching**  | In-memory LRU + Redis distributed cache              |
| 🛡️ **Rate Limiting**     | Redis-backed distributed throttling (IP-based)       |
| 🗄️ **Database**          | PostgreSQL with Drizzle ORM (beta) + Drizzle Kit     |
| 📊 **GraphQL**            | Apollo Server with auto-generated schema             |
| 🩺 **Health Checks**      | Terminus-based monitoring for all infra dependencies |
| 📝 **Structured Logging** | Pino with JSON output                                |
| 📖 **API Documentation**  | OpenAPI (Nest CLI plugin) + Scalar UI                |
| 🔒 **Security**           | Helmet, CORS, validation pipes                       |
| ⚡ **Graceful Shutdown**   | Zero-downtime friendly shutdown hooks                |
| ⚙️ **Dynamic Config**     | Feature-oriented configuration with validation       |
| ⚡ **Fast Builds**         | SWC + Express (Fastify migration is straightforward) |

---

## Running Locally

### Database Setup

```bash
# Start PostgreSQL and Redis (using Docker)
pnpm docker:up

# Generate database migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate
```

### Running the Application

```bash
# Development (with hot reload)
pnpm start:dev

# Debug mode (with hot reload + inspector)
pnpm start:debug

# Production build
pnpm build
pnpm start:prod
```

### Running Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:cov

# E2E tests
pnpm test:e2e

# E2E watch mode
pnpm test:e2e:watch

# All tests (unit + E2E)
pnpm test:all

# Debug tests (with inspector)
pnpm test:debug
```

> [!NOTE]
> Tests require Docker — Testcontainers provisions a PostgreSQL container automatically.
> Docker Compose is **not** needed for tests.

### Code Quality

```bash
pnpm lint       # ESLint with auto-fix
pnpm format     # Prettier formatting
```

---

## Environment Variables

All configuration is via environment variables. See `.env.example` for a fully commented template.

| Variable                    | Description                                                  | Default                           |
|-----------------------------|--------------------------------------------------------------|-----------------------------------|
| **Application**             |                                                              |                                   |
| `NODE_ENV`                  | Environment (`development`, `staging`, `production`, `test`) | `development`                     |
| `APP_PORT`                  | HTTP listen port                                             | `3000`                            |
| `APP_GLOBAL_ROUTE_PREFIX`   | Base URL prefix for all routes                               | `/api`                            |
| `APP_TRUST_PROXY`           | Express trust proxy setting                                  | `loopback`                        |
| `APP_CORS_ORIGINS`          | Comma-separated allowed CORS origins                         | `http://localhost:3000`           |
| `APP_LOG_LEVEL`             | Minimum log level (`trace` through `fatal`)                  | `trace`                           |
| `APP_LOG_COLLECTOR`         | Log destination                                              | `console`                         |
| **PostgreSQL**              |                                                              |                                   |
| `POSTGRES_HOST`             | Database host                                                | `localhost`                       |
| `POSTGRES_PORT`             | Database port                                                | `5432`                            |
| `POSTGRES_DB`               | Database name                                                | `my_app`                          |
| `POSTGRES_USER`             | Database user                                                | `postgres`                        |
| `POSTGRES_PASSWORD`         | Database password                                            | `postgres`                        |
| `POSTGRES_SSL`              | Enable TLS                                                   | `false`                           |
| **Redis**                   |                                                              |                                   |
| `REDIS_HOST`                | Redis host                                                   | `localhost`                       |
| `REDIS_PORT`                | Redis port                                                   | `6379`                            |
| `REDIS_PASSWORD`            | Redis password (empty = no auth)                             | _(empty)_                         |
| `REDIS_TLS`                 | Enable TLS                                                   | `false`                           |
| `REDIS_CACHE_DB`            | Redis DB number for cache                                    | `0`                               |
| `REDIS_RATE_LIMITER_DB`     | Redis DB number for rate limiter                             | `1`                               |
| **Authentication**          |                                                              |                                   |
| `AUTH_SECRET`               | Signing key for sessions — **change in production**          | _(placeholder)_                   |
| `AUTH_BASE_URL`             | API base URL for auth callbacks                              | `http://localhost:${APP_PORT}`    |
| `AUTH_TRUSTED_ORIGINS`      | Trusted origins for auth flows                               | `${APP_CORS_ORIGINS}`             |
| `AUTH_SESSION_EXPIRES_IN`   | Session TTL in seconds                                       | `604800` (7 days)                 |
| `AUTH_SESSION_UPDATE_AGE`   | Session refresh interval in seconds                          | `86400` (1 day)                   |
| **Cache**                   |                                                              |                                   |
| `CACHE_TTL`                 | Default cache TTL (human-readable: `1h`, `30m`)              | `1h`                              |
| `CACHE_LRU_SIZE`            | Max in-memory LRU cache entries                              | `5000`                            |
| **Rate Limiting**           |                                                              |                                   |
| `RATE_LIMIT_TTL`            | Time window in ms                                            | `60000`                           |
| `RATE_LIMIT_MAX`            | Max requests per window                                      | `100`                             |
| `RATE_LIMIT_BLOCK_DURATION` | Block duration in ms after exceeding limit                   | `60000`                           |
| **OpenAPI**                 |                                                              |                                   |
| `DOCS_PATH`                 | Swagger UI path                                              | `${APP_GLOBAL_ROUTE_PREFIX}/docs` |
| `DOCS_TITLE`                | API docs title                                               | `API`                             |
| **GraphQL**                 |                                                              |                                   |
| `GQL_PLAYGROUND`            | Enable GraphQL Playground                                    | `true`                            |
| `GQL_PATH`                  | GraphQL endpoint path                                        | `/graphql`                        |
| `GQL_INTROSPECTION`         | Enable introspection                                         | `true`                            |

> [!TIP]
> Auth database variables (`AUTH_DATABASE_*`) default to the main PostgreSQL connection.
> Override them only if auth data lives in a separate database.

---

## Project Structure

```txt
src/
├── config/                             # Validated config objects per concern
├── domain/                             # Feature modules (your business logic)
│   ├── <feature>/                      # One directory per feature
│   │   ├── <feature>.module.ts
│   │   ├── <feature>.service.ts
│   │   ├── <feature>.service.spec.ts
│   │   ├── graphql/                    # Resolvers, inputs, object types
│   │   ├── rest/                       # Controllers, request/response DTOs
│   │   └── stubs/                      # Test factories
│   └── shared/                         
├── infra/                              # Infrastructure modules
│   ├── auth/                           # BetterAuth
│   ├── cache/                          # Caching
│   ├── drizzle/                        # Drizzle ORM 
│   ├── graphql/                        # GraphQL with Apollo Server
│   ├── rate_limiter/                   # Rate limiting
├── tools/                              # Utilities
│   ├── health/                         # Health checks (Terminus)
│   ├── logger/                         # Pino structured logging
│   └── openapi/                        # OpenAPI docs (Scalar UI, dev-only)
├── testing/                            # Shared test utilities

test/
├── rest/                # REST E2E tests
├── graphql/             # GraphQL E2E tests
├── test-application.context.ts  # Full app context for E2E
└── test-app.module.ts   # Test version of AppModule
```

The application follows a **clean separation between infrastructure and business logic**. Infrastructure modules (
`src/infra/`) provide all the foundational, cross-cutting concerns that support your business logic — authentication,
caching, database access, etc. Your business logic (services, resolvers, controllers) consumes
these infrastructure capabilities without needing to know their implementation details.

---

## Architecture Overview

![Architecture Diagram](architecture_diagram.svg)

### Why This Separation?

- **Modularity** — Each infra module is self-contained and can be replaced or upgraded independently
- **Testability** — Business logic can be tested in isolation by mocking infra dependencies
- **Consistency** — Cross-cutting concerns (auth, caching, rate limiting) are applied uniformly
- **Maintainability** — Clear boundaries make it easy to locate and modify specific functionality

### Where to Look

| If you want to...          | Look in...                                                                       |
|----------------------------|----------------------------------------------------------------------------------|
| Change database connection | `src/config/database.config.ts`                                                  |
| Modify cache behavior      | `src/config/cache.config.ts`, `src/infra/cache/`                                 |
| Adjust rate limits         | `src/config/rate-limiter.config.ts`                                              |
| Configure authentication   | `src/config/auth.config.ts`, `src/infra/auth/`                                   |
| Customize GraphQL          | `src/config/graphql.config.ts`, `src/infra/graphql/`                             |
| Add health checks          | `src/tools/health/health.module.ts`                                              |
| Configure app middleware   | `src/configure.ts`                                                               |
| Add new infra module       | Create in `src/infra/`, add config in `src/config/`, import in `infra.module.ts` |
| Add a new domain feature   | Create in `src/domain/<feature>/`, register in `features.module.ts`              |

---

## Testing

Tests use **Vitest** with **real PostgreSQL** via Testcontainers — no database mocks. Docker Compose is not needed for
tests.

### Test Runner

The Vitest config defines two projects:

| Project | Pattern                 | What it covers          |
|---------|-------------------------|-------------------------|
| `unit`  | `src/**/*.spec.ts`      | Service logic           |
| `e2e`   | `test/**/*.e2e-spec.ts` | Full HTTP/GraphQL stack |

A **global setup** (`vitest-global.setup.ts`) provisions a shared PostgreSQL testcontainer with all migrations applied,
so individual tests don't need to manage database lifecycle.

### Unit Tests

Unit tests live next to the code they test (e.g., `<feature>.service.spec.ts` alongside `<feature>.service.ts`). They test
**service logic only** — no controller or resolver specs.

Each test uses `TestModuleBuilder` to create an isolated NestJS testing module:

```typescript
const ctx = await TestModuleBuilder.create(YourFeatureModule);
const service = ctx.get(YourFeatureService);
```

`TestModuleBuilder` automatically substitutes infrastructure with test stubs (in-memory cache, testcontainer PostgreSQL,
BetterAuth test utils) while keeping your module under test intact.

```bash
pnpm test                     # Run all unit tests
pnpm test <feature>.service   # Run a specific test file
pnpm test:watch               # Watch mode
pnpm test:cov                 # With coverage report
```

### E2E Tests

E2E tests live in `test/rest/` and `test/graphql/` and exercise the full application stack — HTTP requests through
controllers/resolvers, auth guards, validation pipes, and real database queries.

Each test uses `TestApplicationContext` to boot a complete NestJS application:

```typescript
const ctx = await TestApplicationContext.create();
const client = ctx.client(headers);  // supertest agent

// REST
await client.get('/api/your-resource');

// GraphQL
await ctx.executeGraphql(query, headers);
```

`TestApplicationContext` provides:

- `app` — The NestJS application instance
- `database` — Direct Drizzle database access for seeding
- `auth` — `TestAuthContext` for creating test users and sessions
- `client(headers?)` — Supertest agent for HTTP requests
- `executeGraphql(operation, headers?)` — GraphQL query execution

```bash
pnpm test:e2e                 # Run all E2E tests
pnpm test:e2e <feature>       # Run a specific E2E test
pnpm test:e2e:watch           # Watch mode
```

### Test Infrastructure

| Stub Module             | Replaces            | Behavior                                                       |
|-------------------------|---------------------|----------------------------------------------------------------|
| `TestDrizzleModule`     | `DrizzleModule`     | Connects to the shared testcontainer PostgreSQL instance       |
| `TestAuthModule`        | `AuthModule`        | Uses BetterAuth's `testUtils` plugin for user/session creation |
| `TestCacheModule`       | `CacheModule`       | In-memory cache only (no Redis)                                |
| `TestRateLimiterModule` | `RateLimiterModule` | Rate limiting disabled                                         |

### Test Stubs

Test factories and stubs live in `stubs/` subdirectories within each module:

```txt
src/domain/<feature>/stubs/test-<feature>.factory.ts
src/infra/auth/stubs/test-auth.module.ts
src/infra/auth/stubs/test-user.factory.ts
src/infra/drizzle/stubs/test-drizzle.module.ts
src/infra/cache/stubs/test-cache.module.ts
src/infra/rate_limiter/stubs/test-rate-limiter.module.ts
```

---

## Production Checklist

Before deploying to production:

- [ ] Set a strong `AUTH_SECRET` (and rotate if needed)
- [ ] Ensure `POSTGRES_*` and `REDIS_*` env variables point to production infrastructure
- [ ] Verify CORS settings for allowed origins
- [ ] Verify Helmet/security headers match your environment (proxy/ingress)
- [ ] Configure trusted proxies if behind load balancers / ingress
- [ ] Ensure health checks are wired into your orchestration (K8s, ECS, etc.)
- [ ] Set up log shipping / ingestion (Datadog, ELK, Loki, etc.)
- [ ] Tune Redis TTLs, eviction policies, and memory limits
- [ ] Confirm graceful shutdown works with your orchestrator timeouts

---

## Troubleshooting

### Docker containers fail to start

Ensure Docker is running (`docker info`). Check port availability:
- PostgreSQL: port from `POSTGRES_PORT` (default `5432`)
- Redis: port from `REDIS_PORT` (default `6379`)

### Tests fail with connection errors

Tests use Testcontainers, which requires Docker. Ensure Docker is running.
Docker Compose is **not** needed for tests — Testcontainers provisions its own PostgreSQL container.

### `pnpm db:generate` fails

This runs `db-generate.sh` (a bash script). On Windows, use WSL or Git Bash.

### Database migration errors about missing `auth` schema

The `auth` schema is created by `.database/init-db.sql`, which Docker Compose mounts into the
PostgreSQL container's init directory. If you're using an external database, run the SQL manually:

```sql
CREATE SCHEMA IF NOT EXISTS "auth";
```

### Drizzle ORM API mismatches with documentation

This project uses Drizzle ORM `1.0.0-beta`. Some APIs may differ from the stable Drizzle documentation.
Refer to the [Drizzle ORM beta changelog](https://orm.drizzle.team/) for the correct API.

---

## Contributing

PRs and issues are welcome.

### Development workflow

1. Create a feature branch from `main` (e.g., `feat/add-notifications`, `fix/auth-redirect`)
2. Write tests first when adding behavior
3. Run the full quality check before pushing:
   ```bash
   pnpm lint && pnpm test:all
   ```
4. Open a PR against `main`

### Guidelines

- Keep infra modules isolated and configurable
- Add/extend health indicators when introducing new infra dependencies
- Place test factories and stubs in `stubs/` subdirectories
- Include tests for new behavior
- Ensure linting and all tests pass

---
