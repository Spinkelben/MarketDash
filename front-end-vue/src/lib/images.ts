/**
 * Image preloading.
 *
 * Once an image has been loaded here, an <img> with the same URL shows it
 * immediately, with no network request. The Image objects are kept in this
 * map so the browser has no reason to drop them from memory.
 */
const preloaded = new Map<string, { image: HTMLImageElement; ready: Promise<void> }>();

function preload(url: string): Promise<void> {
  let entry = preloaded.get(url);
  if (!entry) {
    const image = new Image();
    image.src = url;
    // decode() resolves once the image is downloaded and ready to paint. A
    // broken image must not hold up the rest, so failures are swallowed.
    entry = { image, ready: image.decode().catch(() => {}) };
    preloaded.set(url, entry);
  }
  return entry.ready;
}

/**
 * Resolves when every given image has loaded or failed. Empty and repeated
 * URLs are fine, and URLs preloaded earlier resolve immediately.
 */
export async function preloadImages(urls: Iterable<string>): Promise<void> {
  await Promise.all([...new Set(urls)].filter(Boolean).map(preload));
}
