import { Container } from '@/common/di/container';
import type { Env } from '@/config/env';
import type { PackJobMessage } from './packs.types';
import { PacksService } from './packs.service';

/** Queue consumer (like a NestJS @Processor): builds one pack per message. */
export async function packsQueueConsumer(
  batch: MessageBatch<PackJobMessage>,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  const container = new Container(env, ctx);
  const packs = container.get(PacksService);
  for (const message of batch.messages) {
    await packs.build(message.body.packId);
    message.ack();
  }
}
