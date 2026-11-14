import { desc, eq, max } from 'drizzle-orm';
import type { Section } from '@/common/constants/domain';
import type { Container } from '@/common/di/container';
import { ConflictException, NotFoundException } from '@/common/exceptions/http.exception';
import type { Env } from '@/config/env';
import { DatabaseService, type Database } from '@/database/database.service';
import { contentPacks } from '@/database/schema';
import { ContentService } from '@/modules/content/content.service';
import { MediaService } from '@/modules/media/media.service';
import type { CreatePackDto, PackDto } from './dto/pack.dto';
import type { PackManifest } from './packs.types';

type PackRow = typeof contentPacks.$inferSelect;

export const manifestKey = (version: number) => `packs/v${version}/manifest.json`;
export const LATEST_KEY = 'packs/latest.json';

/** Builds versioned content packs from approved items and publishes them to R2. */
export class PacksService {
  private readonly db: Database;
  private readonly env: Env;
  private readonly content: ContentService;
  private readonly media: MediaService;

  constructor(container: Container) {
    this.db = container.get(DatabaseService).db;
    this.env = container.env;
    this.content = container.get(ContentService);
    this.media = container.get(MediaService);
  }

  toDto(row: PackRow): PackDto {
    return {
      id: row.id,
      version: row.version,
      status: row.status,
      manifestUrl: row.manifestKey ? this.media.publicUrl(row.manifestKey) : null,
      itemCount: row.itemCount,
      totalBytes: row.totalBytes,
      notes: row.notes,
      error: row.error,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt?.toISOString() ?? null,
    };
  }

  async list(): Promise<PackDto[]> {
    const rows = await this.db.query.contentPacks.findMany({ orderBy: desc(contentPacks.version), limit: 50 });
    return rows.map((row) => this.toDto(row));
  }

  async getByVersion(version: number): Promise<PackRow> {
    const row = await this.db.query.contentPacks.findFirst({ where: eq(contentPacks.version, version) });
    if (!row) throw new NotFoundException(`Pack version ${version} not found`);
    return row;
  }

  async latestPublished(): Promise<PackRow> {
    const row = await this.db.query.contentPacks.findFirst({
      where: eq(contentPacks.status, 'published'),
      orderBy: desc(contentPacks.version),
    });
    if (!row) throw new NotFoundException('No content pack has been published yet');
    return row;
  }

  /** Creates the next pack version and queues it to be built. */
  async requestBuild(dto: CreatePackDto, adminEmail: string): Promise<PackDto> {
    const building = await this.db.query.contentPacks.findFirst({ where: eq(contentPacks.status, 'building') });
    if (building) throw new ConflictException(`Pack version ${building.version} is still being built`);

    const [current] = await this.db.select({ version: max(contentPacks.version) }).from(contentPacks);
    const [row] = await this.db
      .insert(contentPacks)
      .values({
        id: crypto.randomUUID(),
        version: (current?.version ?? 0) + 1,
        status: 'building',
        notes: dto.notes ?? null,
        createdBy: adminEmail,
      })
      .returning();

    await this.env.PACK_QUEUE.send({ packId: row!.id });
    return this.toDto(row!);
  }

  /** Runs in the queue consumer. A failed build is recorded on the pack, never half-published. */
  async build(packId: string): Promise<void> {
    const pack = await this.db.query.contentPacks.findFirst({ where: eq(contentPacks.id, packId) });
    if (!pack || pack.status !== 'building') return; // already handled (queue messages can repeat)

    try {
      const manifest = await this.buildManifest(pack.version);
      const body = JSON.stringify(manifest);
      const key = manifestKey(pack.version);

      await this.env.MEDIA.put(key, body, {
        httpMetadata: { contentType: 'application/json', cacheControl: 'public, max-age=31536000, immutable' },
      });
      await this.env.MEDIA.put(
        LATEST_KEY,
        JSON.stringify({ version: pack.version, manifestKey: key, totalBytes: manifest.totalBytes }),
        { httpMetadata: { contentType: 'application/json', cacheControl: 'public, max-age=60' } },
      );

      await this.content.markPublished(
        manifest.items.map((item) => item.id),
        pack.version,
      );
      await this.db
        .update(contentPacks)
        .set({
          status: 'published',
          manifestKey: key,
          itemCount: manifest.items.length,
          totalBytes: manifest.totalBytes,
          publishedAt: new Date(),
        })
        .where(eq(contentPacks.id, pack.id));
    } catch (error) {
      console.error('Pack build failed', pack.version, error);
      await this.db
        .update(contentPacks)
        .set({ status: 'failed', error: error instanceof Error ? error.message : String(error) })
        .where(eq(contentPacks.id, pack.id));
    }
  }

  private async buildManifest(version: number): Promise<PackManifest> {
    const items = await this.content.listApproved();
    const mediaIds = [...new Set(items.flatMap((item) => item.mediaIds))];
    const media = await this.media.findMany(mediaIds);
    const mediaById = new Map(media.map((asset) => [asset.id, asset]));

    const missing = mediaIds.filter((id) => !mediaById.has(id));
    if (missing.length) throw new Error(`Approved content refers to missing media: ${missing.join(', ')}`);

    const sections: PackManifest['sections'] = {};
    for (const item of items) {
      const section = (sections[item.section as Section] ??= { itemCount: 0, bytes: 0 });
      section.itemCount += 1;
      section.bytes += item.mediaIds.reduce((total, id) => total + (mediaById.get(id)?.bytes ?? 0), 0);
    }

    return {
      schemaVersion: 1,
      packVersion: version,
      generatedAt: new Date().toISOString(),
      mediaBaseUrl: this.env.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, ''),
      totalBytes: media.reduce((total, asset) => total + asset.bytes, 0),
      sections,
      items: items.map((item) => ({
        id: item.id,
        slug: item.slug,
        revision: item.revision,
        title: item.title,
        section: item.section,
        template: item.template,
        ageBands: item.ageBands,
        skills: item.skills,
        riwayah: item.riwayah,
        source: item.source,
        data: item.data,
        mediaIds: item.mediaIds,
      })),
      media: media.map((asset) => ({
        id: asset.id,
        kind: asset.kind,
        key: asset.r2Key,
        contentType: asset.contentType,
        bytes: asset.bytes,
        sha256: asset.sha256,
      })),
    };
  }
}
