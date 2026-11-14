import { exports } from 'cloudflare:workers';

const BASE = 'http://localhost';

export async function call(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string>; raw?: BodyInit } = {},
) {
  const headers: Record<string, string> = { ...init.headers };
  let body: BodyInit | undefined = init.raw;
  if (init.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  const response = await exports.default.fetch(new Request(`${BASE}${path}`, { method: init.method ?? 'GET', headers, body }));
  const type = response.headers.get('content-type') ?? '';
  let json: any = null;
  if (type.includes('json') || type.startsWith('text/')) {
    const text = await response.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
  } else {
    await response.arrayBuffer();
  }
  return { status: response.status, headers: response.headers, json };
}

export const asAdmin = (email: string) => ({ 'x-dev-admin-email': email });

/** Signs up a parent and returns the bearer token the Flutter app would store. */
export async function signUpParent(email = `parent-${crypto.randomUUID()}@test.local`) {
  const res = await call('/v1/auth/sign-up/email', {
    method: 'POST',
    body: { name: 'Test Parent', email, password: 'correct-horse-battery' },
  });
  if (res.status !== 200) throw new Error(`sign-up failed: ${res.status} ${JSON.stringify(res.json)}`);
  const token = res.headers.get('set-auth-token');
  if (!token) throw new Error('no set-auth-token header');
  return { email, headers: { authorization: `Bearer ${token}` } };
}

export async function uploadAudio(name = 'ayah.opus') {
  const res = await call(`/admin/media?kind=audio&filename=${name}`, {
    method: 'POST',
    raw: new Uint8Array([79, 103, 103, 83, 1, 2, 3, 4]),
    headers: { ...asAdmin('editor@test.local'), 'content-type': 'audio/ogg' },
  });
  if (res.status !== 201) throw new Error(`upload failed: ${res.status} ${JSON.stringify(res.json)}`);
  return res.json as { id: string; key: string; bytes: number };
}
