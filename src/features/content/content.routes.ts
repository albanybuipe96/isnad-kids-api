import { Hono } from 'hono';
import { createDb } from '../../db';
import { createContentSchema, updateContentSchema } from './content.schemas';
import {
  createContent,
  listContent,
  getContent,
  updateContent,
  deleteContent,
} from './content.service';

type Env = { Bindings: { DB: D1Database } };

const content = new Hono<Env>();

content.post('/', async (c) => {
  const body = await c.req.json();
  const input = createContentSchema.parse(body);
  const db = createDb(c.env.DB);
  const item = await createContent(db, input);
  return c.json(item, 201);
});

content.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const items = await listContent(db);
  return c.json(items);
});

content.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = Number(c.req.param('id'));
  const item = await getContent(db, id);
  if (!item) {
    return c.json({ error: { message: 'Content not found', status: 404 } }, 404);
  }
  return c.json(item);
});

content.patch('/:id', async (c) => {
  const body = await c.req.json();
  const input = updateContentSchema.parse(body);
  const db = createDb(c.env.DB);
  const id = Number(c.req.param('id'));
  const item = await updateContent(db, id, input);
  if (!item) {
    return c.json({ error: { message: 'Content not found', status: 404 } }, 404);
  }
  return c.json(item);
});

content.delete('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = Number(c.req.param('id'));
  const item = await deleteContent(db, id);
  if (!item) {
    return c.json({ error: { message: 'Content not found', status: 404 } }, 404);
  }
  return c.json({ message: 'Deleted' });
});

export default content;
