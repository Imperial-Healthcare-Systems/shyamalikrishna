import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

/**
 * Password hashing for the admin portal.
 *
 * scrypt is used rather than bcrypt/argon2 because it ships inside Node's
 * standard library — no native module to compile, which matters on Vercel's
 * serverless runtime where the whole admin API is a single route handler.
 * It is a memory-hard KDF and is an accepted choice alongside those two.
 *
 * Stored format:  scrypt$N$r$p$<salt base64>$<derived key base64>
 * Nothing reversible is ever written; the plaintext never leaves this module.
 */

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

const N = 16384; // CPU/memory cost
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const n = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

    const salt = Buffer.from(parts[4], 'base64');
    const expected = Buffer.from(parts[5], 'base64');
    const derived = await scrypt(password.normalize('NFKC'), salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: MAXMEM,
    });
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** URL-safe single-use reset token. Only its SHA-256 is stored. */
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: sha256(token) };
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const WEAK_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd', '12345678', '123456789',
  '1234567890', 'qwertyui', 'qwerty123', 'admin123', 'administrator', 'letmein',
  'welcome1', 'iloveyou', 'abc12345', 'changeme', 'pass1234', 'adminadmin',
]);

/**
 * Deliberately modest rules — this is one non-technical administrator, and a
 * rule set they cannot satisfy just becomes a sticky note on the monitor.
 * Length does most of the work; the rest blocks the obvious guesses.
 */
export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== 'string') return 'Password is required.';
  const value = password.normalize('NFKC');
  if (value.length < 8) return 'Password must be at least 8 characters long.';
  if (value.length > 200) return 'Password must be 200 characters or fewer.';
  if (!/[A-Za-z]/.test(value)) return 'Password must contain at least one letter.';
  if (!/[0-9]/.test(value)) return 'Password must contain at least one number.';
  if (WEAK_PASSWORDS.has(value.toLowerCase())) return 'That password is too easy to guess. Please choose another.';
  if (/^(.)\1+$/.test(value)) return 'Password cannot be a single repeated character.';
  return null;
}
