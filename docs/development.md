# Development

## Workspaces

This is an npm-workspaces monorepo. Always install from the repository root:

```bash
npm install
```

Common scripts (run from the root):

| Command | Description |
| --- | --- |
| `npm run dev:api` | Start the API with `tsx watch` on `:5000` |
| `npm run dev:web` | Start the Vite dev server on `:5173` |
| `npm run build` | Build `shared` → `api` → `web` |
| `npm run typecheck` | Type-check every workspace |
| `npm run lint` | Lint TypeScript sources |
| `npm test` | Run the API test suite (Vitest + supertest) |
| `npm run db:migrate` / `db:seed` / `db:reset` | Database lifecycle |

## Running both apps

Use two terminals:

```bash
npm run dev:api
npm run dev:web
```

`apps/web/.env` points `VITE_API_URL` at the API (`http://localhost:5000` in development). Vite
also proxies `/api` and `/uploads` to the API (see `apps/web/vite.config.js`).

## Frontend API client

All HTTP calls go through `apps/web/src/services/api.ts` (shared axios instance). Add new
endpoints there rather than calling `axios` directly elsewhere.

## Shared code

Reuse `@racephoto/shared` for anything used by more than one app — roles, statuses, fee rules,
formatters and zod schemas. Build it (`npm run build:shared`) before type-checking dependents.

## Testing

API tests live in `apps/api/tests` and run against `DB_NAME_TEST` (`racephoto_test`). The
`globalSetup` hook migrates the test database automatically before the suite runs.

## TypeScript status

Backend, shared package, frontend infrastructure (`services`, `context`, `App`, auth and buyer
pages) are strict TypeScript. The large legacy admin/public page components remain `.jsx` under
`allowJs` and can be converted incrementally without blocking builds.
