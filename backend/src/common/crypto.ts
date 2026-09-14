import crypto from 'crypto';
import { InternalServerErrorException } from '@nestjs/common';

/**
 * AES-256-GCM helpers for encrypting integration credentials at rest.
 *
 * The key comes from INTEGRATION_KEY (64 hex chars = 32 bytes).
 * If INTEGRATION_KEY is unset in the deployment environment (e.g. Render dashboard),
 * it securely derives a deterministic 32-byte key from JWT_SECRET or DATABASE_URL
 * so saving integrations never throws a 500 Internal Server Error.
 */

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.INTEGRATION_KEY;
  if (raw && raw.trim()) {
    const trimmed = raw.trim();
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      return Buffer.from(trimmed, 'hex');
    }
    // If provided in non-hex format or custom string, hash to 32 bytes
    return crypto.createHash('sha256').update(trimmed).digest();
  }

  // Resilient fallback: derive from JWT_SECRET or DATABASE_URL
  const secretFallback = process.env.JWT_SECRET || process.env.DATABASE_URL;
  if (secretFallback && secretFallback.trim()) {
    return crypto
      .createHash('sha256')
      .update(`glitz-integrations:${secretFallback.trim()}`)
      .digest();
  }

  throw new InternalServerErrorException(
    'INTEGRATION_KEY or JWT_SECRET env var is required to store or read integration credentials. ' +
      'Please configure INTEGRATION_KEY in your environment.',
  );
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
