# Progress

Last updated: 2026-11-14

## Current state

Per-feature folder structure is in place with a working `/health` endpoint:

- `src/index.ts` creates the app and mounts feature routers.
- `src/features/health/health.routes.ts` — `GET /health` returns `{ "status": "ok" }`.
- `package.json` has two scripts: `dev` and `deploy`.
- `wrangler.jsonc` sets the Worker name, the entry file and the compatibility date.
- `tsconfig.json` uses strict mode.
- `.prettierrc` enforces single quotes (Prettier added as dev dependency).
- `.gitignore` ignores `node_modules/`, `.wrangler/` and `.dev.vars`.
- `src/index.ts` also has `app.notFound` and `app.onError` (Zod errors → 400 with details; anything else → 500),
  with messages in `src/common/messages.ts`.
- Drizzle is set up (commit `8f7aaef`): `drizzle.config.ts`, `src/db/index.ts` (`createDb`), `src/db/schema.ts`
  (a first `content_items` table) and generated migrations in `drizzle/`. `wrangler.jsonc` has the `DB` binding.

Feature folder convention:

```
src/
  index.ts                          creates the app, mounts each feature's routes
  features/
    <name>/
      <name>.routes.ts              Hono router: read request, call service, send response
      <name>.service.ts             plain functions: business logic and database queries
      <name>.schemas.ts             Zod schemas: validation and types
```

## Current step: 2. Validation (Zod) + one global error format

(Details to be planned.)

## Open decisions

(None right now.)

## Completed steps

### 1. Project structure + `/health`

Created the per-feature folder structure and a health check endpoint. Prettier added with single quotes.

## Decisions made

- Hono on Cloudflare Workers, written in TypeScript.
- From NestJS, copy only the per-feature folder structure.
- Build the content side before accounts: the MVP works offline for the owner's own children without logins.
- Default git branch: `master`.
- Folder name: `features/` (not `modules/`, to avoid implying Nest-style module classes).
- File suffix: `.routes.ts` (not `.controller.ts`, since these are plain Hono routers, not Nest controllers).
- Nest-inspired ideas adopted (built when needed, not now): Zod schemas per feature, one global error format via `app.onError`, env vars validated with Zod at startup, auth guards as plain Hono middleware, a test file beside each feature.
- Nest ideas rejected: dependency injection, decorators, module classes.
- Database: D1 with Drizzle ORM, so queries are written in TypeScript rather than raw SQL. Considered and
  rejected: plain SQL (owner prefers not to write queries by hand), Prisma (heavier on Workers), Kysely.
- Validation: Zod.

## Roadmap

1. ~~Project structure + `/health`~~ ✓
2. Validation (Zod) + one global error format
3. D1 + Drizzle: migrations and the first table (partly done: Drizzle and `content_items` set up)
4. Content items: create, list, edit, delete (no auth yet)
5. Media uploads to R2 (recitation audio, images)
6. Review workflow: draft → in review → approved, with an audit trail
7. Content packs: the versioned manifest the app downloads
8. Admin login (Cloudflare Access), then parent accounts and progress sync
