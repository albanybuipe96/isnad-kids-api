# Progress

Last updated: 2026-11-14

## Current state

A bare Hono app:

- `src/index.ts` has `GET /`, which returns a text greeting.
- `package.json` has two scripts: `dev` and `deploy`.
- `wrangler.jsonc` sets the Worker name, the entry file and the compatibility date.
- `tsconfig.json` uses strict mode.
- `.gitignore` ignores `node_modules/`, `.wrangler/` and `.dev.vars`.

## Current step: 1. Project structure + `/health`

Proposed structure:

```
src/
  index.ts                          creates the app, mounts each feature's routes
  features/
    <name>/
      <name>.routes.ts              Hono router: read request, call service, send response
      <name>.service.ts             plain functions: business logic and database queries
      <name>.schemas.ts             Zod schemas: validation and types
```

Owner's task: create `src/features/health/health.routes.ts` (a Hono router whose `GET /` returns
`{ "status": "ok" }`), mount it in `src/index.ts` with `app.route('/health', ...)`, visit `/health`,
then share the code for review.

## Open decisions

- [ ] Folder name: `features/` or `modules/`?
- [ ] File suffix: `.routes.ts` or `.controller.ts`? (Recommended: `.routes.ts`.)
- [ ] Nest-inspired ideas to adopt. Recommended yes:
  - Zod schemas per feature
  - One global error format via `app.onError`
  - Environment variables validated with Zod at startup
  - Auth guards as plain Hono middleware
  - A test file beside each feature

  Recommended no: dependency injection, decorators, module classes.

## Decisions made

- Hono on Cloudflare Workers, written in TypeScript.
- From NestJS, copy only the per-feature folder structure.
- Build the content side before accounts: the MVP works offline for the owner's own children without logins.
- Default git branch: `master`.

## Roadmap

1. Project structure + `/health` ← current
2. Validation (Zod) + one global error format
3. D1 + Drizzle: migrations and the first table
4. Content items: create, list, edit, delete (no auth yet)
5. Media uploads to R2 (recitation audio, images)
6. Review workflow: draft → in review → approved, with an audit trail
7. Content packs: the versioned manifest the app downloads
8. Admin login (Cloudflare Access), then parent accounts and progress sync
