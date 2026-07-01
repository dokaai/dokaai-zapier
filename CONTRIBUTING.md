# Contributing

## Branch And Commit Expectations

Use focused branches and small commits. Do not commit generated `dist/`, local `.env` files, Zapier session files, logs, or unrelated formatting churn.

## Required Checks

Run before opening or updating a PR:

```bash
npm run build
npm run typecheck
npm run lint
npm test
npm run validate
```

`npm run check` runs the same local gates in order.

## Naming Conventions

- Operation keys stay snake_case and stable.
- OpenAPI `operationId`s stay camelCase and come from `src/api/index.json`.
- Local module and folder names use kebab-case.
- Dynamic field modules should be named after the field or resource they load.
- Tests that cover generated OpenAPI behavior should be generated or derived from `src/api/index.json`.

## Adding An Operation

1. Add or update the endpoint in `src/api/index.json`.
2. Add the `operationId` to `zapierActionOperationIds` for non-GET operations or `zapierSearchOperationIds` for GET operations.
3. Run `npm run generate:tests`.
4. Run `npm test`.
5. Run `npm run validate` before pushing to Zapier.

Do not add hand-written action/search modules for normal REST endpoints. The
OpenAPI adapter should generate method, URL, input fields, query params, body
shape, auth headers, and response ids.

## Adding Dynamic Behavior

- Prefer a reusable dynamic-field applier under `src/zapier/dynamic-fields/`.
- Reuse an OpenAPI `operationId` for the loader when possible.
- Keep dynamic field keys aligned with backend field names.
- Add unit tests for dropdown request URL, params, auth headers, and returned `{ results, paging_token }`.
- For customer pool custom attributes, use the plain backend `fieldName` as the Zapier key. Do not add a `customAttribute__` prefix.
- Do not wrap dynamic customer attributes in `customAttribute` unless the OpenAPI request body contains that property.

## Contract Rules

- Preserve HTTP methods, paths, query parameters, and response shapes from `src/api/index.json`.
- Do not duplicate Dokaai routes in feature code.
- Do not hard-code request body wrappers that are not present in the OpenAPI schema.
- If an operation has a single required object body property, the adapter may use it as the request body root.
- `customerId` and `customerIds` are currently manual fields, not dropdowns.

## Prohibited Patterns

- Duplicating the Dokaai API base URL.
- Hard-coding the Dokaai API base URL outside environment configuration.
- Returning, logging, or serializing auth secrets.
- Adding hand-written action/search modules when OpenAPI inference can handle the operation.
- Adding `x-zapier` or marketplace-specific metadata to the backend-owned OpenAPI contract.
- Adding `customAttribute__` prefixes to customer custom attribute input keys.
- Wrapping payloads in `customerData` or `customAttribute` unless the OpenAPI request body requires it.
- Putting business logic in `src/index.ts`.
- Using broad `any` to bypass TypeScript.
- Adding framework-style abstractions without a concrete need.

## Release Safety

Do not alter `.zapierapprc`, authentication field keys, production endpoints, or
public operation keys without an explicit migration plan. Treat Zapier
validation warnings as review items before promotion, even when they do not
block `zapier-platform validate`.
