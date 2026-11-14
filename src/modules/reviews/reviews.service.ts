import { asc, desc, eq } from 'drizzle-orm';
import type { Container } from '@/common/di/container';
import { ConflictException } from '@/common/exceptions/http.exception';
import { DatabaseService, type Database } from '@/database/database.service';
import { contentItems, contentReviews } from '@/database/schema';
import { ContentService } from '@/modules/content/content.service';
import type { DecideReviewDto } from './dto/review.dto';

/** The review queue. Nothing Islamic reaches families without an approval recorded here. */
export class ReviewsService {
  private readonly db: Database;
  private readonly content: ContentService;

  constructor(container: Container) {
    this.db = container.get(DatabaseService).db;
    this.content = container.get(ContentService);
  }

  async queue() {
    const rows = await this.db.query.contentItems.findMany({
      where: eq(contentItems.status, 'in_review'),
      orderBy: asc(contentItems.updatedAt),
    });
    return rows.map(ContentService.toDto);
  }

  async decide(contentId: string, reviewerEmail: string, dto: DecideReviewDto) {
    const item = await this.content.get(contentId);
    if (item.status !== 'in_review') {
      throw new ConflictException(`This item is not waiting for review (it is ${item.status})`);
    }

    const updated = await this.content.setStatus(
      item,
      dto.decision === 'approve' ? 'approved' : 'changes_requested',
      reviewerEmail,
    );
    await this.db.insert(contentReviews).values({
      id: crypto.randomUUID(),
      contentId,
      revision: item.revision,
      reviewerEmail,
      decision: dto.decision,
      comment: dto.comment ?? null,
    });
    return updated;
  }

  async history(contentId: string) {
    await this.content.get(contentId);
    const rows = await this.db.query.contentReviews.findMany({
      where: eq(contentReviews.contentId, contentId),
      orderBy: desc(contentReviews.createdAt),
    });
    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  }
}
