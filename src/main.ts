import { createApp } from '@/app.module';
import type { Env } from '@/config/env';
import { packsQueueConsumer } from '@/modules/packs/packs.consumer';
import type { PackJobMessage } from '@/modules/packs/packs.types';

/** Worker entry point (the NestJS main.ts equivalent): HTTP requests and queue messages. */
const app = createApp();

export default {
  fetch: app.fetch,
  queue: packsQueueConsumer,
} satisfies ExportedHandler<Env, PackJobMessage>;
