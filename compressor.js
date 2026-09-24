/**
 * ImageShrink - Core Canvas & Compression Engine
 * Runs 100% locally in the browser using HTML5 Canvas and Blob APIs.
 */

export const TARGET_WIDTH = 1200;
export const TARGET_HEIGHT = 628;

// Safety minimum quality to avoid producing unusable, heavily pixelated results
export const MIN_QUALITY = 0.18;
export const MAX_QUALITY = 0.98;

/**
 * Format bytes into human-readable string (e.g. "438 KB", "2.84 MB")
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, idx)).toFixed(dm)) + ' ' + sizes[idx];
}

/**
 * Loads a File or Blob into an HTMLImageElement
 */
export function loadImage(fileOrBlob) {
  return new Promise((resolve, reject) => {
    if (!fileOrBlob || !fileOrBlob.type || !fileOrBlob.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        image: img,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("We couldn't process this image. Please try another file."));
    };

    img.src = objectUrl;
  });
}

/**
 * Renders the image onto a 1200 x 628 canvas with the chosen resize mode.
 * Always paints a clean white background first so transparent PNGs/WEBP convert properly to JPEG.
 *
 * @param {HTMLImageElement} img
 * @param {'crop' | 'fit' | 'stretch'} mode
 * @returns {HTMLCanvasElement}
 */
export function renderToCanvas(img, mode = 'crop') {
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Canvas 2D context is not supported.');
  }

  // Set high quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill canvas with white background (handles transparent PNGs and letterbox borders)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  if (mode === 'stretch') {
    // Force image to exactly 1200 x 628 without preserving aspect ratio
    ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  } else if (mode === 'fit') {
    // Preserve entire image, maintain aspect ratio, add letterbox/pillarbox
    const scale = Math.min(TARGET_WIDTH / imgW, TARGET_HEIGHT / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (TARGET_WIDTH - drawW) / 2;
    const offsetY = (TARGET_HEIGHT - drawH) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  } else {
    // Default: 'crop' - Fill complete 1200 x 628 canvas, preserve aspect ratio, centered crop
    const scale = Math.max(TARGET_WIDTH / imgW, TARGET_HEIGHT / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const offsetX = (TARGET_WIDTH - drawW) / 2;
    const offsetY = (TARGET_HEIGHT - drawH) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }

  return canvas;
}

/**
 * Wraps canvas.toBlob in a Promise for a specific JPEG quality
 */
function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode canvas to JPEG'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Iteratively compresses canvas to a target file size in bytes using binary search on JPEG quality.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} targetBytes Target file size in bytes
 * @returns {Promise<{ blob: Blob, quality: number, isClosestAchieved: boolean }>}
 */
export async function compressCanvasToJpeg(canvas, targetBytes) {
  // Test high quality first (0.95)
  const highBlob = await canvasToJpegBlob(canvas, 0.95);
  if (highBlob.size <= targetBytes) {
    // If 0.95 is already under target, try max quality 0.98
    const maxBlob = await canvasToJpegBlob(canvas, MAX_QUALITY);
    if (maxBlob.size <= targetBytes) {
      return {
        blob: maxBlob,
        quality: MAX_QUALITY,
        isClosestAchieved: false
      };
    }
    return {
      blob: highBlob,
      quality: 0.95,
      isClosestAchieved: false
    };
  }

  // Test minimum reasonable quality (MIN_QUALITY)
  const minBlob = await canvasToJpegBlob(canvas, MIN_QUALITY);
  if (minBlob.size > targetBytes) {
    // Even at min quality, file exceeds target.
    // Requirement: Do NOT make image unnecessarily blurry just to hit target; report closest achievable.
    return {
      blob: minBlob,
      quality: MIN_QUALITY,
      isClosestAchieved: true
    };
  }

  // Binary search to find optimal quality that produces size <= targetBytes
  let low = MIN_QUALITY;
  let high = 0.95;
  let bestBlob = minBlob;
  let bestQuality = MIN_QUALITY;

  // 7 iterations gives precision within ~0.006 (e.g. 0.82 vs 0.83)
  for (let iter = 0; iter < 7; iter++) {
    const mid = (low + high) / 2;
    const blob = await canvasToJpegBlob(canvas, mid);

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      bestQuality = mid;
      // Try higher quality to get closer to target without exceeding it
      low = mid;
    } else {
      // Exceeds target, need lower quality
      high = mid;
    }
  }

  return {
    blob: bestBlob,
    quality: Math.round(bestQuality * 100) / 100,
    isClosestAchieved: false
  };
}

/**
 * Generates the clean output filename ending in -optimized.jpg
 * e.g. "my-screenshot.png" -> "my-screenshot-optimized.jpg"
 */
export function getOptimizedFilename(originalFilename = 'image') {
  const lastDotIndex = originalFilename.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? originalFilename.substring(0, lastDotIndex) : originalFilename;
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'image';
  return `${cleanBase}-optimized.jpg`;
}