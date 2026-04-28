---
paths:
    - "test/graphql/**/*.e2e-spec.ts"
---

## Test naming

- Outer suite: `'Feature (GraphQL)'`
- Operation groups: `'Query: queryName'` / `'Mutation: mutationName'`

```typescript
describe('Widgets (GraphQL)', () => {
    describe('Query: widget', () => {
        describe('given a non-existent id', () => {
            it('responds with NOT_FOUND', async () => { ... });
        });
    });
});
```

## Executing operations

- Use `app.executeGraphql()` to execute operations as the default test user. Pass the expected `data` shape as the type
  parameter:

```typescript
const result = await app.executeGraphql<{
    widget: { id: string; name: string }; // only fields being asserted
}>({
    query: `query($id: ID!) { widget(id: $id) { id name } }`, // inline literal — never an external .gql file
    variables: { id: widgetId },                              // pass dynamic values via variables — never interpolate
});
```

To switch user, pass headers as the second argument:

```typescript
const otherUserId = await app.auth.createUser();
const otherHeaders = await app.auth.getAuthHeaders(otherUserId);
const result = await app.executeGraphql({ query }, otherHeaders);
// Pass null for unauthenticated requests
await app.auth.dropUser(otherUserId);
```

## Asserting results

!IMPORTANT: Always check `result.errors` before asserting `result.data`. Use `result.errors![0].message` after
`toBeDefined()` — the `!` assertion is intentional.

## Post-deletion verification

- After every delete mutation, confirm the resource is gone with a follow-up query.

## Full example

@.claude/rules/e2e-testing/examples/widgets-gql.e2e-spec.ts
