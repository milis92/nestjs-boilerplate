# Todo App Design

A simple CRUD feature that lets authenticated users create and manage their own todo items. First domain feature in the boilerplate.

## Data Model

Single `todos` table in the public schema:

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | PK, default `uuidv7()` |
| `title` | `varchar(255)` | NOT NULL |
| `ownerId` | `uuid` | NOT NULL, FK to user, cascade delete |
| `createdAt` | `timestamp` | NOT NULL, auto-set |
| `updatedAt` | `timestamp` | NOT NULL, auto-set on update |

Uses existing `primaryId`, `timestamps`, and `withUserId('cascade')` helpers from the schema. A relation from `todos` to `user` defined in `relations.ts`.

## Module Structure

All files under `src/domain/todos/`:

```
src/domain/todos/
├── todo.model.ts           # GraphQL object type
├── todos.schema.ts         # Drizzle table definition
├── todos.service.ts        # Business logic + DB access
├── todos.controller.ts     # REST endpoints
├── todos.resolver.ts       # GraphQL queries/mutations
├── todos.module.ts         # NestJS module
├── dto/
│   ├── create-todo.request.ts   # Validation for create
│   ├── update-todo.request.ts   # Validation for update
│   └── todo.response.ts         # REST response shape
└── todos.service.spec.ts   # Unit test
```

E2E test at `test/todos.e2e-spec.ts`.

Module registered in `app.module.ts`.

## Architecture

Single service, dual API surfaces:

- **`TodosService`** — all business logic and Drizzle queries. Injected with `DRIZZLE_DB` token. All queries filtered by `ownerId` for user isolation.
- **`TodosController`** — REST endpoints delegating to the service.
- **`TodosResolver`** — GraphQL queries/mutations delegating to the service.

## REST API

All endpoints require authentication. Ownership enforced — returns 404 if todo doesn't exist or belongs to another user.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/todos` | Create a todo |
| `GET` | `/todos` | List current user's todos |
| `GET` | `/todos/:id` | Get a single todo by ID |
| `PATCH` | `/todos/:id` | Update a todo's title |
| `DELETE` | `/todos/:id` | Delete a todo |

## GraphQL API

Same auth and ownership rules as REST.

| Type | Name | Description |
|------|------|-------------|
| Query | `todos` | List current user's todos |
| Query | `todo(id)` | Get a single todo |
| Mutation | `createTodo(input)` | Create a todo |
| Mutation | `updateTodo(id, input)` | Update a todo |
| Mutation | `deleteTodo(id)` | Delete a todo, returns boolean |

## DTOs

**`CreateTodoRequest`**: `title` (string, required, max 255 chars).

**`UpdateTodoRequest`**: `title` (string, optional, max 255 chars).

**`TodoResponse`**: `id`, `title`, `createdAt`, `updatedAt`. No `ownerId` exposed in responses.

## Error Handling

Uses existing `ServiceError` pattern:

- `ServiceError.notFound('todo')` when todo doesn't exist or isn't owned by requesting user.
- Validation errors handled by NestJS validation pipe (422).

## Testing

### Unit Tests (`todos.service.spec.ts`)

- Uses `TestModuleBuilder` with real database via testcontainers.
- Tests all five operations: create, list, get, update, delete.
- Verifies ownership isolation: user A cannot access user B's todos.
- Verifies `ServiceError.notFound` on missing or not-owned todos.

### E2E Tests (`test/todos.e2e-spec.ts`)

- Uses `TestApplicationContext` for full NestJS app.
- Tests REST endpoints via supertest.
- Tests GraphQL queries/mutations via `executeGraphql()`.
- Verifies auth enforcement: unauthenticated requests rejected.
- Verifies ownership enforcement across users.
