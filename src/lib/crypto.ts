import crypto from 'crypto';

/**
 * Server-side encryption at rest (AES-256-GCM).
 * Store `ENCRYPTION_KEY_BASE64` in `.env.local` (32 bytes, base64 encoded).
 *
 * NOTE: This is not "client-only" E2E encryption. The server can decrypt.
 * It protects data at rest (DB dumps, disk exposure) when the key is kept safe.
 */

function getKey(): Buffer {
  const b64 = process.env.ENCRYPTION_KEY_BASE64;
  if (!b64) throw new Error('ENCRYPTION_KEY_BASE64 is not set in .env.local');
  const key = Buffer.from(b64, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
  return key;
}

export type EncryptedPayload = {
  v: 1;
  alg: 'aes-256-gcm';
  iv: string; // base64
  tag: string; // base64
  data: string; // base64 (ciphertext)
};

export function encryptJson(value: unknown): EncryptedPayload {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  };
}

export function decryptJson<T = unknown>(payload: EncryptedPayload): T {
  if (!payload || payload.v !== 1 || payload.alg !== 'aes-256-gcm') {
    throw new Error('Unsupported encrypted payload');
  }
  const key = getKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const data = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  return JSON.parse(plaintext) as T;
}

