import { desc, eq, inArray, sql } from 'drizzle-orm';
import type { MediaKind } from '@/common/constants/domain';
import type { Container } from '@/common/di/container';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
} from '@/common/exceptions/http.exception';
import type { Env } from '@/config/env';
import { DatabaseService, type Database } from '@/database/database.service';
import { contentItems, mediaAssets } from '@/database/schema';
import { MEDIA_RULES, type MediaAssetDto } from './dto/media.dto';

type MediaRow = typeof mediaAssets.$inferSelect;

const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

const extensionOf = (filename: string) => {
  const match = /\.([a-z0-9]{1,8})$/i.exec(filename);
  return match ? `.${match[1]!.toLowerCase()}` : '';
};

/** Files in R2 (audio, images, animations, short videos) and their records in D1. */
export class MediaService {
  private readonly db: Database;
  private readonly env: Env;

  constructor(container: Container) {
    this.db = container.get(DatabaseService).db;
    this.env = container.env;
  }

  publicUrl(key: string) {
    return `${this.env.MEDIA_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }

  toDto(row: MediaRow): MediaAssetDto {
    return {
      id: row.id,
      kind: row.kind,
      key: row.r2Key,
      url: this.publicUrl(row.r2Key),
      filename: row.filename,
      contentType: row.contentType,
      bytes: row.bytes,
      sha256: row.sha256,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async upload(input: {
    kind: MediaKind;
    filename: string;
    contentType: string;
    contentLength: number | null;
    body: () => Promise<ArrayBuffer>;
    uploadedBy: string;
  }): Promise<MediaAssetDto> {
    const rules = MEDIA_RULES[input.kind];
    const contentType = input.contentType.split(';')[0]!.trim().toLowerCase();
    if (!rules.contentTypes.includes(contentType)) {
      throw new BadRequestException(`A ${input.kind} file must be one of: ${rules.contentTypes.join(', ')}`);
    }
    if (input.contentLength !== null && input.contentLength > rules.maxBytes) {
      throw new PayloadTooLargeException(`A ${input.kind} file can be at most ${rules.maxBytes / 1024 / 1024} MB`);
    }

    const bytes = await input.body();
    if (bytes.byteLength === 0) throw new BadRequestException('The file is empty');
    if (bytes.byteLength > rules.maxBytes) {
      throw new PayloadTooLargeException(`A ${input.kind} file can be at most ${rules.maxBytes / 1024 / 1024} MB`);
    }

    const id = crypto.randomUUID();
    const key = `media/${input.kind}/${id}${extensionOf(input.filename)}`;
    const sha256 = toHex(await crypto.subtle.digest('SHA-256', bytes));

    await this.env.MEDIA.put(key, bytes, {
      httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
      sha256,
    });

    const [row] = await this.db
      .insert(mediaAssets)
      .values({
        id,
        kind: input.kind,
        r2Key: key,
        filename: input.filename,
        contentType,
        bytes: bytes.byteLength,
        sha256,
        uploadedBy: input.uploadedBy,
      })
      .returning();
    return this.toDto(row!);
  }

  async list(kind: MediaKind | undefined, limit: number) {
    const rows = await this.db.query.mediaAssets.findMany({
      where: kind ? eq(mediaAssets.kind, kind) : undefined,
      orderBy: desc(mediaAssets.createdAt),
      limit,
    });
    return rows.map((row) => this.toDto(row));
  }

  async get(id: string): Promise<MediaRow> {
    const row = await this.db.query.mediaAssets.findFirst({ where: eq(mediaAssets.id, id) });
    if (!row) throw new NotFoundException('Media file not found');
    return row;
  }

  async findMany(ids: string[]): Promise<MediaRow[]> {
    if (ids.length === 0) return [];
    return this.db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids));
  }

  /** Checks that every id exists; returns the missing ones. */
  async findMissing(ids: string[]): Promise<string[]> {
    const found = new Set((await this.findMany(ids)).map((row) => row.id));
    return ids.filter((id) => !found.has(id));
  }

  async remove(id: string): Promise<void> {
    const row = await this.get(id);
    const [usage] = await this.db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(sql`exists (select 1 from json_each(${contentItems.mediaIds}) where value = ${id})`)
      .limit(1);
    if (usage) throw new ConflictException('This file is still used by a content item', { contentId: usage.id });

    await this.env.MEDIA.delete(row.r2Key);
    await this.db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  }
}
