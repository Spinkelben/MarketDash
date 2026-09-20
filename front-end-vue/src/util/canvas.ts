/**
 * Canvas rendering helpers shared by presentational components.
 *
 * Keeps the image cache and object-fit draw logic in one place so the
 * DishRandomizer and its child components do not duplicate it. Intentionally
 * imports no model types (e.g. Vendor/Product) to avoid circular imports —
 * the cache is keyed by image URL string only.
 */

import { ref } from 'vue';

/** Cache of successfully loaded images, keyed by URL. */
export const loadedImages = new Map<string, HTMLImageElement>();
export const imageCacheVersion = ref(0);

function markCacheDirty() {
  imageCacheVersion.value += 1;
}

/**
 * Preload all images referenced by a set of dish data. Resolves once every
 * image has finished loading (or errored). No-op for missing URLs.
 */
export async function preloadImages(
  dishData: Array<{ vendor: { imageUrl?: string }; dish: { ImageUrl?: string; imageUrl?: string } }>,
): Promise<void> {
  const promises = dishData.map((dishData) => {
    return new Promise<void>((resolve) => {
      let loadedCount = 0;
      const totalImages = 2;

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          resolve();
        }
      };

      const vendorImageUrl = dishData.vendor.imageUrl ?? '';
      if (vendorImageUrl && !loadedImages.has(vendorImageUrl)) {
        const vendorImg = new Image();
        vendorImg.crossOrigin = 'anonymous';
        vendorImg.onload = () => {
          loadedImages.set(vendorImageUrl, vendorImg);
          markCacheDirty();
          checkComplete();
        };
        vendorImg.onerror = () => checkComplete();
        vendorImg.src = vendorImageUrl;
      } else {
        checkComplete();
      }

      const dishImageUrl = dishData.dish.imageUrl ?? dishData.dish.ImageUrl ?? '';
      if (dishImageUrl && !loadedImages.has(dishImageUrl)) {
        const dishImg = new Image();
        dishImg.crossOrigin = 'anonymous';
        dishImg.onload = () => {
          loadedImages.set(dishImageUrl, dishImg);
          markCacheDirty();
          checkComplete();
        };
        dishImg.onerror = () => checkComplete();
        dishImg.src = dishImageUrl;
      } else {
        checkComplete();
      }
    });
  });

  await Promise.all(promises);
}

/**
 * Draw an image onto a canvas with object-fit: cover math, falling back to a
 * solid color with "No image" text when the image is missing/unavailable.
 */
export function drawToCanvas(
  canvas: HTMLCanvasElement,
  imageUrl: string,
  width: number,
  height: number,
  fallbackColor = '#ddd',
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  if (loadedImages.has(imageUrl)) {
    const img = loadedImages.get(imageUrl)!;
    // Draw image with object-fit: cover logic
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = -(drawWidth - width) / 2;
      offsetY = 0;
    } else {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = -(drawHeight - height) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#666';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🍽️', width / 2, height / 2 + 6);
  }
}
