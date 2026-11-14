import { and, asc, eq, gt } from 'drizzle-orm';
import type { Container } from '@/common/di/container';
import { DatabaseService, type Database } from '@/database/database.service';
import { progressEvents } from '@/database/schema';
import { ProfilesService } from '@/modules/profiles/profiles.service';
import type { SyncProgressDto } from './dto/progress.dto';

/** D1 allows 100 bound parameters per statement; each event row uses 7. */
const ROWS_PER_INSERT = 12;

/** Two-way progress sync: the app uploads new events and downloads anything it is missing. */
export class ProgressService {
  private readonly db: Database;
  private readonly profiles: ProfilesService;

  constructor(container: Container) {
    this.db = container.get(DatabaseService).db;
    this.profiles = container.get(ProfilesService);
  }

  async upload(parentId: string, childId: string, dto: SyncProgressDto) {
    await this.profiles.getOwned(parentId, childId);

    const rows = dto.events.map((event) => ({
      id: event.id,
      childId,
      skill: event.skill,
      contentId: event.contentId ?? null,
      kind: event.kind,
      value: event.value ?? null,
      occurredAt: new Date(event.occurredAt),
    }));

    const statements = [];
    for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
      statements.push(
        this.db
          .insert(progressEvents)
          .values(rows.slice(i, i + ROWS_PER_INSERT))
          .onConflictDoNothing({ target: progressEvents.id })
          .returning({ id: progressEvents.id }),
      );
    }
    const [first, ...rest] = statements;
    const results = await this.db.batch([first!, ...rest]);
    const accepted = results.reduce((total, inserted) => total + inserted.length, 0);

    return { accepted, duplicates: rows.length - accepted };
  }

  async list(parentId: string, childId: string, since: number, limit: number) {
    await this.profiles.getOwned(parentId, childId);

    const rows = await this.db
      .select()
      .from(progressEvents)
      .where(and(eq(progressEvents.childId, childId), gt(progressEvents.seq, since)))
      .orderBy(asc(progressEvents.seq))
      .limit(limit + 1);

    const page = rows.slice(0, limit);
    return {
      events: page.map((row) => ({
        seq: row.seq,
        id: row.id,
        skill: row.skill,
        contentId: row.contentId,
        kind: row.kind,
        value: row.value,
        occurredAt: row.occurredAt.toISOString(),
      })),
      cursor: page.at(-1)?.seq ?? since,
      hasMore: rows.length > limit,
    };
  }
}
