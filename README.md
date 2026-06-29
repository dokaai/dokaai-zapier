# Dokaai Zapier Integration

Zapier Platform CLI integration for Dokaai customer engagement and notification APIs.

The integration currently registers customer operations and target audience membership operations. It uses custom API-key authentication with the exact credential keys `x-client-key` and `x-client-secret`, sent only as request headers.

## Prerequisites

- Node.js compatible with the project engine in `package.json`
- npm
- Zapier Platform CLI access for validation, linking, and deployment
- A Zapier account linked with `zapier login`

## Setup

```bash
npm install
npm run build
npm test
```

Local secrets may be placed in `.env` for manual Zapier CLI testing, but never commit `.env` files or real credentials.

Required environment variables:

- `DOKAAI_API_BASE_URL`: Dokaai API base URL.

Authentication values are Zapier auth fields, not OAuth config:

- `x-client-key`
- `x-client-secret`

## Development Commands

```bash
npm run build
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run validate
npm run check
```

`npm run validate` runs `zapier-platform validate`. It may need network access, `DOKAAI_API_BASE_URL`, and a writable Zapier CLI config directory.

## Zapier Linking And Deployment

This repository keeps `.zapierapprc` pointed at the existing private integration. Do not change it casually.

Typical private-version flow:

```bash
zapier login
zapier validate
zapier push
```

Promoting a version affects users. Review operation keys, authentication fields, endpoint behavior, and Zapier validation warnings before any production promotion.

## Architecture

Runtime entry is `index.js`, a CommonJS shim that loads compiled TypeScript from `dist/`. Source lives in `src/`.

Important modules:

- `src/config`: environment-backed API base URL, endpoint path builders, customer constants.
- `src/core/http`: Dokaai request boundary and response parsing.
- `src/core/validation`: shared identifier and value validation.
- `src/core/zapier`: Zapier field/result/value helpers.
- `src/authentication`: credential fields and auth test request.
- `src/features/customers`: customer API calls, fields, payloads, responses, and create definitions.
- `src/features/target-audiences`: target audience fields, payload normalization, API calls, and create definitions.
- `src/features/customer-pools`: reusable customer-pool API calls for future dropdowns or triggers.

See `ARCHITECTURE.md` for dependency rules and extension guidance.

## Adding A New Operation Safely

1. Add endpoint paths or constants in `src/config` if needed.
2. Add a typed feature API function under the owning feature.
3. Keep payload builders and response transformers pure.
4. Define Zapier fields separately from HTTP execution.
5. Register the operation in `src/index.ts` without changing existing keys.
6. Add unit tests for pure logic and operation tests for request shape.
7. Run `npm run check`.

## Current Public Operation Keys

Creates:

- `create_customer`
- `update_customer`
- `delete_customer`
- `add_customer_to_target_audience`
- `remove_customer_from_target_audience`
- `get_customer_by_id`

No triggers are registered at the moment.

`get_customer_by_id` remains registered as a create for compatibility with the converted integration.
