import { createRoute, z } from '@hono/zod-openapi';
import { AdminGuard } from '@/common/guards/admin.guard';
import { Roles } from '@/common/guards/roles.guard';
import { createRouter } from '@/common/http/create-router';
import { ADMIN_SECURITY, errorResponses, jsonBody, jsonResponse } from '@/common/http/schemas';
import { ContentItemSchema } from '@/modules/content/dto/content.dto';
import { ContentIdParamSchema, DecideReviewDto, ReviewSchema } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

const tags = ['Admin: reviews'];
const security = ADMIN_SECURITY;

const getQueue = createRoute({
  method: 'get',
  path: '/queue',
  tags,
  security,
  summary: 'Items waiting for review, oldest first',
  responses: { 200: jsonResponse(z.array(ContentItemSchema), 'Review queue') },
});

const decide = createRoute({
  method: 'post',
  path: '/{contentId}',
  tags,
  security,
  summary: 'Approve an item or request changes',
  middleware: [Roles('reviewer')] as const,
  request: { params: ContentIdParamSchema, body: jsonBody(DecideReviewDto) },
  responses: {
    200: jsonResponse(ContentItemSchema, 'Decision recorded'),
    400: errorResponses[400],
    403: errorResponses[403],
    409: jsonResponse(z.object({ message: z.string() }), 'Not waiting for review'),
  },
});

const getHistory = createRoute({
  method: 'get',
  path: '/{contentId}/history',
  tags,
  security,
  summary: 'Every review decision for an item, newest first',
  request: { params: ContentIdParamSchema },
  responses: { 200: jsonResponse(z.array(ReviewSchema), 'Review history'), 404: errorResponses[404] },
});

export const reviewsController = createRouter();
reviewsController.use('*', AdminGuard);

reviewsController
  .openapi(getQueue, async (c) => c.json(await c.var.container.get(ReviewsService).queue(), 200))
  .openapi(decide, async (c) => {
    const { contentId } = c.req.valid('param');
    const result = await c.var.container.get(ReviewsService).decide(contentId, c.var.admin.email, c.req.valid('json'));
    return c.json(result, 200);
  })
  .openapi(getHistory, async (c) => {
    return c.json(await c.var.container.get(ReviewsService).history(c.req.valid('param').contentId), 200);
  });
