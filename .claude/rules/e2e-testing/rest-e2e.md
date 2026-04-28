---
paths:
    - "test/rest/**/*.e2e-spec.ts"
---

## Test naming

- Outer suite: `'<Feature> REST API'`
- Operation groups: `'<HTTP_METHOD> /api/<resource-path>'`

```typescript
describe('Widgets REST API', () => {
    describe('GET /api/widgets/:id', () => {
        describe('given a non-existent id', () => {
            it('responds with NOT_FOUND', async () => { ... });
        });
    });
});
```

## HTTP client

- Use `client()` from `TestApplicationContext` to get an instance of a fully configured HTTP client.

```typescript
const client = await app.client();             // default user
const client = await app.client(otherHeaders); // specific user
const client = await app.client(null);         // unauthenticated
```

To switch user, obtain headers via `app.auth`:

```typescript
const otherUserId = await app.auth.createUser();
const otherHeaders = await app.auth.getAuthHeaders(otherUserId);
const otherClient = await app.client(otherHeaders);
// ...
await app.auth.dropUser(otherUserId);
```

## Status codes

!IMPORTANT: Invalid uuid path params return `400`, while all other body verification errors return `422`.

## Response typing

Cast `response.body` to the domain response type:

```typescript
import { ErrorResponse } from '@/testing/error.response';

const body = response.body as WidgetResponse;    // single
const body = response.body as WidgetResponse[];  // list
const body = response.body as ErrorResponse;     // errors
```

## Post-deletion verification

- After every DELETE 204, confirm the resource is gone using the same client:

## Full example

@.claude/rules/e2e-testing/examples/widgets-rest.e2e-spec.ts
