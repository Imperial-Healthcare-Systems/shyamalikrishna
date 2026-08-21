import { randomUUID } from 'node:crypto';

/**
 * Banner image validation for the admin job editor.
 *
 * Same shape as the CV validator in cv-upload.ts, and for the same reason: the
 * extension and the Content-Type are both caller-supplied strings, so the
 * magic bytes are the only gate that actually describes the file. The stored
 * path is generated here rather than taken from the upload, so a name like
 * `../../evil.html` cannot influence where the object lands.
 *
 * One difference matters. This bucket is PUBLIC, so anything accepted here is
 * served straight back to visitors from our own origin — which is exactly the
 * condition that makes SVG dangerous, since it can carry script. Raster only.
 */

/**
 * 4 MB, matching the CV limit and for the same platform reason: the upload is
 * one multipart request to a Vercel Serverless Function, and the platform
 * rejects bodies over 4.5 MB at the edge before this code runs. Banners should
 * be far smaller than this anyway.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_MB = 4;

/**
 * Banner shape, taken from the homepage hero so the two read as one design.
 *
 * The aspect ratio is what is actually enforced, not these exact numbers. The
 * banner is rendered with `object-cover`, which crops whatever it is given to
 * the shape of its container — so a 16:9 image at any resolution lands
 * correctly, while a portrait photo would have its middle cut out and its
 * subject lost. Demanding these precise pixels instead would mean the admin
 * had to crop to the pixel before every upload, which is a lot of friction to
 * buy nothing extra.
 */
export const BANNER_WIDTH = 1672;
export const BANNER_HEIGHT = 941;
const BANNER_RATIO = BANNER_WIDTH / BANNER_HEIGHT; // ≈1.78, i.e. 16:9

/** Below this the banner is visibly soft on a desktop screen. */
export const BANNER_MIN_WIDTH = 1200;

/**
 * ±0.06, so anything from about 1.72 to 1.84 is accepted.
 *
 * That covers a true 16:9 (1.778) and the near misses that come out of a
 * manual crop, but nothing wider or squarer: 16:10 (1.60), 3:2 (1.50), 4:3
 * (1.33), square and portrait are all rejected, as is 1.85:1 cinema at the
 * other end. Widening it far enough to admit cinema would also start letting
 * in shapes that visibly disagree with the homepage hero.
 */
const RATIO_TOLERANCE = 0.06;

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

const ALLOWED_MIME: Record<AllowedExtension, string[]> = {
  jpg: ['image/jpeg', 'image/jpg'],
  jpeg: ['image/jpeg', 'image/jpg'],
  png: ['image/png'],
  webp: ['image/webp'],
};

export const IMAGE_ACCEPT_ATTRIBUTE = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

export interface ImageValidationOk {
  ok: true;
  /** Server-generated object path inside the public bucket. */
  objectPath: string;
  contentType: string;
  bytes: Uint8Array;
}

export interface ImageValidationError {
  ok: false;
  error: string;
}

export type ImageValidation = ImageValidationOk | ImageValidationError;

function baseName(name: string): string {
  const parts = name.split('/').join('\\').split('\\');
  return parts[parts.length - 1] || '';
}

function extensionOf(name: string): string {
  const clean = baseName(name);
  const dot = clean.lastIndexOf('.');
  if (dot === -1 || dot === clean.length - 1) return '';
  return clean.slice(dot + 1).toLowerCase();
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, i) => bytes[i] === byte);
}

const SIG_JPEG = [0xff, 0xd8, 0xff];
const SIG_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const SIG_RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF", bytes 8-11 are "WEBP"

function looksWebp(bytes: Uint8Array): boolean {
  if (!startsWith(bytes, SIG_RIFF) || bytes.length < 12) return false;
  return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Reads the pixel dimensions out of the file header.
 *
 * Done by hand rather than by decoding the image: the numbers live in the
 * first few dozen bytes of all three formats, and pulling in a decoder to
 * learn them would mean parsing attacker-supplied pixel data on the server for
 * no reason. Returns null when the header is malformed, which the caller
 * treats as a rejection.
 */
function readDimensions(bytes: Uint8Array, ext: AllowedExtension): Dimensions | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (ext === 'png') {
    // IHDR is always the first chunk: 8-byte signature, 4-byte length,
    // 4-byte type, then width and height as big-endian uint32.
    if (bytes.length < 24) return null;
    return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
  }

  if (ext === 'webp') {
    if (bytes.length < 30) return null;
    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

    if (chunk === 'VP8X') {
      // Canvas size, stored minus one across three little-endian bytes.
      const w = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
      const h = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
      return { width: w, height: h };
    }

    if (chunk === 'VP8 ') {
      // Lossy: a 3-byte frame tag, the 3-byte sync code 9D 01 2A, then two
      // 16-bit values whose low 14 bits are the dimensions.
      if (!(bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a)) return null;
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }

    if (chunk === 'VP8L') {
      // Lossless: signature byte, then width-1 and height-1 packed as two
      // 14-bit fields across the following four bytes.
      if (bytes[20] !== 0x2f) return null;
      const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }

    return null;
  }

  // JPEG: walk the segment chain to the start-of-frame marker, which is the
  // only place the dimensions appear. Segment lengths are big-endian and
  // include their own two bytes.
  let offset = 2; // skip SOI
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];

    // Standalone markers carry no length field.
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }

    const length = view.getUint16(offset + 2, false);
    if (length < 2) return null;

    // SOF0-SOF15, excluding the DHT/JPG/DAC markers interleaved in that range.
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isStartOfFrame) {
      return {
        height: view.getUint16(offset + 5, false),
        width: view.getUint16(offset + 7, false),
      };
    }

    offset += 2 + length;
  }

  return null;
}

/** Extensions that must not appear anywhere in the name, not just at the end. */
const FORBIDDEN_INNER_EXTENSIONS =
  /\.(exe|js|mjs|cjs|html?|htm|php|phtml|svg|zip|rar|7z|bat|cmd|com|sh|ps1|jar|msi|dll|scr|vbs|py|rb|pl)\b/i;

export function validateImage(file: File | null | undefined, rawBytes: Uint8Array | null): ImageValidation {
  if (!file || !rawBytes) {
    return { ok: false, error: 'Choose an image to upload.' };
  }

  if (rawBytes.byteLength === 0) {
    return { ok: false, error: 'That file is empty. Please choose another image.' };
  }

  if (rawBytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, error: `Image is too large. Maximum size is ${MAX_IMAGE_MB} MB.` };
  }

  const originalName = typeof file.name === 'string' ? file.name : '';
  if (!originalName.trim()) {
    return { ok: false, error: 'That file has no name. Please try again.' };
  }
  if (originalName.length > 255) {
    return { ok: false, error: 'The file name is too long. Please rename it and try again.' };
  }

  const extension = extensionOf(originalName);
  if (!ALLOWED_EXTENSIONS.includes(extension as AllowedExtension)) {
    return { ok: false, error: 'Only JPG, PNG and WebP images are accepted.' };
  }
  const ext = extension as AllowedExtension;

  const stem = originalName.slice(0, originalName.lastIndexOf('.'));
  if (FORBIDDEN_INNER_EXTENSIONS.test(stem)) {
    return { ok: false, error: 'That file type is not accepted. Please upload a JPG, PNG or WebP.' };
  }

  const declaredType = (typeof file.type === 'string' ? file.type : '').toLowerCase().split(';')[0].trim();
  if (declaredType && !ALLOWED_MIME[ext].includes(declaredType)) {
    return { ok: false, error: 'Only JPG, PNG and WebP images are accepted.' };
  }

  // The only gate the uploader does not control.
  const matchesContent =
    ext === 'png' ? startsWith(rawBytes, SIG_PNG)
      : ext === 'webp' ? looksWebp(rawBytes)
        : startsWith(rawBytes, SIG_JPEG);

  if (!matchesContent) {
    return { ok: false, error: 'That file does not look like a valid image. Please re-save it and try again.' };
  }

  const size = readDimensions(rawBytes, ext);
  if (!size || size.width < 1 || size.height < 1) {
    return { ok: false, error: 'Could not read that image’s dimensions. Please re-save it and try again.' };
  }

  if (size.width < BANNER_MIN_WIDTH) {
    return {
      ok: false,
      error:
        `That image is ${size.width}×${size.height}px, which is too small — it would look blurry across ` +
        `the top of the page. Use one at least ${BANNER_MIN_WIDTH}px wide (${BANNER_WIDTH}×${BANNER_HEIGHT} is ideal).`,
    };
  }

  const ratio = size.width / size.height;
  if (Math.abs(ratio - BANNER_RATIO) > RATIO_TOLERANCE) {
    const shape = ratio < BANNER_RATIO ? (ratio < 1 ? 'portrait' : 'too square') : 'too wide';
    return {
      ok: false,
      error:
        `That image is ${size.width}×${size.height}px, which is ${shape} for a banner. It needs to be ` +
        `widescreen — about ${BANNER_WIDTH}×${BANNER_HEIGHT}px (16:9). Crop it and try again.`,
    };
  }

  const storedContentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const now = new Date();
  const yyyyMm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  return {
    ok: true,
    objectPath: `jobs/${yyyyMm}/${randomUUID()}.${ext}`,
    contentType: storedContentType,
    bytes: rawBytes,
  };
}
