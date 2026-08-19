import crypto from 'crypto';

/**
 * AES-256-GCM helpers for encrypting integration credentials at rest.
 *
 * The key comes from INTEGRATION_KEY (64 hex chars = 32 bytes). It MUST be
 * set — we do not fall back to a hard-coded key because that would silently
 * downgrade "encrypted" storage to "obfuscated" and give a false sense of
 * safety. The env var is only read when encrypt/decrypt is actually called,
 * so the server starts fine without it — the failure surfaces only when an
 * integration is saved or tested.
 */

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.INTEGRATION_KEY;
  if (!raw) {
    throw new Error(
      'INTEGRATION_KEY env var is required to store or read integration credentials. ' +
        'Generate one with: `node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"` ' +
        'then set it in Render → Environment.',
    );
  }
  const buf = Buffer.from(raw, 'hex');
  if (buf.length !== 32) {
    throw new Error(
      `INTEGRATION_KEY must decode to 32 bytes (64 hex chars). Got ${buf.length}.`,
    );
  }
  return buf;
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALG, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Layout: IV | TAG | CIPHERTEXT — single base64 blob for portable storage.
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error('Ciphertext too short — payload is corrupted.');
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALG, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
