# Dokaai Zapier Integration

Zapier Platform CLI integration generated from the Dokaai OpenAPI contract.

The API source of truth is `src/api/index.json`. Zapier creates and searches
are generated from plain OpenAPI operations selected by `operationId`. Normal
REST operations should not have hand-written action/search modules.

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
for Zapier CLI validation and push.

`npm run generate:tests` rewrites generated operation tests from
`src/zapier-operation-ids.ts` and `src/api/index.json`.

`npm test` runs `generate:tests` first, then Jest against the TypeScript source.

## Deploying To Zapier

This repo is a Zapier Platform CLI app. Zapier reads the app version from
`package.json`.

For a brand-new Zapier app, start at `0.0.0`, register/link the app once, then
commit the generated `.zapierapprc` file:

```bash
zapier-platform login
zapier-platform register "Dokaai"
npm run check
npm run push-zapier
```

If the app was created in the Zapier Platform UI instead of the CLI, link this
repo to it before pushing:

```bash
zapier-platform login
zapier-platform link
npm run check
npm run push-zapier
```

Zapier app versions are immutable, so deploy changes by bumping the
`package.json` version before pushing. For example:

```bash
npm version patch --no-git-tag-version
npm run check
npm run push-zapier
```

After the first `0.0.0` push succeeds, bump to `0.1.0` when you want the first
team-facing beta version:

```bash
npm version 0.1.0 --no-git-tag-version
npm run check
npm run push-zapier
```

Use `patch` for small fixes, `minor` for new non-breaking actions/searches, and
`major` only for breaking changes such as renamed/removed fields or operation
keys.

`npm run push-zapier` builds the TypeScript output, prunes dev dependencies,
and runs `zapier-platform push`. The pushed Zapier version is the version in
`package.json`.

### GitHub Actions Deploy

The `Push Zapier App` workflow runs on pushes to `main` or `master`, and can
also be started manually from the GitHub Actions tab.

Before the workflow can push to Zapier, add this repository secret in GitHub:

```text
ZAPIER_DEPLOY_KEY
```

To get the deploy key, log in locally with the Zapier CLI:

```bash
npm install -g zapier-platform-cli@19.0.0
zapier-platform login
```

The Zapier CLI stores the deploy key in `~/.zapierrc`. Copy the deploy key value
into the GitHub repository secret. Do not commit `~/.zapierrc` or any deploy
key to the repo.

Recommended release flow:

1. Update `src/api/index.json` or the Zapier source files.
2. If operation IDs changed, update `src/zapier-operation-ids.ts`.
3. Run `npm run generate:tests`.
4. Bump the version in `package.json`.
5. Run `npm run check`.
6. Commit the source, generated tests, and version bump.
7. Push or merge to `main`.
8. Confirm the GitHub Actions `Push Zapier App` workflow passed.

After a successful push, refresh the Zapier editor to see the new app version.
If the version should become the public/production version for existing users,
promote or migrate it intentionally from the Zapier CLI or Platform UI after
testing.

## How Operations Are Created

`src/index.ts` loads `src/api/index.json` and passes it to:

- `buildAuthentication`: builds Zapier auth fields from OpenAPI `securitySchemes`.
- `buildZapierCreatesFromOpenApi`: builds Zapier creates from selected OpenAPI `operationId`s.
- `buildZapierSearchesFromOpenApi`: builds Zapier searches from selected OpenAPI `operationId`s.

Example selector:

```ts
export const zapierActionOperationIds = ['addCustomersToPool'] as const;
export const zapierSearchOperationIds = ['getPoolCustomers'] as const;
```

The generator derives:

- URL and method from the OpenAPI path item.
- Auth headers from `securitySchemes`.
- Zapier input fields from path params and JSON request body schema.
- Request body wrappers by detecting a single required object body property.
- Returned `id` from response schema fields such as `id`, `customerId`, or nested `data.customerId`.
- Zapier key from `operationId`, for example `addCustomersToPool` becomes `add_customers_to_pool`.

## Dynamic Fields

Dynamic fields are small adapters on top of the OpenAPI contract:

- `projectId` loads from `getAllProjectsWithService`.
- `customerPoolId` loads from `getAllCustomerPoolInProject` and depends on `projectId`.
- `targetAudienceListId` and `filterOutTALId` load from `getTargetAudienceLists` and depend on `projectId`.
- `notificationHandlerId` loads from `getAllNotificationHandlersInProject` and depends on `projectId`.
- Customer pool custom attributes load from `getPoolCustomerAttribute` for `addCustomersToPool` and `updateCustomerInPool`.

Customer custom attribute fields are exposed with their plain backend field
names, for example `is_vip`, not `customAttribute__is_vip`. They are submitted
as plain body fields because `customAttribute` is not present in the OpenAPI
request body for the selected customer operations.

`customerId` and `customerIds` are manual fields. They intentionally do not use
a dropdown.

Zapier validation may emit D004 warnings for ID-looking fields. The generated
app uses `choices.perform` dynamic loaders so the dropdowns work at runtime,
but Zapier's marketplace warning prefers the older `dynamic:
"trigger.id.label"` trigger-reference style. Those warnings are accepted unless
Zapier review explicitly requires hidden trigger-backed dropdowns.

## Adding An Operation

1. Add or update the endpoint in `src/api/index.json`.
2. Add the operationId to `zapierActionOperationIds` or `zapierSearchOperationIds` in `src/zapier-operation-ids.ts`.
3. Run `npm run generate:tests`.
4. Run `npm test` and `npm run validate`.

Do not add a hand-written action or search file for normal REST operations. If
an endpoint needs behavior the generator cannot infer, add generic inference
support or a small reusable dynamic-field/plugin adapter first.

## Current Operation Keys

Creates:

- `add_customers_to_pool`, generated from `operationId: addCustomersToPool`
- `add_customer_custom_attribute`, generated from `operationId: addCustomerCustomAttribute`
- `associate_customer_to_target_audience_list`, generated from `operationId: associateCustomerToTargetAudienceList`
- `delete_customer_from_target_audience_list`, generated from `operationId: deleteCustomerFromTargetAudienceList`
- `update_customer_in_pool`, generated from `operationId: updateCustomerInPool`
- `remove_customer_from_pool`, generated from `operationId: removeCustomerFromPool`
- `trigger_notification_handler`, generated from `operationId: triggerNotificationHandler`

Searches:

- `get_pool_customers`, generated from `operationId: getPoolCustomers`
- `get_pool_customer_by_id`, generated from `operationId: getPoolCustomerById`
- `get_notification_handler`, generated from `operationId: getNotificationHandler`
- `get_all_notification_handlers_in_project`, generated from `operationId: getAllNotificationHandlersInProject`
- `get_notification_handler_by_key`, generated from `operationId: getNotificationHandlerByKey`

No triggers are registered at the moment.
