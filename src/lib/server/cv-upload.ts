import { randomUUID } from 'node:crypto';

/**
 * CV upload validation.
 *
 * Four independent gates, because any one of them alone is bypassable: the
 * extension and the Content-Type are both attacker-controlled strings, the
 * size is checked before anything is read into memory, and the magic bytes
 * are the only thing that actually describes the file. A rename on top of
 * that removes the original filename from the storage path entirely, so a
 * name like `../../evil.html` or `cv.pdf.exe` cannot influence where the
 * object lands or how it is served back.
 */

/**
 * 4 MB, not the 5–10 MB you might expect.
 *
 * The application is submitted as one multipart request to a Vercel
 * Serverless Function, and the platform rejects request bodies over 4.5 MB
 * at the edge — before any of this code runs, with an HTML error page the
 * form cannot parse. Capping below that line means the applicant gets a clear
 * message from us instead of an opaque failure from the CDN. Real CVs are
 * almost always under 2 MB. See README-CAREERS.md to raise it.
 */
export const MAX_CV_BYTES = 4 * 1024 * 1024;
export const MAX_CV_MB = 4;

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'] as const;
type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

/** Browsers are inconsistent here, so each extension accepts a small set. */
const ALLOWED_MIME: Record<AllowedExtension, string[]> = {
  pdf: ['application/pdf', 'application/x-pdf', 'application/acrobat', 'binary/octet-stream', 'application/octet-stream'],
  doc: ['application/msword', 'application/vnd.ms-word', 'application/octet-stream', 'binary/octet-stream'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/zip',
    'application/octet-stream',
    'binary/octet-stream',
  ],
};

export const ACCEPT_ATTRIBUTE =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface CvValidationOk {
  ok: true;
  extension: AllowedExtension;
  /** Safe, server-generated object path inside the private bucket. */
  objectPath: string;
  /** Sanitised original name, kept only for display in the admin portal. */
  displayName: string;
  contentType: string;
  bytes: Uint8Array;
}

export interface CvValidationError {
  ok: false;
  error: string;
}

export type CvValidation = CvValidationOk | CvValidationError;

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

/**
 * Kept for the admin UI only — never used to build a path. Drops control
 * characters, path separators and anything that could be read as markup.
 * Written as a codepoint filter rather than a regex so the intent is legible.
 */
const UNSAFE_DISPLAY_CHARS = new Set(['<', '>', '"', "'", '`', '{', '}', '|', '^', '~', '[', ']', '\\', '/']);

function sanitiseDisplayName(name: string): string {
  const base = baseName(name).normalize('NFKC');
  let out = '';
  for (const char of base) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) continue; // control characters
    if (UNSAFE_DISPLAY_CHARS.has(char)) continue;
    out += char;
  }
  out = out.split(/\s+/).join(' ').trim();
  return (out || 'resume').slice(0, 120);
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, i) => bytes[i] === byte);
}

/** Looks for an ASCII needle in the first `limit` bytes of a buffer. */
function containsAscii(bytes: Uint8Array, needle: string, limit = 8192): boolean {
  const haystack = Buffer.from(bytes.subarray(0, Math.min(bytes.length, limit))).toString('latin1');
  return haystack.includes(needle);
}

const SIG_PDF = [0x25, 0x50, 0x44, 0x46]; // %PDF
const SIG_OLE2 = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]; // legacy .doc
const SIG_ZIP = [0x50, 0x4b]; // PK — .docx is a zip container

/** Signatures that must never be accepted, whatever the file claims to be. */
const FORBIDDEN_SIGNATURES: Array<{ sig: number[]; label: string }> = [
  { sig: [0x4d, 0x5a], label: 'Windows executable' }, // MZ — .exe/.dll
  { sig: [0x7f, 0x45, 0x4c, 0x46], label: 'Linux executable' }, // ELF
  { sig: [0xca, 0xfe, 0xba, 0xbe], label: 'Java class file' },
  { sig: [0x23, 0x21], label: 'shell script' }, // #!
];

/** Extensions that must not appear anywhere in the name, not just at the end. */
const FORBIDDEN_INNER_EXTENSIONS =
  /\.(exe|js|mjs|cjs|html?|htm|php|phtml|svg|zip|rar|7z|bat|cmd|com|sh|ps1|jar|msi|dll|scr|vbs|py|rb|pl)\b/i;

export function validateCv(file: File | null | undefined, rawBytes: Uint8Array | null): CvValidation {
  if (!file || !rawBytes) {
    return { ok: false, error: 'A CV/resume file is required.' };
  }

  if (rawBytes.byteLength === 0) {
    return { ok: false, error: 'The uploaded file is empty. Please attach a valid CV.' };
  }

  if (rawBytes.byteLength > MAX_CV_BYTES) {
    return { ok: false, error: `File is too large. Maximum size is ${MAX_CV_MB} MB.` };
  }

  const originalName = typeof file.name === 'string' ? file.name : '';
  if (!originalName.trim()) {
    return { ok: false, error: 'The uploaded file has no name. Please try again.' };
  }
  if (originalName.length > 255) {
    return { ok: false, error: 'The file name is too long. Please rename the file and try again.' };
  }

  const extension = extensionOf(originalName);
  if (!ALLOWED_EXTENSIONS.includes(extension as AllowedExtension)) {
    return { ok: false, error: 'Only PDF, DOC and DOCX files are accepted.' };
  }
  const ext = extension as AllowedExtension;

  // A double extension is the classic way to smuggle an executable past a
  // naive check, so inspect everything before the final dot too.
  const stem = originalName.slice(0, originalName.lastIndexOf('.'));
  if (FORBIDDEN_INNER_EXTENSIONS.test(stem)) {
    return { ok: false, error: 'That file type is not accepted. Please upload a PDF, DOC or DOCX.' };
  }

  const declaredType = (typeof file.type === 'string' ? file.type : '').toLowerCase().split(';')[0].trim();
  if (declaredType && !ALLOWED_MIME[ext].includes(declaredType)) {
    return { ok: false, error: 'Only PDF, DOC and DOCX files are accepted.' };
  }

  for (const { sig } of FORBIDDEN_SIGNATURES) {
    if (startsWith(rawBytes, sig)) {
      return { ok: false, error: 'That file type is not accepted. Please upload a PDF, DOC or DOCX.' };
    }
  }

  // Content check — the only gate the uploader does not control.
  if (ext === 'pdf') {
    if (!startsWith(rawBytes, SIG_PDF)) {
      return { ok: false, error: 'That file does not look like a valid PDF. Please re-save it and try again.' };
    }
  } else if (ext === 'doc') {
    // Word 97–2003 is an OLE2 compound file. Some exporters emit RTF or a
    // plain .docx under a .doc name, so allow those shapes too.
    const looksOle2 = startsWith(rawBytes, SIG_OLE2);
    const looksRtf = containsAscii(rawBytes, '{\\rtf', 16);
    const looksDocx = startsWith(rawBytes, SIG_ZIP) && containsAscii(rawBytes, 'word/', 65536);
    if (!looksOle2 && !looksRtf && !looksDocx) {
      return { ok: false, error: 'That file does not look like a valid Word document. Please re-save it and try again.' };
    }
  } else {
    // .docx — a zip, but only a Word one. A bare archive is rejected.
    if (!startsWith(rawBytes, SIG_ZIP)) {
      return { ok: false, error: 'That file does not look like a valid Word document. Please re-save it and try again.' };
    }
    if (!containsAscii(rawBytes, 'word/', 65536) && !containsAscii(rawBytes, 'wordprocessingml', 65536)) {
      return { ok: false, error: 'Archives are not accepted. Please upload the CV itself as a PDF, DOC or DOCX.' };
    }
  }

  const storedContentType =
    ext === 'pdf'
      ? 'application/pdf'
      : ext === 'doc'
        ? 'application/msword'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // Server-generated path. No part of it comes from the applicant, so it can
  // neither traverse directories nor be guessed from the outside.
  const now = new Date();
  const yyyyMm = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const objectPath = `resumes/${yyyyMm}/${randomUUID()}.${ext}`;

  return {
    ok: true,
    extension: ext,
    objectPath,
    displayName: sanitiseDisplayName(originalName),
    contentType: storedContentType,
    bytes: rawBytes,
  };
}
