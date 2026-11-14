import { z } from '@hono/zod-openapi';
import { REVIEW_DECISIONS } from '@/common/constants/domain';

export const DecideReviewDto = z
  .object({
    decision: z.enum(REVIEW_DECISIONS),
    comment: z.string().trim().max(2000).optional(),
  })
  .refine((dto) => dto.decision === 'approve' || !!dto.comment, {
    message: 'Say what needs to change when requesting changes',
    path: ['comment'],
  })
  .openapi('DecideReview');
export type DecideReviewDto = z.infer<typeof DecideReviewDto>;

export const ReviewSchema = z
  .object({
    id: z.string(),
    contentId: z.string(),
    revision: z.number().int(),
    reviewerEmail: z.string(),
    decision: z.enum(REVIEW_DECISIONS),
    comment: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi('Review');

export const ContentIdParamSchema = z.object({
  contentId: z.uuid().openapi({ param: { name: 'contentId', in: 'path' } }),
});
