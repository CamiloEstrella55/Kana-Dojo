import type JSZip from 'jszip';

/**
 * Safely read uncompressed size from JSZip internal metadata.
 *
 * JSZip does not expose uncompressed size in the public JSZipObject API.
 * We read the optional internal value defensively and fall back to compressed
 * size when unavailable.
 */
export function getUncompressedSize(
  file: JSZip.JSZipObject,
  fallbackSize: number,
): number {
  const rawData = Reflect.get(file, '_data');
  if (typeof rawData === 'object' && rawData !== null) {
    const size = Reflect.get(rawData, 'uncompressedSize');
    if (typeof size === 'number' && Number.isFinite(size) && size >= 0) {
      return size;
    }
  }

  return fallbackSize;
}
