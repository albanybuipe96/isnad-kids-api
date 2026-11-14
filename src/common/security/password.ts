/**
 * Password hashing with PBKDF2-SHA256 from Web Crypto. Runs natively on Workers and keeps
 * sign-in within Workers CPU limits. Workers caps PBKDF2 at 100,000 iterations.
 * Stored format: pbkdf2$<iterations>$<salt base64>$<hash base64>
 */
const ITERATIONS = 100_000;
const KEY_BYTES = 32;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (ch) => ch.charCodeAt(0));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const [scheme, iterations, salt, expected] = hash.split('$');
  if (scheme !== 'pbkdf2' || !iterations || !salt || !expected) return false;
  const actual = await derive(password, fromBase64(salt), Number(iterations));
  const expectedBytes = fromBase64(expected);
  if (actual.length !== expectedBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i]! ^ expectedBytes[i]!;
  return diff === 0;
}
