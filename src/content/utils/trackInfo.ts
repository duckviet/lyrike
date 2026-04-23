export function pickText(selectors: string[]): string {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return "";
}
const NOISE_WORDS = [
  "official(?:\\s+\\w+)?",
  "lyrics?",
  "lyric\\s+video",
  "video\\s+lyric",
  "audio\\s+lyric",
  "official\\s+audio(?:\\s+lyric)?",
  "official\\s+mv(?:\\s+\\w+)?",
  "official\\s+music\\s+video",
  "m\\/v",
  "mv",
  "music\\s+video",
  "audio",
  "visualizer",
  "hd",
  "4k",
  "performance\\s+video",
  "\\d+(?:st|nd|rd|th)\\s+single",
  "directed\\s+by\\s+[^)\\]|]+",
  "video\\s+version",
  "short\\s+version",
  "full\\s+version",
];

const NOISE_PATTERN = NOISE_WORDS.join("|");
const NOISE_RE_BRACKET_SQ = new RegExp(
  `\\[[^\\]]*(?:${NOISE_PATTERN})[^\\]]*\\]`,
  "gi",
);
const NOISE_RE_BRACKET_RD = new RegExp(
  `\\([^)]*(?:${NOISE_PATTERN})[^)]*\\)`,
  "gi",
);
const NOISE_RE_TRAILING_PIPE = new RegExp(
  `\\s*[|｜]\\s*(?:${NOISE_PATTERN})(?:\\s+(?:${NOISE_PATTERN}))*(?:\\s+\\d{4})?\\s*$`,
  "gi",
);

function removeBracketedNoise(value: string): string {
  return value
    .replace(NOISE_RE_BRACKET_SQ, "")
    .replace(NOISE_RE_BRACKET_RD, "")
    .replace(NOISE_RE_TRAILING_PIPE, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTrackName(value: string): string {
  let result = value;

  // Remove bracketed content containing album/ep/single/ost
  result = result.replace(
    /\s*\[[^\]]*\b(?:album|ep|single|ost)\b[^\]]*\]/gi,
    "",
  );
  result = result.replace(/\s*\([^)]*\b(?:album|ep|single|ost)\b[^)]*\)/gi, "");

  // Remove (Prod. ...) or [Prod. ...]
  result = result.replace(/\s*\[\s*prod\.?[^\]]*\]/gi, "");
  result = result.replace(/\s*\(\s*prod\.?[^)]*\)/gi, "");

  // Remove (feat. X) or [ft. X]
  result = result.replace(/\s*\[\s*(?:feat|ft)\.?\s[^\]]*\]/gi, "");
  result = result.replace(/\s*\(\s*(?:feat|ft)\.?\s[^)]*\)/gi, "");

  // Remove trailing "feat./ft. ..."
  result = result.replace(/\s+(?:feat|ft)\.?\s.*/i, "");

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Normalizes a name for comparison by removing common noise words.
 */
export function normalizeForCmp(name: string): string {
  return name
    .toLowerCase()
    .replace(
      /\b(official|vevo|music|channel|tv|hd|topic|records?|entertainment|production)\b/g,
      "",
    )
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes fuzzy similarity score between two strings.
 * Handles cases like "JustaTee" vs "JustaTeeMusic", "OnlyC" vs "OnlyC Production".
 */
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
  // Catches "justatee" in "justateemusic", "onlyc" in "onlyc production"
  const longerStr = na.length >= nb.length ? na : nb;
  const shorterStr = na.length < nb.length ? na : nb;
  // Only for shorter strings (likely a name), avoid false positives
  if (shorterStr.length >= 3 && longerStr.includes(shorterStr)) return 0.7;

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
    .replace(
      /\b(official|vevo|music|channel|tv|topic|records?|entertainment|production)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPrimaryArtist(artist: string): string {
  const withoutFeat = artist
    .replace(/\s+(?:feat|ft)\.?\s.*/i, "")
    .replace(/\s*[[(]\s*(?:feat|ft)\.?\s[^\])]*[\])]/gi, "");
  return withoutFeat.split(/\s+(?:x|&)\s+|,\s*/i)[0].trim();
}

/**
 * Checks if a segment contains collaboration patterns (x, ×, X, feat, ft).
 */
function hasArtistCollabPattern(segment: string): boolean {
  // "A x B x C", "D X E"
  const parts = segment.split(/\s+(?:x|×|X)\s+/);
  if (parts.length >= 2) return true;
  if (/\b(?:feat|ft)\.?\s/i.test(segment)) return true;
  return false;
}

/**
 * Parses pipe-separated title (e.g., "SONG | Artist1 x Artist2 | CONTEXT").
 */
function parsePipeSeparatedTitle(
  title: string,
  channelName: string,
): { artistName: string; trackName: string } | null {
  const cleaned = removeBracketedNoise(title);
  if (!/[|｜]/.test(cleaned)) return null;

  const segments = cleaned
    .split(/\s*[|｜]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const noiseRe = new RegExp(`^(?:${NOISE_PATTERN})(?:\\s+\\d{4})?$`, "i");
  const meaningful = segments.filter((s) => !noiseRe.test(s));
  if (meaningful.length < 2) return null;

  // Score each segment
  const scored = meaningful.map((seg, i) => ({
    seg,
    index: i,
    chScore: similarityScore(seg, channelName),
    hasCollab: hasArtistCollabPattern(seg),
    hasFeat: /\b(?:feat|ft)\.?\s/i.test(seg),
  }));

  // Find best artist segment: channel similarity + collab/feat pattern
  let bestArtistIdx = -1;
  let bestScore = -1;

  for (const s of scored) {
    let score = s.chScore;
    if (s.hasCollab) score += 0.3;
    if (s.hasFeat) score += 0.2;
    if (score > bestScore) {
      bestScore = score;
      bestArtistIdx = s.index;
    }
  }

  // If no segment matched channel at all, use collab pattern as tiebreaker
  if (bestScore < 0.3) {
    const collabIdx = scored.findIndex((s) => s.hasCollab);
    if (collabIdx >= 0) bestArtistIdx = collabIdx;
    else return null;
  }

  const artistSeg = meaningful[bestArtistIdx];
  // Track = first segment that is NOT the artist segment
  // (usually the first one in "SONG | ARTIST | ..." format)
  const trackParts = meaningful.filter((_, i) => i !== bestArtistIdx);
  // Take only the first part as track name, rest is often context/subtitle
  const trackRaw = trackParts[0] || "";

  return {
    artistName: extractPrimaryArtist(removeBracketedNoise(artistSeg)),
    trackName: cleanTrackName(removeBracketedNoise(trackRaw)),
  };
}

/**
 * Parses dash-separated title (e.g., "Artist - Song Name").
 */
function parseDashSeparatedTitle(
  title: string,
  channelName: string,
): { artistName: string; trackName: string } | null {
  const cleaned = removeBracketedNoise(title);
  const separators = [" - ", " – ", " — "];

  for (const sep of separators) {
    if (!cleaned.includes(sep)) continue;

    const parts = cleaned.split(sep);
    if (parts.length < 2) continue;

    // For multi-dash like "1ST SINGLE - EM CHƯA 18 OST", we want the
    // first dash split. But for "She Neva Knows (CM1X REMIX) - JustaTee"
    // we just split at first dash.
    const left = parts[0].trim();
    const right = parts.slice(1).join(sep).trim();
    if (!left || !right) continue;

    const leftChScore = similarityScore(left, channelName);
    const rightChScore = similarityScore(right, channelName);

    // Collab/feat heuristic: side with feat/ft/x is artist
    const leftHasCollab =
      hasArtistCollabPattern(left) || /\b(?:feat|ft)\.?\s/i.test(left);
    const rightHasCollab =
      hasArtistCollabPattern(right) || /\b(?:feat|ft)\.?\s/i.test(right);

    let leftScore = leftChScore;
    let rightScore = rightChScore;

    if (rightHasCollab && !leftHasCollab) rightScore += 0.3;
    if (leftHasCollab && !rightHasCollab) leftScore += 0.3;

    const isReversed = rightScore > leftScore;
    const rawArtist = isReversed ? right : left;
    const rawTrack = isReversed ? left : right;

    return {
      artistName: extractPrimaryArtist(removeBracketedNoise(rawArtist)),
      trackName: cleanTrackName(removeBracketedNoise(rawTrack)),
    };
  }

  return null;
}

/**
 * Extracts artist/track metadata from video description.
 */
function parseDescriptionMeta(
  description: string,
  channelName: string,
  titleResult: { artistName: string; trackName: string } | null,
): { artistName?: string; trackName?: string } {
  if (!description) return {};
  const result: { artistName?: string; trackName?: string } = {};

  // Explicit labels — require colon directly after keyword
  const artistMatch = description.match(
    /^(?:artist|ca sĩ|thể hiện|performer)\s*:\s*(.+)$/im,
  );
  if (artistMatch) result.artistName = artistMatch[1].trim();

  const trackMatch = description.match(
    /^(?:song|track|bài hát|tên bài|title)\s*:\s*(.+)$/im,
  );
  if (trackMatch) result.trackName = trackMatch[1].trim();

  if (result.artistName && result.trackName) return result;

  // "Written & performed by X, Y" — take first
  if (!result.artistName) {
    const perfMatch = description.match(
      /(?:written\s*&?\s*)?performed\s+by\s+([^,\n]+)/im,
    );
    if (perfMatch) result.artistName = perfMatch[1].trim();
  }

  // First line fallback: only if title parsing yielded nothing useful
  if (!titleResult && (!result.artistName || !result.trackName)) {
    const firstLine = description.split("\n")[0]?.trim();
    if (firstLine) {
      const parsed =
        parsePipeSeparatedTitle(firstLine, channelName) ||
        parseDashSeparatedTitle(firstLine, channelName);
      if (parsed) {
        if (!result.artistName) result.artistName = parsed.artistName;
        if (!result.trackName) result.trackName = parsed.trackName;
      }
    }
  }

  return result;
}

export function inferSongInfo(
  title: string,
  channelName: string,
  description: string = "",
): { artistName: string; trackName: string } {
  // 1. YouTube Music auto-generated "Artist - Topic" channels
  if (/\s*-\s*topic\s*$/i.test(channelName)) {
    return {
      artistName: normalizeChannelToArtist(channelName),
      trackName: cleanTrackName(removeBracketedNoise(title)),
    };
  }

  // 2. Title parsing — try pipe first, then dash
  const pipeResult = parsePipeSeparatedTitle(title, channelName);
  const dashResult = parseDashSeparatedTitle(title, channelName);
  const titleResult = pipeResult || dashResult;

  // 3. Description metadata — pass titleResult so it knows whether to
  //    attempt first-line fallback
  const descMeta = parseDescriptionMeta(description, channelName, titleResult);

  // 4. Merge: description structured fields > title parse > channel fallback
  const artistName = extractPrimaryArtist(
    descMeta.artistName ||
      titleResult?.artistName ||
      normalizeChannelToArtist(channelName),
  );

  const trackName =
    descMeta.trackName ||
    titleResult?.trackName ||
    cleanTrackName(removeBracketedNoise(title));

  return { artistName, trackName };
}

export function getVideoIdFromURL(): string | null {
  if (!location.pathname.startsWith("/watch")) return null;
  return new URLSearchParams(location.search).get("v");
}
