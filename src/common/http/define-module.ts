import type { Router } from '@/common/http/create-router';
import type { ProviderClass } from '@/common/di/container';

export interface ControllerDefinition {
  /** URL prefix the controller is mounted under, e.g. '/admin/content'. */
  prefix: string;
  router: Router;
}

export interface ModuleDefinition {
  name: string;
  controllers: ControllerDefinition[];
  /** Providers this module owns. Documentation only: the container creates them on demand. */
  providers?: ProviderClass<unknown>[];
}

/** Equivalent of NestJS's @Module(): groups a feature's controllers and providers. */
export const defineModule = (definition: ModuleDefinition) => definition;
