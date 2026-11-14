import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.module';
import { Container } from '../src/common/di/container';
import { PacksService } from '../src/modules/packs/packs.service';
import { asAdmin, call, uploadAudio } from './helpers';

const editor = asAdmin('editor@test.local');
const reviewer = asAdmin('reviewer@test.local');
const admin = asAdmin('admin@test.local');

async function createListenAlong(audioId: string, overrides: Record<string, unknown> = {}) {
  const res = await call('/admin/content', {
    method: 'POST',
    headers: editor,
    body: {
      slug: `al-ikhlas-${crypto.randomUUID().slice(0, 8)}`,
      title: 'Al-Ikhlas: listen along',
      section: 'quran_garden',
      template: 'listen_along',
      ageBands: ['little', 'explorer'],
      skills: ['surah:al-ikhlas'],
      isIslamic: true,
      data: {
        surah: { number: 112, nameArabic: 'الإخلاص', nameEnglish: 'Al-Ikhlas' },
        ayat: [{ number: 1, text: 'placeholder: import verified text', audioMediaId: audioId }],
      },
      ...overrides,
    },
  });
  expect(res.status).toBe(201);
  return res.json;
}

describe('admin access', () => {
  it('requires a Cloudflare Access token outside development', async () => {
    const app = createApp();
    const production = { ...env, ENVIRONMENT: 'production' };
    const missing = await app.request('/admin/content', {}, production);
    expect(missing.status).toBe(401);
    const forged = await app.request('/admin/content', { headers: { 'cf-access-jwt-assertion': 'not-a-jwt' } }, production);
    expect(forged.status).toBe(401);
  });

  it('rejects unknown and deactivated admin users', async () => {
    expect((await call('/admin/content', { headers: asAdmin('stranger@test.local') })).status).toBe(403);
    expect((await call('/admin/content', { headers: asAdmin('inactive@test.local') })).status).toBe(403);
  });

  it('enforces roles', async () => {
    const audio = await uploadAudio();
    const item = await createListenAlong(audio.id);
    const createAsReviewer = await call('/admin/content', { method: 'POST', headers: reviewer, body: {} });
    expect(createAsReviewer.status).toBe(403);
    const approveAsEditor = await call(`/admin/reviews/${item.id}`, {
      method: 'POST',
      headers: editor,
      body: { decision: 'approve' },
    });
    expect(approveAsEditor.status).toBe(403);
    const publishAsEditor = await call('/admin/packs', { method: 'POST', headers: editor, body: {} });
    expect(publishAsEditor.status).toBe(403);
  });
});

describe('media uploads', () => {
  it('stores files in R2 with a checksum and rejects the wrong type', async () => {
    const audio = await uploadAudio();
    const object = await env.MEDIA.get(audio.key);
    expect(object?.size).toBe(8);

    const wrongType = await call('/admin/media?kind=audio&filename=x.png', {
      method: 'POST',
      raw: new Uint8Array([1]),
      headers: { ...editor, 'content-type': 'image/png' },
    });
    expect(wrongType.status).toBe(400);
  });

  it('rejects content that points at media that does not exist', async () => {
    const res = await call('/admin/content', {
      method: 'POST',
      headers: editor,
      body: {
        slug: 'broken-item',
        title: 'Broken',
        section: 'dua_time',
        template: 'repeat_after_me',
        ageBands: ['little'],
        isIslamic: true,
        data: { promptAudioMediaId: crypto.randomUUID() },
      },
    });
    expect(res.status).toBe(400);
  });
});

describe('review workflow and content packs', () => {
  it('takes an item from draft to a published pack', async () => {
    const audio = await uploadAudio();
    const item = await createListenAlong(audio.id);
    expect(item.status).toBe('draft');
    expect(item.mediaIds).toEqual([audio.id]); // collected from data automatically

    // Islamic content without a source or riwayah cannot go to review.
    const notReady = await call(`/admin/content/${item.id}/submit`, { method: 'POST', headers: editor });
    expect(notReady.status).toBe(400);
    expect(notReady.json.details.map((d: { path: string }) => d.path)).toEqual(['source', 'riwayah']);

    await call(`/admin/content/${item.id}`, {
      method: 'PATCH',
      headers: editor,
      body: { source: "Qur'an 112:1-4", riwayah: 'hafs' },
    });
    const submitted = await call(`/admin/content/${item.id}/submit`, { method: 'POST', headers: editor });
    expect(submitted.json.status).toBe('in_review');

    // Can't edit while waiting for review.
    const editWhileReviewing = await call(`/admin/content/${item.id}`, {
      method: 'PATCH',
      headers: editor,
      body: { title: 'Changed' },
    });
    expect(editWhileReviewing.status).toBe(409);

    const queue = await call('/admin/reviews/queue', { headers: reviewer });
    expect(queue.json.map((q: { id: string }) => q.id)).toContain(item.id);

    // Requesting changes needs a comment.
    const noComment = await call(`/admin/reviews/${item.id}`, {
      method: 'POST',
      headers: reviewer,
      body: { decision: 'request_changes' },
    });
    expect(noComment.status).toBe(400);

    const changes = await call(`/admin/reviews/${item.id}`, {
      method: 'POST',
      headers: reviewer,
      body: { decision: 'request_changes', comment: 'Slow the recitation down for ayah 1' },
    });
    expect(changes.json.status).toBe('changes_requested');

    await call(`/admin/content/${item.id}/submit`, { method: 'POST', headers: editor });
    const approved = await call(`/admin/reviews/${item.id}`, {
      method: 'POST',
      headers: reviewer,
      body: { decision: 'approve', comment: 'Checked against the mushaf' },
    });
    expect(approved.json.status).toBe('approved');

    const history = await call(`/admin/reviews/${item.id}/history`, { headers: admin });
    expect(history.json.map((h: { decision: string }) => h.decision)).toEqual(['approve', 'request_changes']);

    // Publish: the API queues the build; run the consumer's work directly here.
    expect((await call('/v1/packs/latest')).status).toBe(404);
    const queued = await call('/admin/packs', { method: 'POST', headers: admin, body: { notes: 'First pack' } });
    expect(queued.status).toBe(202);
    expect(queued.json.status).toBe('building');
    expect((await call('/admin/packs', { method: 'POST', headers: admin, body: {} })).status).toBe(409);

    await new Container(env).get(PacksService).build(queued.json.id);

    const latest = await call('/v1/packs/latest');
    expect(latest.status).toBe(200);
    expect(latest.json).toMatchObject({ version: 1, itemCount: 1, totalBytes: 8 });

    const manifestPath = new URL(latest.json.manifestUrl).pathname;
    const manifest = (await call(manifestPath)).json;
    expect(manifest.items.map((i: { id: string }) => i.id)).toEqual([item.id]);
    expect(manifest.media[0]).toMatchObject({ id: audio.id, bytes: 8 });
    expect(manifest.sections.quran_garden).toEqual({ itemCount: 1, bytes: 8 });

    const file = await call(`/v1/media/${audio.key}`);
    expect(file.status).toBe(200);

    // Published content is protected.
    expect((await call(`/admin/content/${item.id}`, { method: 'DELETE', headers: editor })).status).toBe(409);
    expect((await call(`/admin/media/${audio.id}`, { method: 'DELETE', headers: admin })).status).toBe(409);

    // Editing approved content sends it back for review.
    const edited = await call(`/admin/content/${item.id}`, {
      method: 'PATCH',
      headers: editor,
      body: { title: 'Al-Ikhlas (new recording)' },
    });
    expect(edited.json).toMatchObject({ status: 'draft', lastPublishedPackVersion: 1 });
  });

  it('refuses to serve files outside the public folders', async () => {
    expect((await call('/v1/media/secret/thing.txt')).status).toBe(404);
  });
});
