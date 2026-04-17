const SECRET = process.env.CLERK_SECRET_KEY || 'fallback-secret';

async function hmacSign(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export async function signBridgeCookie(userId: string): Promise<string> {
  const sig = await hmacSign(userId);
  return `${userId}.${sig}`;
}

export async function verifyBridgeCookie(value: string, userId: string): Promise<boolean> {
  const expected = await signBridgeCookie(userId);
  return value === expected;
}
