import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_IMAGES_PER_LISTING } from '@/lib/utils/constants';
import { AppError } from '@/lib/utils/errors';

// Magic bytes for image type detection
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF...WEBP — further check needed
};

export async function validateImageFile(file: File): Promise<void> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError(`Datei zu groß (max. ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`, 413);
  }

  const mimeType = file.type as typeof ALLOWED_MIME_TYPES[number];
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new AppError('Nur JPG, PNG und WebP sind erlaubt', 415);
  }

  // Check magic bytes
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 12));

  const isValid = checkMagicBytes(bytes, mimeType);
  if (!isValid) {
    throw new AppError('Ungültiger Dateityp (Magic-Bytes-Prüfung fehlgeschlagen)', 415);
  }
}

function checkMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  return signatures.some((sig) =>
    sig.every((byte, i) => bytes[i] === byte)
  );
}

export function validateImageCount(currentCount: number): void {
  if (currentCount >= MAX_IMAGES_PER_LISTING) {
    throw new AppError(`Maximal ${MAX_IMAGES_PER_LISTING} Bilder pro Inserat`, 400);
  }
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 100);
}
