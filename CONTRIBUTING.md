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
- Feature files use kebab-case.
- Validation error codes use PascalCase.
- Payload builders are named `build...Payload`.
- Response transformers are named `transform...Response`.

## Adding A Feature

1. Create only directories that hold real responsibilities.
2. Put API calls under the owning feature's `api/`.
3. Put Zapier actions or triggers under `actions/` or `triggers/`.
4. Put shared feature fields in `fields.ts` or `fields/`.
5. Export the deliberate feature surface through `index.ts`.
6. Register the operation in `src/index.ts`.

## Adding An Endpoint

- Add or reuse a path builder in `src/config/api.ts`.
- Validate required identifiers once at the feature API boundary.
- Keep request bodies explicit.
- Preserve existing HTTP methods, paths, query parameters, and response shapes unless repository evidence proves a change is correct.
- Add tests that assert URL encoding and payload shape.

## Prohibited Patterns

- Duplicating the Dokaai API base URL.
- Hard-coding the Dokaai API base URL outside environment configuration.
- Returning, logging, or serializing auth secrets.
- Adding `uniqueCustomerId` as an editable Update Customer field.
- Wrapping Update Customer payloads in `customerData`.
- Importing from one feature's internal modules into another feature.
- Putting business logic in `src/index.ts`.
- Using broad `any` to bypass TypeScript.
- Adding framework-style abstractions without a concrete need.

## Release Safety

Do not alter `.zapierapprc`, authentication field keys, production endpoints, or public operation keys without an explicit migration plan. Treat Zapier validation warnings as review items before promotion, even when they do not block `zapier-platform validate`.
