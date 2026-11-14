import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Assalamu alaikum from the Isnād Kids API');
});

export default app;
