import { z } from 'zod';

export const createContentSchema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  body: z.string().optional(),
});

export const updateContentSchema = createContentSchema.partial();

export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
