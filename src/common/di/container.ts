import type { Env } from '@/config/env';

/** A provider is any class whose constructor takes the container (like a NestJS @Injectable). */
export type ProviderClass<T> = new (container: Container) => T;

/**
 * A small per-request dependency-injection container, in the spirit of NestJS providers.
 * Services ask for their dependencies with `container.get(OtherService)`; each provider is
 * created once per request and then reused.
 */
export class Container {
  private readonly instances = new Map<ProviderClass<unknown>, unknown>();

  constructor(
    readonly env: Env,
    readonly executionCtx?: ExecutionContext,
  ) {}

  get<T>(provider: ProviderClass<T>): T {
    let instance = this.instances.get(provider) as T | undefined;
    if (!instance) {
      instance = new provider(this);
      this.instances.set(provider, instance);
    }
    return instance;
  }
}
