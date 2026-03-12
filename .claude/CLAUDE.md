# NestJS Backend

NestJS 11 backend with PostgreSQL, Redis, Drizzle ORM, BetterAuth, GraphQL (Apollo), and OpenAPI (Scalar UI).

## Environment

- Node.js >= 20, pnpm
- TypeScript with strict mode enabled — no implicit any, strict null checks
- SWC via NestJS CLI
- PostgreSQL via Drizzle ORM (`1.0.0-beta` — APIs may differ from stable docs) as a primary database
- Testcontainers for tests (auto-provisions PostgreSQL — no Docker Compose needed)
- Docker Compose for dev server (`pnpm docker:up` for PostgreSQL + Redis)
- Vitest with unplugin-swc for test compilation

## Commands

```bash
# Dev
pnpm start:dev              # Start with hot reload (SWC)
pnpm build                  # Production build
pnpm start:prod             # Run production build

# Test
pnpm test                   # Unit tests (src/**/*.spec.ts)
pnpm test:cov               # Unit tests with coverage
pnpm test:e2e               # E2E tests (test/**/*.e2e-spec.ts)
pnpm test:all               # Unit + E2E

# Run specific test file
pnpm test accounts.service  # Single unit test
pnpm test:e2e accounts      # Single E2E test

# Containers
pnpm docker:up              # Start PostgreSQL + Redis containers
pnpm docker:down            # Stop containers

# Database
pnpm db:generate            # Generate Drizzle migrations
pnpm db:migrate             # Apply migrations
pnpm db:push                # Push schema directly (dev only)
pnpm db:studio              # Open Drizzle Studio (visual DB browser)

# Code Quality
pnpm lint                   # ESLint with auto-fix
pnpm format                 # Prettier formatting
```

## Architecture Overview

- Domain modules under `src/domain/<feature>/` — each has service, graphql/, rest/, stubs/
- Centralized DB schema in `src/infra/drizzle/` (schema.ts, relations.ts, types.ts)
- BetterAuth for authentication — `@CurrentUser()` decorator extracts `AuthUser`, global auth guard
- Global ValidationPipe — validation errors return **422** (not 400)
- L1/L2 caching (memory + Redis) — `@NoCache()` to bypass
- Global rate limiting via Redis — `@SkipThrottle()` to bypass

## Testing

- Unit tests: `src/**/*.spec.ts` — service logic only (no controller/resolver specs)
- E2E tests: `test/**/*.e2e-spec.ts` — full HTTP/GraphQL stack
- Real PostgreSQL via Testcontainers — no mocks, no Docker Compose for tests
- Test stubs in `stubs/` subdirectories (not `testing/` or `__mocks__/`)

## Hooks (auto-applied)

- **Auto-format**: Prettier runs on `.ts` files after every Write/Edit — do not manually format.
- **Protected files**: `.env` and lock files are blocked from Write/Edit.
