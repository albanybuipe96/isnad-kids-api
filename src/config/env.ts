import type { PackJobMessage } from '@/modules/packs/packs.types';

/** Cloudflare bindings and variables available to the Worker (see wrangler.jsonc). */
export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  PACK_QUEUE: Queue<PackJobMessage>;

  ENVIRONMENT: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  MEDIA_PUBLIC_BASE_URL: string;
  ADMIN_ORIGIN: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  /** Local development only. Ignored unless ENVIRONMENT === 'development'. */
  DEV_ADMIN_EMAIL?: string;
}

export const isDevelopment = (env: Env) => env.ENVIRONMENT === 'development';
