import {
  removeBracketedNoise,
  cleanTrackName,
  similarityScore,
  extractPrimaryArtist,
  hasArtistCollabPattern,
  NOISE_PATTERN,
} from "./normalize";
import { CONTEXT_PATTERN } from "./constants";

const CONTEXT_RE = new RegExp(`\\b(?:${CONTEXT_PATTERN})\\b`, "i");

export function parsePipeSeparatedTitle(
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
  const meaningful = segments.filter(
    (s) => !noiseRe.test(s) && !CONTEXT_RE.test(s),
  );
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
  const trackParts = meaningful.filter((_, i) => i !== bestArtistIdx);
  const trackRaw = trackParts[0] || "";

  const dashSep = /\s[-–—]\s/;
  if (dashSep.test(trackRaw)) {
    const nested = parseDashSeparatedTitle(trackRaw, channelName);
    if (nested) return nested;
  }

  return {
    artistName: extractPrimaryArtist(removeBracketedNoise(artistSeg)),
    trackName: cleanTrackName(removeBracketedNoise(trackRaw)),
  };
}

export function parseDashSeparatedTitle(
  title: string,
  channelName: string,
): { artistName: string; trackName: string } | null {
  const cleaned = removeBracketedNoise(title);
  const separators = [" - ", " – ", " — "];

  for (const sep of separators) {
    if (!cleaned.includes(sep)) continue;

    const parts = cleaned.split(sep);
    if (parts.length < 2) continue;

    const left = parts[0].trim();
    const right = parts.slice(1).join(sep).trim();
    if (!left || !right) continue;

    const leftChScore = similarityScore(left, channelName);
    const rightChScore = similarityScore(right, channelName);

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
