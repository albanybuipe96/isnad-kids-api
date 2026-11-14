import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import type { ContentStatus, Section } from '@/common/constants/domain';
import type { Container } from '@/common/di/container';
import { BadRequestException, ConflictException, NotFoundException } from '@/common/exceptions/http.exception';
import { DatabaseService, type Database } from '@/database/database.service';
import { contentItems } from '@/database/schema';
import { MediaService } from '@/modules/media/media.service';
import type { ContentItemDto, CreateContentDto, UpdateContentDto } from './dto/content.dto';
import { collectMediaRefs, validateTemplateData } from './templates/template-data';

export type ContentRow = typeof contentItems.$inferSelect;

/** Content items and their editing workflow: draft -> in_review -> approved. */
export class ContentService {
  private readonly db: Database;
  private readonly media: MediaService;

  constructor(container: Container) {
    this.db = container.get(DatabaseService).db;
    this.media = container.get(MediaService);
  }

  static toDto(row: ContentRow): ContentItemDto {
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(filters: { status?: ContentStatus; section?: Section; limit: number }) {
    const conditions: SQL[] = [];
    if (filters.status) conditions.push(eq(contentItems.status, filters.status));
    if (filters.section) conditions.push(eq(contentItems.section, filters.section));
    const rows = await this.db.query.contentItems.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: desc(contentItems.updatedAt),
      limit: filters.limit,
    });
    return rows.map(ContentService.toDto);
  }

  async get(id: string): Promise<ContentRow> {
    const row = await this.db.query.contentItems.findFirst({ where: eq(contentItems.id, id) });
    if (!row) throw new NotFoundException('Content item not found');
    return row;
  }

  async listApproved(): Promise<ContentRow[]> {
    return this.db.query.contentItems.findMany({ where: eq(contentItems.status, 'approved') });
  }

  async create(dto: CreateContentDto, editorEmail: string): Promise<ContentItemDto> {
    const existing = await this.db.query.contentItems.findFirst({ where: eq(contentItems.slug, dto.slug) });
    if (existing) throw new ConflictException(`The slug "${dto.slug}" is already used`);

    const mediaIds = await this.resolveMediaIds(dto.mediaIds, dto.data);
    const [row] = await this.db
      .insert(contentItems)
      .values({
        id: crypto.randomUUID(),
        slug: dto.slug,
        title: dto.title,
        section: dto.section,
        template: dto.template,
        ageBands: [...new Set(dto.ageBands)],
        skills: [...new Set(dto.skills)],
        riwayah: dto.riwayah ?? null,
        isIslamic: dto.isIslamic,
        source: dto.source ?? null,
        data: dto.data,
        mediaIds,
        status: 'draft',
        createdBy: editorEmail,
        updatedBy: editorEmail,
      })
      .returning();
    return ContentService.toDto(row!);
  }

  /** Editing an approved item sends it back to draft: it must be reviewed again before the next pack. */
  async update(id: string, dto: UpdateContentDto, editorEmail: string): Promise<ContentItemDto> {
    const current = await this.get(id);
    if (current.status === 'in_review') {
      throw new ConflictException('This item is waiting for review. Withdraw it before editing.');
    }

    const data = dto.data ?? current.data;
    const mediaIds = await this.resolveMediaIds(dto.mediaIds ?? current.mediaIds, data);
    const [row] = await this.db
      .update(contentItems)
      .set({
        title: dto.title ?? current.title,
        section: dto.section ?? current.section,
        template: dto.template ?? current.template,
        ageBands: dto.ageBands ? [...new Set(dto.ageBands)] : current.ageBands,
        skills: dto.skills ? [...new Set(dto.skills)] : current.skills,
        riwayah: dto.riwayah === undefined ? current.riwayah : dto.riwayah,
        isIslamic: dto.isIslamic ?? current.isIslamic,
        source: dto.source === undefined ? current.source : dto.source,
        data,
        mediaIds,
        status: current.status === 'approved' ? 'draft' : current.status,
        revision: current.revision + 1,
        updatedBy: editorEmail,
        updatedAt: new Date(),
      })
      .where(and(eq(contentItems.id, id), eq(contentItems.revision, current.revision)))
      .returning();
    if (!row) throw new ConflictException('Someone else changed this item. Reload and try again.');
    return ContentService.toDto(row);
  }

  /** Checks everything a reviewer needs, then moves the item into the review queue. */
  async submitForReview(id: string, editorEmail: string): Promise<ContentItemDto> {
    const item = await this.get(id);
    if (item.status !== 'draft' && item.status !== 'changes_requested') {
      throw new ConflictException(`Only draft items can be submitted (this one is ${item.status})`);
    }

    const problems: { path: string; message: string }[] = [];
    if (item.isIslamic && !item.source?.trim()) {
      problems.push({ path: 'source', message: "Islamic content needs a source (Qur'an reference or hadith)" });
    }
    if (item.section === 'quran_garden' && !item.riwayah) {
      problems.push({ path: 'riwayah', message: "Qur'an Garden items must say whether they are Hafs or Warsh" });
    }
    problems.push(...validateTemplateData(item.template, item.data));
    const missing = await this.media.findMissing(item.mediaIds);
    if (missing.length) problems.push({ path: 'mediaIds', message: `Missing media files: ${missing.join(', ')}` });
    if (problems.length) throw new BadRequestException('This item is not ready for review', problems);

    return this.setStatus(item, 'in_review', editorEmail);
  }

  async withdraw(id: string, editorEmail: string): Promise<ContentItemDto> {
    const item = await this.get(id);
    if (item.status !== 'in_review') throw new ConflictException('Only items waiting for review can be withdrawn');
    return this.setStatus(item, 'draft', editorEmail);
  }

  async remove(id: string): Promise<void> {
    const item = await this.get(id);
    if (item.lastPublishedPackVersion !== null) {
      throw new ConflictException('This item has been published to families and cannot be deleted');
    }
    if (item.status === 'in_review' || item.status === 'approved') {
      throw new ConflictException(`Items that are ${item.status.replace('_', ' ')} cannot be deleted`);
    }
    await this.db.delete(contentItems).where(eq(contentItems.id, id));
  }

  /** Moves an item between statuses, failing if it changed underneath us. */
  async setStatus(item: ContentRow, status: ContentStatus, actorEmail: string): Promise<ContentItemDto> {
    const [row] = await this.db
      .update(contentItems)
      .set({ status, updatedBy: actorEmail, updatedAt: new Date() })
      .where(and(eq(contentItems.id, item.id), eq(contentItems.revision, item.revision), eq(contentItems.status, item.status)))
      .returning();
    if (!row) throw new ConflictException('Someone else changed this item. Reload and try again.');
    return ContentService.toDto(row);
  }

  async markPublished(ids: string[], packVersion: number): Promise<void> {
    if (ids.length === 0) return;
    // Chunked to stay under D1's bound-parameter limit.
    for (let i = 0; i < ids.length; i += 90) {
      await this.db
        .update(contentItems)
        .set({ lastPublishedPackVersion: packVersion })
        .where(inArray(contentItems.id, ids.slice(i, i + 90)));
    }
  }

  /** Every media id the item lists or references in its data, all of which must exist. */
  private async resolveMediaIds(listed: string[], data: unknown): Promise<string[]> {
    const ids = [...new Set([...listed, ...collectMediaRefs(data)])];
    const missing = await this.media.findMissing(ids);
    if (missing.length) {
      throw new BadRequestException('Some media files do not exist', [{ path: 'mediaIds', message: missing.join(', ') }]);
    }
    return ids;
  }
}
