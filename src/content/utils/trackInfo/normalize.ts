import {
  TITLE_NOISE_WORDS,
  CONTEXT_PATTERN,
  CMP_NOISE_RE,
  CHANNEL_TO_ARTIST_NOISE_RE,
} from "./constants";

export { TITLE_NOISE_WORDS };

const COLLAB_KEYWORDS = ["feat", "ft", "cùng với"];
const COLLAB_PATTERN = COLLAB_KEYWORDS.join("|");
const COLLAB_SEGMENT_RE = new RegExp(
  String.raw`\s*[[(]?\s*(?:${COLLAB_PATTERN})\.?\s+[^\])\]]+[)\]]?`,
  "gi",
);
const COLLAB_TRAILING_RE = new RegExp(
  String.raw`\s+(?:${COLLAB_PATTERN})\.?\s+.*$`,
  "i",
);

export const NOISE_PATTERN = TITLE_NOISE_WORDS.join("|");
export const NOISE_RE_BRACKET_SQ = new RegExp(
  `\\[[^\\]]*(?:${NOISE_PATTERN})[^\\]]*\\]`,
  "gi",
);
export const NOISE_RE_BRACKET_RD = new RegExp(
  `\\([^)]*(?:${NOISE_PATTERN})[^)]*\\)`,
  "gi",
);
export const NOISE_RE_TRAILING_PIPE = new RegExp(
  `\\s*[|\uFF5C]\\s*(?:${NOISE_PATTERN})(?:\\s+(?:${NOISE_PATTERN}))*(?:\\s+\\d{4})?\\s*$`,
  "gi",
);

// Strips parenthesized language / locale suffixes that carry no lyrics info,
// e.g. (ENG/CHN), (KR/EN), (ENG SUB), (English Ver.), (Chinese Ver.)
// Must come AFTER bracket-noise removal so genuinely useful brackets are kept.
export const LANGUAGE_SUFFIX_RE =
  /\s*\([^)]{0,20}(?:\/[A-Z]{2,5}|\bENG\b|\bCHN\b|\bKOR\b|\bJPN\b|\bVIE\b|\b[A-Z]{2,5}\s+(?:SUB|VER|VERSION))\s*[^)]{0,20}\)/gi;

const TRAILING_PIPE_CONTEXT_RE = new RegExp(
  `\\s*[|｜]\\s*[^|｜]*\\b(?:${CONTEXT_PATTERN})\\b[^|｜]*$`,
  "gi",
);

const BRACKET_CONTEXT_SQ_RE = new RegExp(
  `\\s*\\[[^\\]]*\\b(?:${CONTEXT_PATTERN})\\b[^\\]]*\\]`,
  "gi",
);
const BRACKET_CONTEXT_RD_RE = new RegExp(
  `\\s*\\([^)]*\\b(?:${CONTEXT_PATTERN})\\b[^)]*\\)`,
  "gi",
);

export function removeLeadingTrackNumber(value: string): string {
  return value.replace(/^\s*\d{1,2}\s*[.)\]-]\s+/, "");
}

export function removeBracketedNoise(value: string): string {
  let result = removeLeadingTrackNumber(value);

  result = result
    .replace(NOISE_RE_BRACKET_SQ, "")
    .replace(NOISE_RE_BRACKET_RD, "")
    .replace(NOISE_RE_TRAILING_PIPE, "");

  // Remove trailing pipe-context (e.g. "| Gặp Lại Album", "| XYZ OST")
  result = result.replace(TRAILING_PIPE_CONTEXT_RE, "");

  // Strip parenthesized language suffixes: (ENG/CHN), (KR/EN), (ENG SUB) …
  result = result.replace(LANGUAGE_SUFFIX_RE, "");

  return result.replace(/\s+/g, " ").trim();
}

export function cleanTrackName(value: string): string {
  let result = removeLeadingTrackNumber(value);

  // Remove bracketed content containing album/ep/single/ost
  result = result.replace(BRACKET_CONTEXT_SQ_RE, "");
  result = result.replace(BRACKET_CONTEXT_RD_RE, "");

  // Remove (Prod. ...) or [Prod. ...]
  result = result.replace(/\s*\[\s*prod\.?[^\]]*\]/gi, "");
  result = result.replace(/\s*\(\s*prod\.?[^)]*\)/gi, "");

  // Remove (feat. X) or [ft. X]
  result = result.replace(/\s*\[\s*(?:feat|ft)\.?\s[^\]]*\]/gi, "");
  result = result.replace(/\s*\(\s*(?:feat|ft)\.?\s[^)]*\)/gi, "");

  // Remove localized collaboration markers like "(cùng với Jay Rock)"
  result = result.replace(COLLAB_SEGMENT_RE, "");

  // Remove trailing "feat./ft. ..."
  result = result.replace(/\s+(?:feat|ft)\.?\s.*/i, "");
  result = result.replace(COLLAB_TRAILING_RE, "");

  // Strip free-standing video-type noise that appears outside any bracket.
  // Loop to repeatedly strip trailing noise keywords and trailing separators.
  const trailingNoiseRegex =
    /\s*[-|]*\s*\b(?:official|mv|lyrics?|video|audio|music\s+video|m\/v|visualizer|hd|4k)\b\s*$/gi;

  let prevTrack: string;
  let currentTrack = result;
  do {
    prevTrack = currentTrack;
    currentTrack = currentTrack.replace(trailingNoiseRegex, "").trim();
  } while (currentTrack !== prevTrack);

  return currentTrack.replace(/\s+/g, " ").trim();
}

export function normalizeForCmp(name: string): string {
  return name
    .toLowerCase()
    .replace(CMP_NOISE_RE, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function similarityScore(a: string, b: string): number {
  const na = normalizeForCmp(a);
  const nb = normalizeForCmp(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  // Split into words and check overlap
  const wordsA = na.split(" ");
  const wordsB = new Set(nb.split(" "));
  const overlap = wordsA.filter((w) => wordsB.has(w)).length;
  const maxLen = Math.max(wordsA.length, wordsB.size);
  if (maxLen > 0 && overlap / maxLen >= 0.5) return 0.5;

  // Check if any single word from A appears as substring in B or vice versa
  const longerStr = na.length >= nb.length ? na : nb;
  const shorterStr = na.length < nb.length ? na : nb;
  if (shorterStr.length >= 3 && longerStr.includes(shorterStr)) return 0.8;

  // Check each word of shorter against longer as substring
  const shorterWords = shorterStr.split(" ");
  for (const word of shorterWords) {
    if (word.length >= 3 && longerStr.includes(word)) return 0.4;
  }

  return 0;
}

export function normalizeChannelToArtist(channel: string): string {
  return channel
    .replace(/\s*-\s*topic\s*$/i, "")
    .replace(CHANNEL_TO_ARTIST_NOISE_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPrimaryArtist(artist: string): string {
  const withoutFeat = artist
    .replace(/\s+(?:feat|ft)\.?\s.*/i, "")
    .replace(/\s*[[(]\s*(?:feat|ft)\.??\s[^\])]*[\])]/gi, "")
    .replace(COLLAB_SEGMENT_RE, "")
    .replace(COLLAB_TRAILING_RE, "");
  return withoutFeat.split(/\s+(?:x|&)\s+|,\s*/i)[0].trim();
}

export function hasArtistCollabPattern(segment: string): boolean {
  const parts = segment.split(/\s+(?:x|×|X)\s+/);
  if (parts.length >= 2) return true;
  if (/\b(?:feat|ft)\.?\s/i.test(segment)) return true;
  if (/\bcùng với\b/i.test(segment)) return true;
  return false;
}
