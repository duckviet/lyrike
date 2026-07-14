import { LyricLine, PreparedLyricLine, LyricWord } from "../shared/types";
import { layout, prepare } from "@chenglou/pretext";

export const DEFAULT_FONT_FAMILY =
  "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
export const LINE_HEIGHT_RATIO = 1.6;

export function getLineHeightPx(fontSize: number): number {
  return fontSize * LINE_HEIGHT_RATIO;
}

const prepareCache = new Map<string, unknown>();

/**
 * Prepares text for layout using pretext.
 * @param text Text to prepare.
 * @param font Font to use for preparation.
 */
export function safePrepare(text: string, font: string): unknown {
  const key = `${font}\u0000${text}`;
  if (prepareCache.has(key)) return prepareCache.get(key);
  try {
    const p = prepare(text, font);
    if (prepareCache.size > 1000) prepareCache.clear();
    prepareCache.set(key, p);
    return p;
  } catch {
    return null;
  }
}

/**
 * Measures the height of prepared text.
 * @param prepared Prepared text.
 * @param lineHeightPx Line height in pixels.
 * @param maxWidth Maximum width for layout.
 */
export function measureLineHeight(
  prepared: unknown,
  lineHeightPx: number,
  maxWidth: number,
): number {
  if (!prepared) return lineHeightPx;
  try {
    return Math.max(
      lineHeightPx,
      layout(prepared as Parameters<typeof layout>[0], maxWidth, lineHeightPx)
        .height,
    );
  } catch {
    return lineHeightPx;
  }
}
/**
 * Parses LRC format lyrics into timed lines.
 * @param lrcText Raw LRC formatted text.
 */
export function parseSyncedLyrics(
  lrcText: string = "",
  prioritizeKaraoke: boolean = true,
): LyricLine[] {
  return lrcText
    .split("\n")
    .flatMap((rawLine) => {
      const matches = [
        ...rawLine.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g),
      ];
      const rawText = rawLine.replace(/\[[^\]]+\]/g, "").trim();

      return matches.map((match) => {
        const minute = Number(match[1] || 0);
        const second = Number(match[2] || 0);
        const fractionRaw = match[3] || "0";
        const fraction =
          fractionRaw.length === 3
            ? Number(fractionRaw) / 1000
            : Number(fractionRaw) / 100;
        const time = minute * 60 + second + fraction;

        const hasKaraokeTags = /<\d{1,2}:\d{2}(?:\.\d{2,3})?>/.test(rawText);
        const isKaraoke = hasKaraokeTags && prioritizeKaraoke;
        let words: LyricWord[] = [];
        const text = hasKaraokeTags ? rawText.replace(/<[^>]+>/g, "") : rawText;

        if (isKaraoke) {
          const wordMatches = [...rawText.matchAll(/<(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?>([^<]*)/g)];
          words = wordMatches.map((m) => {
            const wMinute = Number(m[1] || 0);
            const wSecond = Number(m[2] || 0);
            const wFractionRaw = m[3] || "0";
            const wFraction =
              wFractionRaw.length === 3
                ? Number(wFractionRaw) / 1000
                : Number(wFractionRaw) / 100;
            const wordTime = wMinute * 60 + wSecond + wFraction;
            const wordText = m[4];
            return { time: wordTime, text: wordText };
          });
        }

        return {
          time,
          text,
          isKaraoke,
          ...(isKaraoke ? { words } : {}),
        };
      });
    })
    .sort((a, b) => a.time - b.time);
}

/**
 * Finds the index of the active lyric line for the given time.
 */
export function getActiveLineIndex(
  lines: LyricLine[] | PreparedLyricLine[],
  currentTime: number,
): number {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (currentTime >= lines[i].time) return i;
  }
  return -1;
}

/**
 * Returns a slice of lines centered around the active index.
 */
export function getVisibleLines<T extends LyricLine>(
  lines: T[],
  activeIndex: number,
  visibleCount: number,
): T[] {
  if (!lines.length) return [];
  if (activeIndex < 0) return lines.slice(0, visibleCount);

  const half = Math.floor(visibleCount / 2);
  const start = Math.max(0, activeIndex - half);
  const end = Math.min(lines.length, start + visibleCount);

  return lines.slice(start, end);
}
