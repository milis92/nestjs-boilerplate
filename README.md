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
| 📤 **File Uploads**        | Multer with disk usage health checks                 |
| 📋 **Job Queues**          | BullMQ (Redis-backed) with Bull Board UI             |
| 🤖 **LLM Integration**    | AI SDK with OpenAI, Anthropic, Google providers      |
| ⚡ **Fast Builds**         | SWC + Express (Fastify migration is straightforward) |

---

## Running Locally

### Database Setup

```bash
# Start PostgreSQL and Redis (using Docker)
pnpm docker:up

# Stop containers
pnpm docker:down

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
| `POSTGRES_SSL_REJECT_UNAUTHORIZED` | Reject unauthorized TLS certificates                  | `true`                            |
| **Redis**                   |                                                              |                                   |
| `REDIS_HOST`                | Redis host                                                   | `localhost`                       |
| `REDIS_PORT`                | Redis port                                                   | `6379`                            |
| `REDIS_PASSWORD`            | Redis password (empty = no auth)                             | _(empty)_                         |
| `REDIS_TLS`                 | Enable TLS                                                   | `false`                           |
| `REDIS_REJECT_UNAUTHORIZED` | Reject unauthorized TLS certificates                         | `false`                           |
| `REDIS_CA`                  | Path to CA certificate for TLS                               | _(empty)_                         |
| `REDIS_KEY`                 | Path to client private key for TLS                           | _(empty)_                         |
| `REDIS_CERT`                | Path to client certificate for TLS                           | _(empty)_                         |
| `REDIS_CONNECT_TIMEOUT`     | Connection timeout in milliseconds                           | `10000`                           |
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
| `DOCS_DESCRIPTION`          | API docs description                                         | `API documentation`               |
| `DOCS_VERSION`              | API version string in docs                                   | `1.0`                             |
| **GraphQL**                 |                                                              |                                   |
| `GQL_PLAYGROUND`            | Enable GraphQL Playground                                    | `true`                            |
| `GQL_DEBUG`                 | Enable GraphQL debug mode                                    | `true`                            |
| `GQL_PATH`                  | GraphQL endpoint path                                        | `/graphql`                        |
| `GQL_INTROSPECTION`         | Enable introspection                                         | `true`                            |
| **Upload**                  |                                                              |                                   |
| `UPLOAD_DEST`               | Destination directory for uploaded files                     | `./uploads`                       |
| `UPLOAD_DISK_THRESHOLD`     | Disk usage threshold (0–1) before rejecting uploads          | `0.9`                             |
| **LLM**                     |                                                              |                                   |
| `LLM_PROVIDER`              | LLM provider (`openai`, `anthropic`, `google`, `openai-compatible`) | `openai`                    |
| `LLM_MODEL`                 | Model identifier for the chosen provider                     | `gpt-4o-mini`                     |
| `LLM_API_KEY`               | API key for the LLM provider                                 | _(empty)_                         |
| `LLM_BASE_URL`              | Custom endpoint URL (for proxies or self-hosted models)      | _(provider default)_              |

| **Auth Database** (override only if auth lives in a separate DB) | | |
| `AUTH_DATABASE_HOST`        | Auth database host                                           | `${POSTGRES_HOST}`                |
| `AUTH_DATABASE_PORT`        | Auth database port                                           | `${POSTGRES_PORT}`                |
| `AUTH_DATABASE_DB`          | Auth database name                                           | `${POSTGRES_DB}`                  |
| `AUTH_DATABASE_USER`        | Auth database user                                           | `${POSTGRES_USER}`                |
| `AUTH_DATABASE_PASSWORD`    | Auth database password                                       | `${POSTGRES_PASSWORD}`            |
| `AUTH_DATABASE_SSL`         | Enable TLS for auth database                                 | `${POSTGRES_SSL}`                 |
| `AUTH_DATABASE_SSL_REJECT_UNAUTHORIZED` | Reject unauthorized TLS certificates for auth DB | `${POSTGRES_SSL_REJECT_UNAUTHORIZED}` |

---

## Project Structure

```txt
src/
├── config/                             # Validated config objects per concern
├── domain/                             # Feature modules (your business logic)
│   ├── features.module.ts              # Registers all feature modules
│   └── shared/                         # Shared domain utilities
│       ├── decorators/                 # Custom decorators
│       ├── errors/                     # Domain error types
│       └── helpers/                    # Shared helpers
├── infra/                              # Infrastructure modules
│   ├── infra.module.ts                 # Registers all infra modules
│   ├── auth/                           # BetterAuth
│   ├── cache/                          # Two-level caching (LRU + Redis)
│   ├── drizzle/                        # Drizzle ORM
│   ├── graphql/                        # GraphQL with Apollo Server
│   ├── llm/                            # LLM integration (AI SDK)
│   ├── queue/                          # BullMQ job queues + Bull Board
│   ├── rate_limiter/                   # Redis-backed rate limiting
│   └── upload/                         # File uploads (Multer)
├── tools/                              # Utilities
│   ├── health/                         # Health checks (Terminus)
│   ├── logger/                         # Pino structured logging
│   └── openapi/                        # OpenAPI docs (Scalar UI, dev-only)
├── testing/                            # Shared test utilities
│   ├── test-module.builder.ts          # Unit test module factory
│   ├── test-constants.ts               # Shared test constants
│   └── error.response.ts              # Error response helpers

test/
├── rest/                               # REST E2E tests
├── graphql/                            # GraphQL E2E tests
├── test-application.context.ts         # Full app context for E2E
└── test-app.module.ts                  # Test version of AppModule
```

New domain features follow this layout (none scaffolded yet — use the structure as a template):

```txt
src/domain/<feature>/
├── <feature>.module.ts
├── <feature>.service.ts
├── <feature>.service.spec.ts
├── graphql/                            # Resolvers, inputs, object types
├── rest/                               # Controllers, request/response DTOs
└── stubs/                              # Test factories
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
| Configure file uploads     | `src/config/upload.config.ts`, `src/infra/upload/`                               |
| Configure job queues       | `src/config/redis.config.ts`, `src/infra/queue/`                                 |
| Configure LLM providers    | `src/config/llm.config.ts`, `src/infra/llm/`                                    |
| Add new infra module       | Create in `src/infra/`, add config in `src/config/`, import in `infra.module.ts` |
| Add a new domain feature   | Create in `src/domain/<feature>/`, register in `features.module.ts`              |

---

## Testing

Tests use **Vitest** with **real PostgreSQL** via Testcontainers — no database mocks. Docker Compose is not needed for
tests.

> [!NOTE]
> The test infrastructure is fully wired, but no domain feature tests have been written yet.
> The patterns below describe the intended testing approach for new features.

### Test Runner

The Vitest config defines two projects:

| Project | Pattern                 | What it covers          |
|---------|-------------------------|-------------------------|
| `unit`  | `src/**/*.spec.ts`      | Service logic           |
| `e2e`   | `test/**/*.e2e-spec.ts` | Full HTTP/GraphQL stack |

A **global setup** (`vitest-global.setup.ts`) provisions shared PostgreSQL and Redis testcontainers with all migrations
applied, so individual tests don't need to manage database or queue lifecycle.

### Unit Tests

Unit tests live next to the code they test (e.g., `<feature>.service.spec.ts` alongside `<feature>.service.ts`). They test
**service logic only** — no controller or resolver specs.

Each test uses `TestModuleBuilder` to create an isolated NestJS testing module with real infrastructure stubs
(testcontainer PostgreSQL, BetterAuth test utils, in-memory cache, stub LLM). Your feature module is imported as-is —
only infrastructure modules are swapped.

#### `TestModuleBuilder`

```typescript
// Basic usage — creates a compiled NestJS testing module
const ctx = await TestModuleBuilder.create(YourFeatureModule);
const service = ctx.get(YourFeatureService);

// With provider overrides (e.g., mock an external dependency)
const ctx = await TestModuleBuilder.create(YourFeatureModule, [
  { token: ExternalApiService, useValue: mockApiService },
]);
```

`TestModuleBuilder.create()` automatically registers these test stubs alongside your module:

| Stub                  | What it provides                                    |
|-----------------------|-----------------------------------------------------|
| `TestDrizzleModule`   | Drizzle connected to the shared testcontainer PG    |
| `TestAuthModule`      | BetterAuth with `testUsers` plugin                  |
| `TestCacheModule`     | In-memory cache (no Redis)                          |
| `TestQueueModule`     | Real BullMQ backed by a Redis testcontainer         |
| `TestLlmModule`       | Stub LLM model (no external API calls)              |

#### `TestModuleContext`

The context object returned by `TestModuleBuilder.create()`:

| Member        | Type               | Description                                         |
|---------------|--------------------|-----------------------------------------------------|
| `get(token)`  | `<T>(token) => T`  | Resolve any provider from the compiled module       |
| `database`    | `DrizzleDatabase`  | Direct Drizzle access for seeding and cleanup       |
| `auth`        | `TestAuthContext`   | Create/drop test users and generate auth headers    |
| `teardown()`  | `Promise<void>`    | Close the module (call in `afterAll`)               |

#### `TestAuthContext`

Available via `ctx.auth` in both unit and E2E tests:

| Method                       | Returns                    | Description                                      |
|------------------------------|----------------------------|--------------------------------------------------|
| `defaultUserId()`            | `Promise<UserId>`          | Lazily creates and caches a default test user    |
| `createUser()`               | `Promise<UserId>`          | Creates a fresh user with a random email         |
| `dropUser(userId)`           | `Promise<void>`            | Deletes a user (clean up in tests)               |
| `getAuthHeaders(userId)`     | `Promise<Record<string, string>>` | Returns auth headers for authenticated requests |

#### Test constants

`@/testing/test-constants` provides helpers for "not found" scenarios:

| Export              | Usage                                                     |
|---------------------|-----------------------------------------------------------|
| `NON_EXISTENT_UUID` | Valid UUID v7 that never matches a real entity (for E2E)  |
| `nonExistentId()`   | Returns the nil UUID (for unit tests)                     |

```bash
pnpm test                     # Run all unit tests
pnpm test <feature>.service   # Run a specific test file
pnpm test:watch               # Watch mode
pnpm test:cov                 # With coverage report
```

### E2E Tests

E2E tests live in `test/rest/` and `test/graphql/` and exercise the full application stack — HTTP requests through
controllers/resolvers, auth guards, validation pipes, and real database queries.

Each test uses `TestApplicationContext` to boot a complete NestJS application with real middleware, guards, and validation
pipes — the same stack as production.

#### `TestApplicationContext`

```typescript
const ctx = await TestApplicationContext.create();

// REST — client() returns a supertest agent with auth headers pre-set
const client = await ctx.client();
await client.get('/api/v1/your-resource').expect(200);

// REST — unauthenticated request (pass null)
const anonClient = await ctx.client(null);
await anonClient.get('/api/v1/your-resource').expect(401);

// REST — custom user
const userId = await ctx.auth.createUser();
const headers = await ctx.auth.getAuthHeaders(userId);
const userClient = await ctx.client(headers);

// GraphQL
const result = await ctx.executeGraphql({ query: `{ yourQuery { id } }` });

// Direct DB seeding
await ctx.database.insert(yourTable).values({ ... });
```

| Member                                 | Type                       | Description                                              |
|----------------------------------------|----------------------------|----------------------------------------------------------|
| `app`                                  | `INestApplication`         | Full NestJS app instance                                 |
| `database`                             | `DrizzleDatabase`          | Direct Drizzle access for seeding and assertions         |
| `auth`                                 | `TestAuthContext`           | Same auth utilities as unit tests (see above)            |
| `client(headers?)`                     | `Promise<SuperTestAgent>`  | Supertest agent; defaults to authenticated default user  |
| `client(null)`                         | `Promise<SuperTestAgent>`  | Supertest agent with no auth (unauthenticated requests)  |
| `executeGraphql(operation, headers?)`  | `Promise<GraphQLResponse>` | Sends a GraphQL POST to `/graphql`                       |
| `teardown()`                           | `Promise<void>`            | Close the app (call in `afterAll`)                       |

`TestApplicationContext` builds on `TestModuleBuilder` internally, so it gets the same infrastructure stubs. The
difference is that it also calls `configure(app)` to apply all middleware, pipes, and guards — making it a true
integration test against the full HTTP/GraphQL stack.

```bash
pnpm test:e2e                 # Run all E2E tests
pnpm test:e2e <feature>       # Run a specific E2E test
pnpm test:e2e:watch           # Watch mode
```

### Test Stubs

Infrastructure stubs and test factories live in `stubs/` subdirectories within each module:

```txt
src/infra/auth/stubs/test-auth.module.ts
src/infra/auth/stubs/test-user.factory.ts
src/infra/drizzle/stubs/test-drizzle.module.ts
src/infra/cache/stubs/test-cache.module.ts
src/infra/rate_limiter/stubs/test-rate-limiter.module.ts
src/infra/queue/stubs/test-queue.module.ts
src/infra/llm/stubs/test-llm.module.ts
src/infra/llm/stubs/test-llm.service.ts
```

Domain features add their own stubs at `src/domain/<feature>/stubs/test-<feature>.factory.ts`.

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

This runs `drizzle-kit generate` via `dotenvx`. Ensure your `.env` file exists and your database is running.

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
