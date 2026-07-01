# Dokaai Zapier Integration

Zapier Platform CLI integration generated from the Dokaai OpenAPI contract.

The API source of truth is `src/api/index.json`. Zapier actions are generated
from plain OpenAPI operations selected by `operationId`. There are no
hand-written feature action modules.

## Setup

```bash
npm install
npm run build
npm test
```

## Development Commands

```bash
npm run build
npm run generate:tests
npm run typecheck
npm run lint
npm test
npm run validate
npm run check
```

`npm run build` compiles TypeScript and copies `src/api/index.json` into `dist`
so runtime code and tests use the same OpenAPI contract.

`npm run generate:tests` rewrites generated operation tests from
`src/zapier-operation-ids.ts` and `src/api/index.json`.

## How Actions Are Created

`src/index.ts` loads `src/api/index.json` and passes it to:

- `buildAuthentication`: builds Zapier auth fields from OpenAPI `securitySchemes`.
- `buildZapierCreatesFromOpenApi`: builds Zapier creates from selected OpenAPI `operationId`s.

Example selector:

```ts
const zapierCreateOperationIds = ['addCustomersToPool'] as const;
```

The generator derives:

- URL and method from the OpenAPI path item.
- Auth headers from `securitySchemes`.
- Zapier input fields from path params and JSON request body schema.
- Request body wrappers by detecting a single required object body property.
- Returned `id` from response schema fields such as `id`, `customerId`, or nested `data.customerId`.
- Zapier key from `operationId`, for example `addCustomersToPool` becomes `add_customers_to_pool`.

## Adding An Operation

1. Add or update the endpoint in `src/api/index.json`.
2. Add the operationId to `zapierCreateOperationIds` in `src/zapier-operation-ids.ts`.
3. Run `npm run generate:tests`.
4. Run `npm test` and `npm run validate`.

Do not add a hand-written action file for normal REST actions. If an endpoint
needs behavior the generator cannot infer, add generic inference support to the
OpenAPI adapter first.

## Current Operation Keys

Creates:

- `add_customers_to_pool`, generated from `operationId: addCustomersToPool`

No triggers or searches are registered at the moment.
