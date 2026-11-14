import { describe, expect, it } from 'vitest';
import { call, signUpParent } from './helpers';

describe('health and docs', () => {
  it('reports the API and database as up', async () => {
    const res = await call('/health');
    expect(res.status).toBe(200);
    expect(res.json).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('serves the OpenAPI spec with every module', async () => {
    const res = await call('/openapi.json');
    expect(res.status).toBe(200);
    const paths = Object.keys(res.json.paths);
    expect(paths).toEqual(
      expect.arrayContaining(['/v1/children', '/v1/progress/{childId}', '/admin/content/{id}/submit', '/v1/packs/latest']),
    );
  });
});

describe('parents, child profiles and progress sync', () => {
  it('rejects requests without a session', async () => {
    const res = await call('/v1/children');
    expect(res.status).toBe(401);
    expect(res.json).toMatchObject({ statusCode: 401, error: 'Unauthorized' });
  });

  it('signs in with the password set at sign-up', async () => {
    const { email } = await signUpParent();
    const ok = await call('/v1/auth/sign-in/email', {
      method: 'POST',
      body: { email, password: 'correct-horse-battery' },
    });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('set-auth-token')).toBeTruthy();

    const wrong = await call('/v1/auth/sign-in/email', { method: 'POST', body: { email, password: 'wrong-password' } });
    expect(wrong.status).toBe(401);
  });

  it('creates, updates and isolates child profiles per family', async () => {
    const parent = await signUpParent();
    const created = await call('/v1/children', {
      method: 'POST',
      headers: parent.headers,
      body: { name: 'Amina', avatar: 'girl-headscarf-1', ageBand: 'little', settings: { riwayah: 'warsh' } },
    });
    expect(created.status).toBe(201);
    expect(created.json.settings).toMatchObject({ riwayah: 'warsh', music: 'none', showFaces: false });
    expect(created.json.narrationLanguage).toBe('en');

    const updated = await call(`/v1/children/${created.json.id}`, {
      method: 'PATCH',
      headers: parent.headers,
      body: { narrationLanguage: 'ha', settings: { dailyLimitMinutes: 20 } },
    });
    expect(updated.status).toBe(200);
    expect(updated.json.settings).toMatchObject({ riwayah: 'warsh', dailyLimitMinutes: 20 });
    expect(updated.json.narrationLanguage).toBe('ha');

    const other = await signUpParent();
    const peek = await call(`/v1/children/${created.json.id}`, { headers: other.headers });
    expect(peek.status).toBe(404);
    expect((await call('/v1/children', { headers: other.headers })).json).toEqual([]);
  });

  it('validates input with field-level errors', async () => {
    const parent = await signUpParent();
    const res = await call('/v1/children', {
      method: 'POST',
      headers: parent.headers,
      body: { name: '', avatar: 'x', ageBand: 'toddler' },
    });
    expect(res.status).toBe(400);
    expect(res.json.details.map((d: { path: string }) => d.path)).toEqual(expect.arrayContaining(['name', 'ageBand']));
  });

  it('syncs progress idempotently and pages with a cursor', async () => {
    const parent = await signUpParent();
    const child = (
      await call('/v1/children', {
        method: 'POST',
        headers: parent.headers,
        body: { name: 'Yusuf', avatar: 'boy-fugu-1', ageBand: 'little' },
      })
    ).json;

    const events = Array.from({ length: 30 }, (_, i) => ({
      id: crypto.randomUUID(),
      skill: 'surah:al-ikhlas',
      kind: 'listened',
      value: { ayah: (i % 4) + 1 },
      occurredAt: new Date(Date.UTC(2026, 10, 14, 9, i)).toISOString(),
    }));

    const first = await call(`/v1/progress/${child.id}`, { method: 'POST', headers: parent.headers, body: { events } });
    expect(first.json).toEqual({ accepted: 30, duplicates: 0 });

    // A retry after a dropped connection must not double-count.
    const retry = await call(`/v1/progress/${child.id}`, {
      method: 'POST',
      headers: parent.headers,
      body: { events: events.slice(20) },
    });
    expect(retry.json).toEqual({ accepted: 0, duplicates: 10 });

    const page1 = await call(`/v1/progress/${child.id}?limit=25`, { headers: parent.headers });
    expect(page1.json.events).toHaveLength(25);
    expect(page1.json.hasMore).toBe(true);
    const page2 = await call(`/v1/progress/${child.id}?since=${page1.json.cursor}`, { headers: parent.headers });
    expect(page2.json.events).toHaveLength(5);
    expect(page2.json.hasMore).toBe(false);

    const other = await signUpParent();
    const blocked = await call(`/v1/progress/${child.id}`, { method: 'POST', headers: other.headers, body: { events } });
    expect(blocked.status).toBe(404);
  });
});
