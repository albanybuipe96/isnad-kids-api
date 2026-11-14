import { and, asc, count, eq } from 'drizzle-orm';
import type { Container } from '@/common/di/container';
import { ConflictException, NotFoundException } from '@/common/exceptions/http.exception';
import { DatabaseService, type Database } from '@/database/database.service';
import { children, DEFAULT_CHILD_SETTINGS } from '@/database/schema';
import type { ChildDto, CreateChildDto, UpdateChildDto } from './dto/profile.dto';

const MAX_CHILDREN_PER_PARENT = 10;

type ChildRow = typeof children.$inferSelect;

/** Child profiles that belong to a signed-in parent. */
export class ProfilesService {
  private readonly db: Database;

  constructor(container: Container) {
    this.db = container.get(DatabaseService).db;
  }

  static toDto(row: ChildRow): ChildDto {
    return {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      ageBand: row.ageBand,
      narrationLanguage: row.narrationLanguage,
      settings: { ...DEFAULT_CHILD_SETTINGS, ...row.settings },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(parentId: string): Promise<ChildDto[]> {
    const rows = await this.db.query.children.findMany({
      where: eq(children.parentUserId, parentId),
      orderBy: asc(children.createdAt),
    });
    return rows.map(ProfilesService.toDto);
  }

  /** Returns the child only if it belongs to this parent; otherwise 404 (never reveal other families' data). */
  async getOwned(parentId: string, childId: string): Promise<ChildRow> {
    const row = await this.db.query.children.findFirst({
      where: and(eq(children.id, childId), eq(children.parentUserId, parentId)),
    });
    if (!row) throw new NotFoundException('Child profile not found');
    return row;
  }

  async create(parentId: string, dto: CreateChildDto): Promise<ChildDto> {
    const [existing] = await this.db
      .select({ total: count() })
      .from(children)
      .where(eq(children.parentUserId, parentId));
    if ((existing?.total ?? 0) >= MAX_CHILDREN_PER_PARENT) {
      throw new ConflictException(`A family can have at most ${MAX_CHILDREN_PER_PARENT} child profiles`);
    }

    const [row] = await this.db
      .insert(children)
      .values({
        id: crypto.randomUUID(),
        parentUserId: parentId,
        name: dto.name,
        avatar: dto.avatar,
        ageBand: dto.ageBand,
        narrationLanguage: dto.narrationLanguage ?? 'en',
        settings: { ...DEFAULT_CHILD_SETTINGS, ...dto.settings },
      })
      .returning();
    return ProfilesService.toDto(row!);
  }

  async update(parentId: string, childId: string, dto: UpdateChildDto): Promise<ChildDto> {
    const current = await this.getOwned(parentId, childId);
    const [row] = await this.db
      .update(children)
      .set({
        name: dto.name ?? current.name,
        avatar: dto.avatar ?? current.avatar,
        ageBand: dto.ageBand ?? current.ageBand,
        narrationLanguage: dto.narrationLanguage ?? current.narrationLanguage,
        settings: { ...DEFAULT_CHILD_SETTINGS, ...current.settings, ...dto.settings },
        updatedAt: new Date(),
      })
      .where(eq(children.id, childId))
      .returning();
    return ProfilesService.toDto(row!);
  }

  async remove(parentId: string, childId: string): Promise<void> {
    await this.getOwned(parentId, childId);
    await this.db.delete(children).where(eq(children.id, childId));
  }
}
