import { createMiddleware } from 'hono/factory';
import { Container } from '@/common/di/container';
import type { AppEnv } from '@/common/types';

/** Creates a fresh dependency-injection container for each request. */
export const containerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  let executionCtx: ExecutionContext | undefined;
  try {
    executionCtx = c.executionCtx as unknown as ExecutionContext;
  } catch {
    executionCtx = undefined; // not available in some test setups
  }
  c.set('container', new Container(c.env, executionCtx));
  await next();
});
