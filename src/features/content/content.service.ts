import { eq } from 'drizzle-orm';
import { Database } from '../../db';
import { contentItems } from '../../db/schema';
import { CreateContentInput, UpdateContentInput } from './content.schemas';

export async function createContent(db: Database, input: CreateContentInput) {
  const result = await db.insert(contentItems).values(input).returning();
  return result[0];
}

export async function listContent(db: Database) {
  return db.select().from(contentItems);
}

export async function getContent(db: Database, id: number) {
  const result = await db
    .select()
    .from(contentItems)
    .where(eq(contentItems.id, id));
  return result[0] ?? null;
}

export async function updateContent(
  db: Database,
  id: number,
  input: UpdateContentInput
) {
  const result = await db
    .update(contentItems)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(contentItems.id, id))
    .returning();
  return result[0] ?? null;
}

export async function deleteContent(db: Database, id: number) {
  const result = await db
    .delete(contentItems)
    .where(eq(contentItems.id, id))
    .returning();
  return result[0] ?? null;
}
