import { applyD1Migrations } from 'cloudflare:test';
import { env } from 'cloudflare:workers';

// Each test file gets isolated storage; apply the real migrations before tests run.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

await env.DB.prepare(
  `INSERT OR IGNORE INTO admin_users (email, name, role, active, created_at) VALUES
    ('admin@test.local', 'Admin', 'admin', 1, 0),
    ('editor@test.local', 'Editor', 'editor', 1, 0),
    ('reviewer@test.local', 'Reviewer', 'reviewer', 1, 0),
    ('inactive@test.local', 'Gone', 'reviewer', 0, 0)`,
).run();
