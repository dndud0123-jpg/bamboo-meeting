// Utility to remove white background from sprite sheet via Canvas ImageData Chroma-key & Flood Fill

let cachedTransparentCanvas = null;
let cachedTransparentDataUrl = null;

/**
 * Strips white/near-white background from an Image or Canvas using BFS flood-fill and chroma-key.
 * Preserves inner whites (such as eyes or white animals) protected by dark outlines.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} imageSource
 * @returns {HTMLCanvasElement} Offscreen canvas with transparency applied
 */
export function makeSpriteTransparent(imageSource) {
  if (cachedTransparentCanvas && cachedTransparentCanvas.width === imageSource.width) {
    return cachedTransparentCanvas;
  }

  const width = imageSource.naturalWidth || imageSource.width || 372;
  const height = imageSource.naturalHeight || imageSource.height || 385;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  try {
    // Draw original image
    ctx.drawImage(imageSource, 0, 0);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    function isBgColor(idx) {
      return data[idx] > 230 && data[idx + 1] > 230 && data[idx + 2] > 230;
    }

    // Flood-fill BFS to remove only external white background without destroying inner whites
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    function pushPixel(x, y) {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const pos = y * width + x;
      if (visited[pos]) return;
      const idx = pos * 4;
      if (isBgColor(idx)) {
        visited[pos] = 1;
        queue[tail++] = pos;
      }
    }

    // 1. Seed from all 4 outer image borders
    for (let x = 0; x < width; x++) {
      pushPixel(x, 0);
      pushPixel(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      pushPixel(0, y);
      pushPixel(width - 1, y);
    }

    // 2. Also seed from the 4x4 grid cell intersections
    const colStep = width / 4;
    const rowStep = height / 4;
    for (let c = 1; c < 4; c++) {
      const gx = Math.round(c * colStep);
      for (let y = 0; y < height; y++) {
        pushPixel(gx, y);
        pushPixel(gx - 1, y);
      }
    }
    for (let r = 1; r < 4; r++) {
      const gy = Math.round(r * rowStep);
      for (let x = 0; x < width; x++) {
        pushPixel(x, gy);
        pushPixel(x, gy - 1);
      }
    }

    // 3. Run BFS
    while (head < tail) {
      const pos = queue[head++];
      const px = pos % width;
      const py = Math.floor(pos / width);

      const idx = pos * 4;
      data[idx + 3] = 0; // alpha = 0

      if (px > 0) pushPixel(px - 1, py);
      if (px < width - 1) pushPixel(px + 1, py);
      if (py > 0) pushPixel(px, py - 1);
      if (py < height - 1) pushPixel(px, py + 1);
    }

    ctx.putImageData(imgData, 0, 0);

    cachedTransparentCanvas = canvas;
    try {
      cachedTransparentDataUrl = canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Could not export transparent canvas to dataURL:', e);
    }

    return canvas;
  } catch (err) {
    console.warn('makeSpriteTransparent failed, returning raw canvas:', err);
    return canvas;
  }
}

/**
 * Promise-based image loader & chroma-key processor with full mobile decode support and fallback.
 * Guarantees that either a transparent canvas or the raw image is returned once decoded.
 *
 * @param {string} src Image URL / path
 * @returns {Promise<HTMLCanvasElement|HTMLImageElement|null>}
 */
export function loadProcessedSprite(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    const process = async () => {
      // Ensure image bitmap is decoded before canvas operations
      if (img.decode) {
        try {
          await img.decode();
        } catch (e) {
          console.warn('img.decode failed or not needed, proceeding:', e);
        }
      }

      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        resolve(img);
        return;
      }

      try {
        const transparentCanvas = makeSpriteTransparent(img);
        if (transparentCanvas && transparentCanvas.width > 0 && transparentCanvas.height > 0) {
          resolve(transparentCanvas);
        } else {
          resolve(img);
        }
      } catch (err) {
        console.warn('Error during sprite processing, falling back to raw image:', err);
        resolve(img);
      }
    };

    if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
      process();
    } else {
      img.onload = process;
      img.onerror = (err) => {
        console.warn('Failed to load sprite image from source:', src, err);
        resolve(null);
      };
    }
  });
}

/**
 * Returns cached transparent sprite data URL if generated
 */
export function getTransparentSpriteUrl() {
  return cachedTransparentDataUrl;
}
