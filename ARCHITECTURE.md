# Architecture

## Source Of Truth

`src/api/index.json` is the source of truth for the Zapier app.

It owns:

- API server URL
- authentication schemes
- paths and HTTP methods
- path parameters
- request body schemas
- response schemas

TypeScript code should not contain per-endpoint route builders or per-action
payload builders for normal REST operations.

## Module Map

```text
src/index.ts
src/api/index.json
src/authentication/
src/core/zapier/
src/openapi/
```

`index.js` is a CommonJS compatibility shim for Zapier CLI. Compiled files are
emitted to `dist/`.

## Runtime Flow

```text
src/index.ts
  -> load OpenAPI document
  -> build authentication from securitySchemes
  -> select create operations by operationId
  -> generate Zapier inputFields and perform functions
```

`src/openapi/zapier.ts` owns operation discovery, URL building, auth headers,
request body construction, and response id mapping.

`src/openapi/schema.ts` owns JSON Schema normalization and Zapier field mapping.

## Adding Capabilities

Prefer extending generic inference in the OpenAPI adapter instead of adding
feature-specific code or backend-owned Zapier metadata.

Examples:

- Need to expose another create: add its `operationId` to the local selector.
- Need a nested body: the adapter detects a single required object body property.
- Need to hide backend-managed fields: add a generic exclusion rule in the adapter.
- Need Zapier's result `id`: the adapter searches success response schemas for `id` fields.

If future triggers, searches, dropdowns, pagination, or dynamic fields are
needed, add generic inference support and tests around the adapter.

## Testing Strategy

Tests should verify generated behavior:

- OpenAPI operation discovery
- field generation from schemas
- request method, URL encoding, headers, and body shape
- auth fields from OpenAPI security schemes
- response `id` mapping

External API calls are not made during tests.
