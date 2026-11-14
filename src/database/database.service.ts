import { drizzle } from 'drizzle-orm/d1';
import type { Container } from '@/common/di/container';
import * as schema from './schema';

export const createDb = (d1: D1Database) => drizzle(d1, { schema });
export type Database = ReturnType<typeof createDb>;

/** Provides the Drizzle client for D1 (like a NestJS TypeOrmModule/PrismaService). */
export class DatabaseService {
  readonly db: Database;

  constructor(container: Container) {
    this.db = createDb(container.env.DB);
  }
}
