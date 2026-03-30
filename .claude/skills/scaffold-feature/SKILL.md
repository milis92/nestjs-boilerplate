---
name: scaffold-feature
description: Orchestrate full feature scaffolding by invoking layer-specific skills in sequence
---

# scaffold-feature

Full-stack feature scaffolding orchestrator. Creates all files for a new domain feature by invoking layer skills in the correct order.

## Inputs

Gather from the user:
- `feature` — singular lowercase (e.g., `widget`)
- `Feature` — PascalCase (e.g., `Widget`)
- `features` — plural lowercase (e.g., `widgets`)
- `Features` — PascalCase plural (e.g., `Widgets`)
- `columns` — domain-specific columns beyond the standard set (id, ownerId, timestamps)
- `enumName` — optional status/type enum
- `enumValues` — optional enum values

## Directory structure created

```
src/domain/<feature>/
├── <feature>.model.ts
├── <features>.service.ts
├── <features>.service.spec.ts
├── <features>.module.ts
├── stubs/
│   └── test-<feature>.factory.ts
├── rest/
│   ├── <features>.controller.ts
│   ├── requests/
│   │   ├── create-<feature>.request.ts
│   │   └── update-<feature>.request.ts
│   └── responses/
│       └── <feature>.response.ts
└── graphql/
    ├── <features>.resolver.ts
    ├── <feature>.object.ts
    └── <feature>.input.ts

test/
├── rest/<features>-rest.e2e-spec.ts
├── graphql/<features>-gql.e2e-spec.ts
```

## Execution order

Run these skills in sequence. Each skill creates its files and runs its own verify step.

1. **`/scaffold-database`** — Add pgEnum, pgTable to schema.ts, row types to types.ts
2. Run `pnpm db:generate && pnpm db:migrate` to create and apply migration
3. **`/scaffold-model`** — Create `<feature>.model.ts` with domain class, ID type, enum, Create/Update types
4. **`/scaffold-service`** — Create `<features>.service.ts` with all CRUD methods
5. **Wire the module** — Create `<features>.module.ts`:
   ```typescript
   import { Module } from '@nestjs/common';
   import { <Features>Service } from './<features>.service';
   import { <Features>Controller } from './rest/<features>.controller';
   import { <Features>Resolver } from './graphql/<features>.resolver';

   @Module({
     providers: [<Features>Service, <Features>Resolver],
     controllers: [<Features>Controller],
     exports: [<Features>Service],
   })
   export class <Features>Module {}
   ```
6. **Register in FeaturesModule** — Add import to `src/domain/features.module.ts`
7. **`/scaffold-rest`** — Create controller, request DTOs, response DTO
8. **`/scaffold-graphql`** — Create resolver, object type, input types
9. **`/scaffold-unit-test`** — Create service spec + test factory
10. **`/scaffold-e2e-test`** — Create REST + GraphQL E2E tests

## Post-scaffolding

After all files are created:
1. Run `pnpm lint` to fix formatting
2. Run `pnpm test <features>.service` to verify unit tests pass
3. Run `pnpm test:e2e <features>` to verify E2E tests pass
4. Commit all files with message: `feat(<features>): scaffold <feature> feature`
