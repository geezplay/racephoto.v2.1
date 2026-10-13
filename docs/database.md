# Database

RacePhoto uses **PostgreSQL** through **Sequelize**. The schema is versioned with
`sequelize-cli` migrations — the application never calls `sequelize.sync()`.

## Configuration

All database credentials come from the environment (see `apps/api/.env.example`):

| Variable | Purpose |
| --- | --- |
| `DB_DIALECT` | `postgres` |
| `DB_HOST` / `DB_PORT` | PostgreSQL host and port |
| `DB_NAME` | Main database name |
| `DB_NAME_TEST` | Database used by the automated tests |
| `DB_USER` / `DB_PASSWORD` | Application credentials |

`apps/api/src/config/database.js` is read by `sequelize-cli`; `apps/api/src/config/db.ts` builds
the runtime Sequelize instance. Both read the same variables.

## Migrations

Migration files live in `apps/api/src/migrations` (`.js`, CommonJS, executed by `sequelize-cli`).

```bash
npm run db:migrate        # apply all pending migrations
npm run db:migrate:undo   # roll back the last migration
npm run db:reset          # undo all, then re-apply
npm run db:seed           # create super admin (+ demo data unless SEED_DEMO=false)
```

## Schema overview

| Table | Notes |
| --- | --- |
| `users` | roles `super_admin` / `admin` / `buyer`, nullable `password` (Google-only accounts), `google_id`, `auth_provider` |
| `events` | `category` enum, `status` enum, `start_time`, `is_published`, `created_by` |
| `event_classes` | classes belonging to an event |
| `photos` | watermarked/primary photo, `created_by` owner |
| `recap_photos` | high-resolution variants, unique `(photo_id, variant_number)` |
| `orders` | buyer data, `status`, discount fields, nullable `user_id`, hashed `guest_token` |
| `order_items` | snapshot of purchased photo/variant (`snap_*` columns) |
| `sponsors`, `photographers`, `site_settings` | public site content |
| `discount_codes` | `event_ids` stored as `JSONB` |
| `withdrawal_requests` | admin payouts (balance is deducted on approval) |

## Indexes

Indexes are added deliberately rather than on every column: all foreign keys, unique email
(`users.email`), unique discount code, unique `(photo_id, variant_number)`, `orders(status)`,
`orders(user_id)`, and `photos(event_id, class)` — matching the actual query patterns.

## Migration notes

- PostgreSQL enums are used for roles, order/event statuses and categories.
- JSON arrays (`discount_codes.event_ids`) use `JSONB`.
- Case-insensitive search uses `Op.iLike` (the previous MySQL build used `Op.like`).
- Financial columns use `NUMERIC(15,2)` and are read as numbers via model getters.

## Production

Run `db:migrate` against the production database **before** starting the API. Because the runtime
container only ships the compiled `dist/` and production dependencies (no `sequelize-cli`), run
migrations from a checkout/CI step that has dev dependencies installed, or from the build stage:

```bash
DB_NAME=racephoto DB_USER=racephoto DB_PASSWORD=*** DB_HOST=... npm run db:migrate
```

Never run `sequelize.sync()` in production — schema changes are migration-only.

