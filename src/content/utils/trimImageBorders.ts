// YouTube thumbnails often letterbox/pillarbox a square album cover inside a
// 16:9 black frame. Trim those solid dark borders so the artwork can fill a
// circle/square without black edges.

const DARK_THRESHOLD = 28; // max(r, g, b) below this counts as "border"
const DARK_RATIO = 0.96; // share of dark pixels for a row/column to be border
const MAX_TRIM_RATIO = 0.45; // never trim more than this per side

const cache = new Map<string, Promise<string>>();

function isDarkLine(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  index: number,
  horizontal: boolean,
): boolean {
  const length = horizontal ? width : height;
  let dark = 0;
  for (let i = 0; i < length; i++) {
    const x = horizontal ? i : index;
    const y = horizontal ? index : i;
    const p = (y * width + x) * 4;
    if (Math.max(data[p], data[p + 1], data[p + 2]) < DARK_THRESHOLD) dark++;
  }
  return dark / length >= DARK_RATIO;
}

function trim(image: HTMLImageElement): string | null {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0);
  const { data } = ctx.getImageData(0, 0, width, height);

  const maxY = Math.floor(height * MAX_TRIM_RATIO);
  const maxX = Math.floor(width * MAX_TRIM_RATIO);
  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;
  while (top < maxY && isDarkLine(data, width, height, top, true)) top++;
  while (
    bottom < maxY &&
    isDarkLine(data, width, height, height - 1 - bottom, true)
  )
    bottom++;
  while (left < maxX && isDarkLine(data, width, height, left, false)) left++;
  while (
    right < maxX &&
    isDarkLine(data, width, height, width - 1 - right, false)
  )
    right++;

  if (top + bottom + left + right === 0) return null;

  const w = width - left - right;
  const h = height - top - bottom;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(canvas, left, top, w, h, 0, 0, w, h);
  return out.toDataURL("image/jpeg", 0.92);
}

/** Resolves to a data URL without dark borders, or the original src. */
export function trimImageBorders(src: string): Promise<string> {
  const cached = cache.get(src);
  if (cached) return cached;

  const promise = new Promise<string>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => {
      try {
        resolve(trim(image) ?? src);
      } catch {
        // Tainted canvas (no CORS) — fall back to the original image.
        resolve(src);
      }
    };
    image.onerror = () => resolve(src);
    image.src = src;
  });
  cache.set(src, promise);
  return promise;
}
