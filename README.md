# RacePhoto / GeezPlay — Monorepo

Full-stack platform for selling race/automotive event photos. Migrated from a two-folder
Express + React project into an npm-workspaces monorepo backed by **PostgreSQL** and written
in **TypeScript**.

## Repository layout

```
.
├── apps/
│   ├── api/        Express + Sequelize + PostgreSQL API (TypeScript)
│   └── web/        React + Vite frontend (TypeScript)
├── packages/
│   └── shared/     Shared constants, zod schemas and helpers (@racephoto/shared)
├── deploy/         Containerfile, podman-compose, nginx, PM2 and deploy scripts
└── docs/           Database, authentication and development guides
```

- `apps/api` holds all server code under `src/` (config, models, middleware, routes, services,
  seeders, migrations). It is the only app allowed to talk to the database.
- `apps/web` holds the React SPA under `src/`.
- `packages/shared` is consumed by both apps; it is the single source of truth for roles,
  order/event statuses, admin-fee rules, phone/currency helpers and zod validation schemas.

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14 (running locally or remote)

## Setup

```bash
# 1. Install all workspaces from the repository root
npm install

# 2. Create the databases and role (example, run as a PostgreSQL superuser)
psql -U postgres -c "CREATE ROLE racephoto LOGIN PASSWORD 'racephoto_dev' CREATEDB;"
psql -U postgres -c "CREATE DATABASE racephoto OWNER racephoto;"
psql -U postgres -c "CREATE DATABASE racephoto_test OWNER racephoto;"

# 3. Configure the API environment
cp apps/api/.env.example apps/api/.env   # then edit credentials

# 4. Run migrations and seed (super admin + demo data)
npm run db:migrate
npm run db:seed
```

## Running

```bash
npm run dev:api   # http://localhost:5000
npm run dev:web   # http://localhost:5173
```

Default seeded super admin: `admin@racephoto.com` / `password123` (override with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). Change the password after first login.

## Quality checks

```bash
npm run typecheck   # tsc --noEmit for every workspace
npm run lint        # ESLint
npm run build       # shared -> api -> web
npm test            # Vitest + supertest (API smoke/integration tests)
```

## Roles & authentication

- `super_admin` — full access to all resources.
- `admin` — access scoped to the records they own (`created_by`).
- `buyer` — public registration and Google sign-in. Can view their own profile and orders.

Buyers may also check out **without an account** (guest checkout). Guest orders are protected by
an opaque token returned once at order creation; only its hash is stored server-side.

Login methods: email/password and Google (OAuth 2.0 / OpenID Connect). See
[docs/auth-google.md](docs/auth-google.md).

## Documents

- [docs/database.md](docs/database.md) — PostgreSQL schema and migrations
- [docs/auth-google.md](docs/auth-google.md) — Google OAuth setup
- [docs/development.md](docs/development.md) — local development workflow
