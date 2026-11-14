# Isnād Kids API — instructions for coding agents

Read this file and `docs/progress.md` before doing anything in this repository.

## How we work (most important)

- The project owner is learning Hono by building this API step by step. **The owner writes the code.**
  Your job is to guide: explain concepts, point to the relevant docs, suggest the next small step,
  and review the code they write (what is good, what is wrong, and why).
- **Do not write or change application code unless the owner explicitly asks** ("show me",
  "write this for me"). Small examples to explain a concept are fine when asked.
- Work in small steps. Each step should end with something the owner can see working
  (a URL in the browser, a passing test, a command's output).
- Before suggesting a new pattern, library or structural change, discuss it with the owner first.
- When a decision is made, or a step is finished, propose an update to `docs/progress.md`
  so every agent stays in sync. Do not re-suggest options already rejected there.

## About NestJS

From NestJS we copy **only the per-feature folder structure**. Do not add dependency injection,
decorators, module classes, custom DI containers or Nest-style wrappers. Plain Hono, plain
functions and plain imports. Other Nest-inspired ideas may be suggested, but must be discussed first.

## The product

Isnād Kids is an offline-first Android and iOS app (Flutter) that teaches Muslim children aged 3 and up
the Qur'an, Arabic, du'as and STEM through short, interactive activities. It launches in Ghana, then grows
globally. Visual style: traditional Islamic.

- Age bands: Little (3–4), Explorer (5–6), Junior (7–9), Senior (10+).
- App sections: Qur'an Garden, Alif-Ba House, Du'a Time, Discovery Lab, Calm Corner.
- MVP: Qur'an Garden for the Little band (6 short surahs) with three activities:
  listen-along, repeat-after-me (record and play back, no scoring) and surah match.
- Islamic content is always reviewed before publishing (the founder plus a group of experts).
  Every du'a and ayah has a source. Hafs and Warsh recitations are both supported.
  Prophets and companions are never depicted. Families choose the music level and whether characters have faces.
- Built for low-cost phones and costly mobile data: small installs, compressed audio,
  downloadable content packs, full offline use.
- Full product documentation: https://claude.ai/artifact/Ay4nm55nUDKLmhSYkqPhRT

## Technical direction

- TypeScript + **Hono** on **Cloudflare Workers** (Hono chosen over Express, NestJS and Fastify
  because it is native to Workers).
- Planned, added one step at a time: D1 + Drizzle (database), R2 (media files), Queues (building content packs),
  Cloudflare Access (admin login), Better Auth (parent accounts), Zod (validation, and OpenAPI to generate
  the Dart client for the Flutter app).
- Repository: https://github.com/albanybuipe96/isnad-kids-api, default branch `master`.
- Commit `4d21f2b` contains an earlier, rejected full starter that reinvented NestJS on top of Hono.
  Keep it for reference only; do not restore it or copy its patterns without discussion.

## Commands

- `npm install` installs dependencies.
- `npm run dev` starts the local server at http://localhost:8787.
- `npm run deploy` deploys to Cloudflare (not set up yet).
