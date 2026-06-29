# Architecture

## Module Map

```text
src/index.ts
src/authentication/
src/config/
src/core/http/
src/core/validation/
src/core/zapier/
src/features/customers/
src/features/customer-pools/
src/features/target-audiences/
```

`index.js` is only a CommonJS compatibility shim for Zapier CLI. Compiled files are emitted to `dist/`.

The Dokaai API base URL is read from the required `DOKAAI_API_BASE_URL` environment variable through `src/config/env.ts`. Do not hard-code the production URL in source modules.

## Dependency Direction

Allowed flow:

```text
src/index.ts
  -> feature registration modules
  -> actions/triggers
  -> feature API + fields + transforms
  -> core HTTP/validation/Zapier helpers
  -> config
```

Rules:

- `core/` must not import from `features/`.
- Features must not import another feature's internals.
- Cross-feature logic belongs in `core/` only when it is domain-neutral.
- Feature API functions must not depend on Zapier operation definitions.
- Payload builders and response transformers stay pure.
- `src/index.ts` composes the app only.

## Request Lifecycle

Feature API functions validate required identifiers, build a path using `src/config/api.ts`, then call `requestDokaaiApi`.

`requestDokaaiApi` owns:

- base URL composition from `DOKAAI_API_BASE_URL`
- auth headers
- `Accept` header
- JSON `Content-Type` when a body is present
- forwarding Zapier request options

Domain payload shape is not guessed by the HTTP helper.

## Authentication Flow

Authentication is custom API-key auth. The only credential keys are:

- `x-client-key`
- `x-client-secret`

They are password fields and are sent as headers. Operation outputs and tests must not return credential values.

## Dynamic Customer Fields

The customer attributes endpoint is fetched through `fetchCustomerAttributes`. Field construction is centralized in `buildCustomerFields`.

Create mode:

- includes active, well-formed attributes
- respects `isMandatory`
- supports array fields as Zapier list fields

Update mode:

- makes every dynamic field optional
- excludes `uniqueCustomerId`
- still relies on the update payload builder to strip `uniqueCustomerId` defensively

Missing `projectId` or `customerPoolId` returns no dynamic fields and avoids an API request.

## Create Versus Update Payloads

Create Customer preserves the converted API contract:

```json
{
  "customerData": {
    "name": "Ada"
  }
}
```

Update Customer sends editable values at the body root:

```json
{
  "name": "Updated Name"
}
```

Update never wraps in `customerData`, strips routing inputs and `uniqueCustomerId`, preserves `false` and `0`, and rejects empty updates with `MissingUpdateData`.

## Error Policy

Validation errors use stable Zapier error codes such as `MissingProjectId`, `MissingCustomerPoolId`, `MissingCustomerId`, `MissingTargetAudienceListId`, and `MissingUpdateData`.

HTTP status handling uses Zapier response `throwForStatus`. API envelopes are treated as untrusted data and narrowed before use.

Never include authentication secrets in thrown errors, logs, fixtures, or returned operation output.

## Testing Strategy

Tests are split by behavior:

- pure unit tests for field generation, payload builders, response transforms, and ID normalization
- operation-level tests with mocked `z.request` for HTTP method, URL encoding, headers, bodies, and errors

External API calls are not made during tests.

## Extension Checklist

- Preserve existing operation keys.
- Add endpoint builders to `src/config/api.ts`.
- Encode path segments exactly once through config path builders.
- Keep query parameters such as `attributeTypes` explicit.
- Add pure payload and response tests.
- Add operation tests for request method, path, body, headers, and stable `id`.
- Run `npm run check`.
