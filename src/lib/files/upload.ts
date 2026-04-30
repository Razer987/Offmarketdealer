import path from 'path';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { sanitizeFilename } from '@/lib/files/validate';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

export interface ProcessedImage {
  filename: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveImage(file: File, listingId: string): Promise<ProcessedImage> {
  await ensureUploadDir();

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = sanitizeFilename(file.name);
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const uniqueName = `${listingId}_${randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(UPLOAD_DIR, uniqueName);

  // Strip EXIF and resize to max 2000px wide, keeping aspect ratio
  const processed = await sharp(buffer)
    .rotate() // auto-rotate based on EXIF
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .toFormat('webp', { quality: 85 })
    .toFile(filePath.replace(/\.[^.]+$/, '.webp'));

  const finalName = uniqueName.replace(/\.[^.]+$/, '.webp');

  return {
    filename: finalName,
    width: processed.width,
    height: processed.height,
    sizeBytes: processed.size,
    mimeType: 'image/webp',
  };
}

export async function deleteImage(filename: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch {
    // File might already be gone — not an error
  }
}

export async function getImageBuffer(filename: string): Promise<Buffer | null> {
  const filePath = path.join(UPLOAD_DIR, filename);
  // Prevent directory traversal
  const resolved = path.resolve(filePath);
  const uploadResolved = path.resolve(UPLOAD_DIR);
  if (!resolved.startsWith(uploadResolved + path.sep)) return null;

  try {
    return await fs.readFile(resolved);
  } catch {
    return null;
  }
}
