import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const migrations = await readD1Migrations('./migrations');
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            ENVIRONMENT: 'development',
            BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-1234',
            BETTER_AUTH_URL: 'http://localhost',
            MEDIA_PUBLIC_BASE_URL: 'http://localhost/v1/media',
            DEV_ADMIN_EMAIL: 'admin@test.local',
          },
        },
      }),
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    test: { setupFiles: ['./test/setup.ts'] },
  };
});
