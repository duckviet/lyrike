import { LyricsData, Settings } from "./content/shared/types";
import { normalizeChannelToArtist } from "./content/utils/trackInfo";

export const SYNCED_LYRICS_BONUS = 100;
export const EXACT_MATCH_BONUS = 10;
export const PARTIAL_MATCH_BONUS = 4;

export function lyricsOffsetKey(id: number): string {
  return `lyrics_offset:${id}`;
}

export function normalizeText(value: string = ""): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreResult(
  result: LyricsData,
  trackName: string,
  artistName: string,
  albumName?: string,
  prioritizeKaraoke: boolean = false,
): number {
  const syncedLyrics = result.syncedLyrics;
  const rt = normalizeText(result.trackName || "");
  const ra = normalizeText(result.artistName || "");
  const rb = normalizeText(result.albumName || "");
  const t = normalizeText(trackName || "");
  const a = normalizeText(artistName || "");
  const b = normalizeText(albumName || "");

  let score = 0;

  if (syncedLyrics) score += SYNCED_LYRICS_BONUS;
  if (t && rt === t) score += EXACT_MATCH_BONUS;
  if (a && ra === a) score += EXACT_MATCH_BONUS;
  if (b && rb === b) score += EXACT_MATCH_BONUS;
  if (t && (rt.includes(t) || t.includes(rt))) score += PARTIAL_MATCH_BONUS;
  if (a && (ra.includes(a) || a.includes(ra))) score += PARTIAL_MATCH_BONUS;
  if (b && (rb.includes(b) || b.includes(rb))) score += PARTIAL_MATCH_BONUS;

  if (prioritizeKaraoke && rt.includes("karaoke")) {
    score += 150;
  }

  return score;
}

export interface SearchCandidate {
  trackName: string;
  artistName: string;
  albumName?: string;
}

export async function fetchLyricsById(id: number): Promise<LyricsData | null> {
  const response = await fetch(`https://lrclib.net/api/get/${id}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`LRCLIB get-by-id error: ${response.status}`);
  }

  const result: LyricsData = await response.json();
  return result;
}

/**
 * Resolves a cached value from chrome storage. Handles migrations from legacy structures.
 */
export async function resolveCachedEntry(
  cacheKey: string,
  cachedValue: unknown,
): Promise<{ id: number; offsetMs: number } | null> {
  if (cachedValue === undefined) return null;

  // New format: cache only LRCLIB id (number) or string format "id#offset"
  if (typeof cachedValue === "number" || typeof cachedValue === "string") {
    let id: number;
    let offsetMs: number = 0;

    if (typeof cachedValue === "string") {
      const parts = cachedValue.split("#");
      id = parseInt(parts[0], 10);
      if (parts[1]) {
        offsetMs = parseInt(parts[1], 10) || 0;
      }
    } else {
      id = cachedValue;
    }

    if (!Number.isFinite(id)) return null;

    // Fallback: offset stored by id (stable even if cacheKey changes)
    if (!offsetMs) {
      const offsetResult = await chrome.storage.local.get(lyricsOffsetKey(id));
      const storedOffset = offsetResult[lyricsOffsetKey(id)];
      if (typeof storedOffset === "number" && Number.isFinite(storedOffset)) {
        offsetMs = storedOffset;
      }
    }

    return { id, offsetMs };
  }

  // Backward-compatible migration: old cache stored full lyrics payload.
  if (typeof cachedValue === "object" && cachedValue !== null) {
    const legacyId = (cachedValue as Record<string, unknown>).id;
    if (typeof legacyId === "number" && Number.isFinite(legacyId)) {
      await chrome.storage.local.set({ [cacheKey]: `${legacyId}#0` });
      await chrome.storage.local.set({ [lyricsOffsetKey(legacyId)]: 0 });
      return { id: legacyId, offsetMs: 0 };
    }
  }

  // Invalid cached structure, remove it
  await chrome.storage.local.remove(cacheKey);
  return null;
}

export async function searchOnce(
  { trackName, artistName, albumName }: SearchCandidate,
  prioritizeKaraoke: boolean = false,
): Promise<LyricsData | null> {
  if (!trackName) return null;

  const cacheKey = `lyrics:${normalizeText(artistName)}:${normalizeText(trackName)}:${normalizeText(albumName)}`;

  const cached = await chrome.storage.local.get(cacheKey);
  const cachedValue = cached[cacheKey];

  const resolved = await resolveCachedEntry(cacheKey, cachedValue);
  if (resolved) {
    const fromId = await fetchLyricsById(resolved.id);
    if (fromId) {
      return { ...fromId, offsetMs: resolved.offsetMs };
    }
    // If lyrics are not found (e.g. 404), clear stale cache and search API
    await chrome.storage.local.remove(cacheKey);
  }

  const url = new URL("https://lrclib.net/api/search");
  url.searchParams.set("track_name", trackName);

  if (artistName) {
    url.searchParams.set("artist_name", artistName);
  }

  if (albumName) {
    url.searchParams.set("album_name", albumName);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`LRCLIB error: ${response.status}`);
  }

  const results: LyricsData[] = await response.json();

  const best =
    results
      .slice()
      .sort(
        (a, b) =>
          scoreResult(b, trackName, artistName, albumName, prioritizeKaraoke) -
          scoreResult(a, trackName, artistName, albumName, prioritizeKaraoke),
      )[0] || null;

  if (typeof best?.id === "number") {
    // Initial save with 0 offset
    await chrome.storage.local.set({ [cacheKey]: `${best.id}#0` });
    await chrome.storage.local.set({ [lyricsOffsetKey(best.id)]: 0 });
  }

  return best;
}

export interface LyricsPayload {
  trackName: string;
  artistName: string;
  channelName: string;
  originalTitle: string;
  albumName?: string;
}

/**
 * Resolves lyrics by trying multiple search candidates in order of specificity.
 * 
 * Strategy:
 * 1. Specific match: Cleaned track + Inferred artist + Album.
 * 2. General match: Cleaned track + Inferred artist (no album).
 * 3. Channel fallback: Cleaned track + Normalized channel name.
 * 4. Raw channel fallback: Cleaned track + Raw channel name.
 * 5. Track-only search: Cleaned track name only (leveraging LRCLIB scoring).
 * 6. Last resort: Original full video title (catches titles with unconventional layouts).
 * 
 * Candidates are filtered and deduplicated using normalizeText before executing.
 */
export async function findLyrics(payload: LyricsPayload): Promise<LyricsData | null> {
  const { trackName, artistName, channelName, originalTitle, albumName } = payload;

  let prioritizeKaraoke = false;
  try {
    const settingsResult = await chrome.storage.local.get("lyrics_extension_settings");
    const storedSettings = settingsResult["lyrics_extension_settings"] as Settings | undefined;
    prioritizeKaraoke = storedSettings?.prioritizeKaraoke ?? false;
  } catch (e) {
    console.error("[Lyrics background] Failed to load settings:", e);
  }

  // Normalize channel name using imported module function
  const normalizedChannel = normalizeChannelToArtist(channelName);

  const baseCandidates: SearchCandidate[] = [
    { trackName, artistName, albumName },
    { trackName, artistName, albumName: "" },
    { trackName, artistName: normalizedChannel, albumName: "" },
    { trackName, artistName: channelName, albumName: "" },
    { trackName, artistName: "", albumName: "" },
    { trackName: originalTitle, artistName: "", albumName: "" },
  ];

  const candidates: SearchCandidate[] = [];
  if (prioritizeKaraoke && trackName && !trackName.toLowerCase().includes("karaoke")) {
    candidates.push({
      trackName: `${trackName} - Karaoke`,
      artistName,
      albumName,
    });
  }
  candidates.push(...baseCandidates);

  const filteredCandidates = candidates.filter((item, index, arr) => {
    if (!item.trackName) return false;
    return (
      arr.findIndex(
        (x) =>
          normalizeText(x.trackName) === normalizeText(item.trackName) &&
          normalizeText(x.artistName) === normalizeText(item.artistName) &&
          normalizeText(x.albumName) === normalizeText(item.albumName),
      ) === index
    );
  });
  console.log(payload)
  for (const candidate of filteredCandidates) {
    const result = await searchOnce(candidate, prioritizeKaraoke);
    console.log(candidate, result);
    if (result) return result;
  }

  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "FETCH_LYRICS") return;

  findLyrics(message.payload)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error.message || "Unknown error",
      }),
    );

  return true;
});
