# NestJS Backend

NestJS 11 backend with PostgreSQL, Redis, Drizzle ORM, BetterAuth, GraphQL (Apollo), and OpenAPI (Scalar UI).

## Environment

- pnpm as a package manager
- TypeScript with strict mode enabled — no implicit any, strict null checks
- SWC via NestJS CLI
- PostgreSQL via Drizzle ORM (`1.0.0-beta` — APIs may differ from stable docs) as a primary database
- Docker Compose for dev server (`pnpm docker:up` for PostgreSQL + Redis)
- Vitest with unplugin-swc for test compilation
- Testcontainers for tests (auto-provisions PostgreSQL and Redis — no Docker Compose needed)
- BetterAuth for authentication (admin, apikey, testUsers plugins)
- OpenAPI (Scalar UI) for documentation
- ESLint + Prettier for code quality
- GraphQL (Apollo) for queries

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

# Database
pnpm db:generate            # Generate Drizzle migrations (requires running DB)
pnpm db:migrate             # Apply BetterAuth + Drizzle migrations

# Code Quality
pnpm lint                   # ESLint with auto-fix
pnpm format                 # Prettier formatting
```