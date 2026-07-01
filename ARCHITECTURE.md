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
src/core/zapier/
src/openapi/
src/zapier/actions/
src/zapier/authentication/
src/zapier/dynamic-fields/
src/zapier/plugins/
src/zapier/searches/
```

`index.js` is a CommonJS compatibility shim for Zapier CLI. Compiled files are
emitted to `dist/`.

## Runtime Flow

```text
src/index.ts
  -> load OpenAPI document
  -> build authentication from securitySchemes
  -> select create operations by operationId
  -> select search operations by operationId
  -> generate Zapier inputFields and perform functions
```

`src/zapier/actions/openapi-creates.ts` owns non-GET operation discovery, URL
building, request body construction, and response id mapping for creates.

`src/zapier/searches/openapi-searches.ts` owns GET operation discovery, URL
building, query params, and result normalization for searches.

`src/openapi/runtime.ts` owns shared URL, method, auth header, path template,
and small runtime helpers.

`src/openapi/schema.ts` owns JSON Schema normalization and Zapier field mapping.

`src/zapier/dynamic-fields/` owns reusable dynamic dropdown loaders.

`src/zapier/plugins/` owns small operation plugins that are still derived from
OpenAPI plus runtime data. The current plugin loads customer pool custom
attribute fields for customer create/update actions.

## Adding Capabilities

Prefer extending generic inference in the OpenAPI adapter instead of adding
feature-specific code or backend-owned Zapier metadata.

Examples:

- Need to expose another create: add its `operationId` to the local selector.
- Need to expose another GET: add its `operationId` to the search selector.
- Need a nested body: the adapter detects a single required object body property.
- Need to hide backend-managed fields: add a generic exclusion rule in the adapter.
- Need Zapier's result `id`: the adapter searches success response schemas for `id` fields.
- Need a reusable dropdown: add a dynamic-field applier keyed by field name and backed by an OpenAPI operation.

If future triggers, pagination, or dynamic fields are needed, add generic
inference support or a reusable adapter with tests around the generated output.

## Current Dynamic Behavior

- `projectId` is a dropdown loaded from `getAllProjectsWithService`.
- `customerPoolId` is a dropdown loaded from `getAllCustomerPoolInProject`.
- `targetAudienceListId` and `filterOutTALId` are dropdowns loaded from `getTargetAudienceLists`.
- `notificationHandlerId` is a dropdown loaded from `getAllNotificationHandlersInProject`.
- `customerId` and `customerIds` stay manual.
- Customer pool custom attributes are loaded from `getPoolCustomerAttribute`.

Custom attributes use their plain backend `fieldName` as the Zapier input key.
They are submitted as plain fields in the generated request body. Do not wrap
them in `customAttribute` unless that field appears in the OpenAPI request body.

## Testing Strategy

Tests should verify generated behavior:

- OpenAPI operation discovery
- field generation from schemas
- request method, URL encoding, headers, and body shape
- auth fields from OpenAPI security schemes
- response `id` mapping
- dynamic dropdown request shape and returned choices
- plugin output for dynamic fields

External API calls are not made during tests.
