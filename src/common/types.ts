import type { Env } from '@/config/env';
import type { Container } from '@/common/di/container';
import type { AdminRole } from '@/common/constants/domain';

export interface AdminPrincipal {
  email: string;
  name: string | null;
  role: AdminRole;
}

export interface ParentPrincipal {
  id: string;
  email: string;
  name: string;
}

/** Hono generics for every router in the app. */
export type AppEnv = {
  Bindings: Env;
  Variables: {
    container: Container;
    admin: AdminPrincipal;
    parent: ParentPrincipal;
  };
};
