import { LyricsData, Settings } from "./content/shared/types";
import { normalizeChannelToArtist } from "./content/utils/trackInfo";

export const SYNCED_LYRICS_BONUS = 100;
export const EXACT_MATCH_BONUS = 10;
export const PARTIAL_MATCH_BONUS = 4;

export interface RemoteBlacklistConfig {
  blacklistedLyricsIds?: number[];
  videoOverrides?: Record<string, number>;
}

const BLACKLIST_URL = "https://raw.githubusercontent.com/duckviet/lyrike/main/blacklist.json";
const BLACKLIST_CACHE_KEY = "lyrics_blacklist_config";
const BLACKLIST_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface CachedBlacklist {
  config: RemoteBlacklistConfig;
  fetchedAt: number;
}

let blacklistMock: RemoteBlacklistConfig | null = null;

export function setBlacklistMock(mock: RemoteBlacklistConfig | null) {
  blacklistMock = mock;
}

export async function getOrFetchBlacklist(): Promise<RemoteBlacklistConfig> {
  if (blacklistMock) return blacklistMock;
  try {
    const cached = await chrome.storage.local.get(BLACKLIST_CACHE_KEY);
    const entry = cached[BLACKLIST_CACHE_KEY] as CachedBlacklist | undefined;

    if (entry && Date.now() - entry.fetchedAt < BLACKLIST_TTL_MS) {
      return entry.config;
    }

    // Fetch fresh blacklist
    const response = await fetch(BLACKLIST_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch blacklist: ${response.status}`);
    }
    const config: RemoteBlacklistConfig = await response.json();

    // Save to storage
    await chrome.storage.local.set({
      [BLACKLIST_CACHE_KEY]: {
        config,
        fetchedAt: Date.now(),
      },
    });

    return config;
  } catch (e) {
    console.warn(
      "[Lyrics] Failed to fetch or load blacklist, falling back to empty/cached:",
      e,
    );
    // Fallback: if we have cached, return it even if expired, otherwise return empty
    const cached = await chrome.storage.local.get(BLACKLIST_CACHE_KEY);
    const entry = cached[BLACKLIST_CACHE_KEY] as CachedBlacklist | undefined;
    return entry?.config ?? {};
  }
}

/**
 * Storage key for a lyrics time-offset adjustment.
 * Prefer the video-specific key when videoId is known — same LRCLIB track
 * may need different offsets across different YouTube uploads.
 */
export function lyricsOffsetKey(id: number, videoId?: string): string {
  return videoId ? `lyrics_offset:${videoId}:${id}` : `lyrics_offset:${id}`;
}

/**
 * Returns the stored offset (ms) for a given lrclib id, checking the
 * video-specific key first and falling back to the global per-id key.
 */
async function getLyricsOffset(id: number, videoId?: string): Promise<number> {
  if (videoId) {
    const videoKey = lyricsOffsetKey(id, videoId);
    const result = await chrome.storage.local.get(videoKey);
    const offset = result[videoKey];
    if (typeof offset === "number" && Number.isFinite(offset)) return offset;
  }
  // Backward-compatible fallback: global per-id offset
  const legacyKey = lyricsOffsetKey(id);
  const result = await chrome.storage.local.get(legacyKey);
  const offset = result[legacyKey];
  return typeof offset === "number" && Number.isFinite(offset) ? offset : 0;
}

/**
 * Initializes the global lyrics offset to 0 only if it does not exist already
 * or contains an invalid value.
 */
export async function initializeLyricsOffset(id: number): Promise<void> {
  const key = lyricsOffsetKey(id);
  const stored = await chrome.storage.local.get(key);
  if (typeof stored[key] !== "number" || !Number.isFinite(stored[key])) {
    await chrome.storage.local.set({ [key]: 0 });
  }
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

// ─────────────────────────────────────────────────────────────────────────────
// Full-payload LRU cache
//
// Rationale: the search-key cache (lyrics:<artist>:<track>:<album>) only stores
// a lrclib id. Fetching the full payload on every cache hit wastes bandwidth.
// This layer caches the complete LyricsData object keyed by lrclib id.
//
// Storage schema:
//   lyrics_payload:<id>   → CachedLyricsEntry (JSON)     full payload
//   lyrics_cache_index    → CacheIndexEntry[]  (JSON)     LRU bookkeeping
//
// Max 3000 tracks are kept; LRU eviction removes the least-recently-accessed.
// ─────────────────────────────────────────────────────────────────────────────

export interface CachedLyricsEntry {
  id: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  instrumental?: boolean;
  duration?: number;
  cachedAt: number; // Unix ms — when first stored
}

export interface CacheIndexEntry {
  id: number;
  sizeBytes: number; // estimated via JSON.stringify
  lastAccessedAt: number; // Unix ms
}

const LYRICS_PAYLOAD_PREFIX = "lyrics_payload:";
const CACHE_INDEX_KEY = "lyrics_cache_index";
const MAX_CACHED_TRACKS = 3000;

async function getCacheIndex(): Promise<CacheIndexEntry[]> {
  const result = await chrome.storage.local.get(CACHE_INDEX_KEY);
  return (result[CACHE_INDEX_KEY] as CacheIndexEntry[]) ?? [];
}

async function setCacheIndex(index: CacheIndexEntry[]): Promise<void> {
  await chrome.storage.local.set({ [CACHE_INDEX_KEY]: index });
}

/**
 * Evicts the oldest entries (by lastAccessedAt) when the index exceeds
 * MAX_CACHED_TRACKS. Only removes lyrics_payload: keys — never touches
 * the search-key index (lyrics:...) or offset/karaoke keys.
 */
async function pruneCacheIfNeeded(
  currentIndex: CacheIndexEntry[],
): Promise<void> {
  if (currentIndex.length <= MAX_CACHED_TRACKS) return;

  const sorted = [...currentIndex].sort(
    (a, b) => a.lastAccessedAt - b.lastAccessedAt,
  );
  const evictCount = currentIndex.length - MAX_CACHED_TRACKS;
  const toEvict = sorted.slice(0, evictCount);

  await chrome.storage.local.remove(
    toEvict.map((e) => `${LYRICS_PAYLOAD_PREFIX}${e.id}`),
  );

  const evictedIds = new Set(toEvict.map((e) => e.id));
  await setCacheIndex(currentIndex.filter((e) => !evictedIds.has(e.id)));

  console.log(
    `[Lyrics cache] Evicted ${evictCount} entries, ${currentIndex.length - evictCount} remaining`,
  );
}

/**
 * Updates lastAccessedAt for an existing index entry (best-effort, not awaited
 * in the hot path so it never blocks the response to the UI).
 */
async function touchCacheEntry(id: number): Promise<void> {
  const index = await getCacheIndex();
  const entry = index.find((e) => e.id === id);
  if (entry) {
    entry.lastAccessedAt = Date.now();
    await setCacheIndex(index);
  }
}

/**
 * Reads a cached full payload by lrclib id.
 * Fires a background LRU-touch (non-blocking) so hot tracks stay alive.
 */
async function getCachedPayload(
  id: number,
): Promise<CachedLyricsEntry | null> {
  const key = `${LYRICS_PAYLOAD_PREFIX}${id}`;
  const result = await chrome.storage.local.get(key);
  const entry = result[key] as CachedLyricsEntry | undefined;
  if (!entry) return null;

  // Best-effort LRU update — not awaited so it never slows the caller.
  touchCacheEntry(id).catch((e) =>
    console.warn("[Lyrics cache] touch failed:", e),
  );

  return entry;
}

/**
 * Persists a full LyricsData payload, updates the LRU index, and evicts
 * stale entries if the cap is exceeded.
 * Errors are caught and logged — a cache write failure must never break
 * the lyrics fetch flow.
 */
async function setCachedPayload(
  id: number,
  data: LyricsData,
): Promise<void> {
  try {
    const entry: CachedLyricsEntry = {
      id,
      trackName: data.trackName,
      artistName: data.artistName,
      albumName: data.albumName,
      plainLyrics: data.plainLyrics ?? null,
      syncedLyrics: data.syncedLyrics ?? null,
      instrumental: data.instrumental,
      duration: data.duration,
      cachedAt: Date.now(),
    };

    const key = `${LYRICS_PAYLOAD_PREFIX}${id}`;
    const sizeBytes = new Blob([JSON.stringify(entry)]).size;

    await chrome.storage.local.set({ [key]: entry });

    const index = await getCacheIndex();
    const existingIdx = index.findIndex((e) => e.id === id);
    const newEntry: CacheIndexEntry = {
      id,
      sizeBytes,
      lastAccessedAt: Date.now(),
    };

    if (existingIdx >= 0) {
      index[existingIdx] = newEntry;
    } else {
      index.push(newEntry);
    }

    await setCacheIndex(index);
    await pruneCacheIfNeeded(index);
  } catch (e) {
    console.warn("[Lyrics cache] setCachedPayload failed:", e);
  }
}

/**
 * Cache-aside wrapper around fetchLyricsById.
 * Returns the payload from local storage when available, otherwise fetches
 * from lrclib and persists the result for future calls.
 */
async function fetchLyricsByIdWithCache(
  id: number,
): Promise<LyricsData | null> {
  const cached = await getCachedPayload(id);
  if (cached) {
    // Reconstruct as LyricsData (CachedLyricsEntry is a strict subset)
    return {
      id: cached.id,
      trackName: cached.trackName,
      artistName: cached.artistName,
      albumName: cached.albumName,
      plainLyrics: cached.plainLyrics,
      syncedLyrics: cached.syncedLyrics,
      instrumental: cached.instrumental,
      duration: cached.duration,
    };
  }

  const fresh = await fetchLyricsById(id);
  if (fresh && typeof fresh.id === "number") {
    void setCachedPayload(fresh.id, fresh);
  }
  return fresh;
}

/**
 * Resolves a cached value from chrome storage. Handles migrations from legacy structures.
 * Pass videoId to resolve the video-specific offset when available.
 */
export async function resolveCachedEntry(
  cacheKey: string,
  cachedValue: unknown,
  videoId?: string,
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

    // Check remote blacklist
    const blacklist = await getOrFetchBlacklist();
    if (blacklist.blacklistedLyricsIds?.includes(id)) {
      console.log(`[Lyrics] Cache hit for blacklisted ID ${id}, clearing cache.`);
      await chrome.storage.local.remove(cacheKey);
      await chrome.storage.local.remove(`${LYRICS_PAYLOAD_PREFIX}${id}`);
      return null;
    }

    // Prefer stored offset (video-specific → global fallback)
    if (!offsetMs) {
      offsetMs = await getLyricsOffset(id, videoId);
    }

    return { id, offsetMs };
  }

  // Backward-compatible migration: old cache stored full lyrics payload.
  if (typeof cachedValue === "object" && cachedValue !== null) {
    const legacy = cachedValue as Record<string, unknown>;
    const legacyId = legacy.id;

    if (typeof legacyId === "number" && Number.isFinite(legacyId)) {
      // Check remote blacklist for legacy cache
      const blacklist = await getOrFetchBlacklist();
      if (blacklist.blacklistedLyricsIds?.includes(legacyId)) {
        console.log(`[Lyrics] Legacy cache hit for blacklisted ID ${legacyId}, clearing cache.`);
        await chrome.storage.local.remove(cacheKey);
        await chrome.storage.local.remove(`${LYRICS_PAYLOAD_PREFIX}${legacyId}`);
        return null;
      }

      const legacyOffset =
        typeof legacy.offsetMs === "number" && Number.isFinite(legacy.offsetMs)
          ? legacy.offsetMs
          : await getLyricsOffset(legacyId, videoId);

      await chrome.storage.local.set({
        [cacheKey]: `${legacyId}#${legacyOffset}`,
      });

      const globalOffsetKey = lyricsOffsetKey(legacyId);
      const existing = await chrome.storage.local.get(globalOffsetKey);

      if (typeof existing[globalOffsetKey] !== "number" || !Number.isFinite(existing[globalOffsetKey])) {
        await chrome.storage.local.set({
          [globalOffsetKey]: legacyOffset,
        });
      }

      const legacyLyrics = cachedValue as unknown as LyricsData;
      void setCachedPayload(legacyId, legacyLyrics);

      return {
        id: legacyId,
        offsetMs: legacyOffset,
      };
    }
  }

  // Invalid cached structure, remove it
  await chrome.storage.local.remove(cacheKey);
  return null;
}

/** Canonical cache key for a given search candidate. */
export function lyricsCacheKey({
  trackName,
  artistName,
  albumName,
}: SearchCandidate): string {
  return `lyrics:${normalizeText(artistName)}:${normalizeText(trackName)}:${normalizeText(albumName)}`;
}

/**
 * Reads the local cache for a candidate without calling the search API.
 * Pass videoId to resolve the video-specific offset when available.
 * Returns null when there is no valid cache entry.
 */
async function getCachedLyrics(
  candidate: SearchCandidate,
  videoId?: string,
): Promise<LyricsData | null> {
  if (!candidate.trackName) return null;

  const cacheKey = lyricsCacheKey(candidate);
  const cached = await chrome.storage.local.get(cacheKey);
  const resolved = await resolveCachedEntry(cacheKey, cached[cacheKey], videoId);

  if (!resolved) return null;

  const lyrics = await fetchLyricsByIdWithCache(resolved.id);
  if (!lyrics) {
    await chrome.storage.local.remove(cacheKey);
    return null;
  }

  return { ...lyrics, offsetMs: resolved.offsetMs };
}

export async function searchOnce(
  candidate: SearchCandidate,
  prioritizeKaraoke: boolean = false,
): Promise<LyricsData | null> {
  const { trackName, artistName, albumName } = candidate;
  if (!trackName) return null;

  const cacheKey = lyricsCacheKey(candidate);

  const cached = await chrome.storage.local.get(cacheKey);
  const cachedValue = cached[cacheKey];

  const resolved = await resolveCachedEntry(cacheKey, cachedValue);
  if (resolved) {
    const fromId = await fetchLyricsByIdWithCache(resolved.id);
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

  // Filter out blacklisted IDs from remote config
  const blacklist = await getOrFetchBlacklist();
  const blacklistedIds = blacklist.blacklistedLyricsIds ?? [];
  const filteredResults = results.filter((r) => typeof r.id === "number" && !blacklistedIds.includes(r.id));

  const best =
    filteredResults
      .slice()
      .sort(
        (a, b) =>
          scoreResult(b, trackName, artistName, albumName, prioritizeKaraoke) -
          scoreResult(a, trackName, artistName, albumName, prioritizeKaraoke),
      )[0] || null;

  if (typeof best?.id === "number") {
    // Save search-key → id mapping (offset starts at 0)
    await chrome.storage.local.set({ [cacheKey]: `${best.id}#0` });
    await initializeLyricsOffset(best.id);
    // Persist full payload into the LRU payload cache
    void setCachedPayload(best.id, best);
  }

  return best;
}

export interface LyricsPayload {
  trackName: string;
  artistName: string;
  channelName: string;
  originalTitle: string;
  albumName?: string;
  /** YouTube video ID – used to cache/retrieve karaoke lyrics by video */
  videoId?: string;
}

/**
 * Returns true when a LRCLIB result is genuinely a karaoke track,
 * based on the trackName or albumName containing "karaoke".
 *
 * Used as a guard so we never treat a plain result as karaoke.
 */
function isKaraokeResult(result: LyricsData): boolean {
  return [result.trackName, result.albumName].some((v) =>
    normalizeText(v ?? "").includes("karaoke"),
  );
}

/**
 * Builds the deduplicated list of normal (non-karaoke) search candidates
 * from a lyrics payload.
 */
function createNormalCandidates(payload: LyricsPayload): SearchCandidate[] {
  const { trackName, artistName, channelName, originalTitle, albumName } =
    payload;
  const normalizedChannel = normalizeChannelToArtist(channelName);

  const candidates: SearchCandidate[] = [
    { trackName, artistName, albumName },
    { trackName, artistName, albumName: "" },
    { trackName, artistName: normalizedChannel, albumName: "" },
    { trackName, artistName: channelName, albumName: "" },
    { trackName, artistName: "", albumName: "" },
    { trackName: originalTitle, artistName: "", albumName: "" },
  ];

  return candidates.filter((item, index, arr) => {
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
}

/**
 * Returns the first candidate that has a valid local cache entry,
 * without calling any search API.
 * Pass videoId to resolve video-specific offsets.
 */
async function findFirstCachedLyrics(
  candidates: SearchCandidate[],
  videoId?: string,
): Promise<LyricsData | null> {
  for (const candidate of candidates) {
    try {
      const cached = await getCachedLyrics(candidate, videoId);
      if (cached) return cached;
    } catch (err) {
      console.warn("[Lyrics] Failed to read cached candidate:", candidate, err);
    }
  }
  return null;
}

/**
 * Searches only for genuine karaoke versions of a track.
 *
 * Caching is handled transparently by searchOnce() via lyricsCacheKey —
 * results are stored as "lyrics:<artist>:<karaoke track>:<album>" and are
 * therefore shared across all YouTube videos with the same metadata.
 *
 * Intentionally does NOT fall back to the plain track — callers that need
 * a normal lyrics fallback should handle that separately.
 */
async function searchAndCacheKaraoke(
  payload: LyricsPayload,
): Promise<LyricsData | null> {
  const { trackName, artistName, albumName } = payload;
  if (!trackName) return null;

  const alreadyKaraoke = normalizeText(trackName).includes("karaoke");

  // Only search karaoke-suffixed variants; never search the plain track name
  // to avoid accidentally caching a normal result as karaoke.
  const candidates: SearchCandidate[] = alreadyKaraoke
    ? [{ trackName, artistName, albumName }]
    : [
        { trackName: `${trackName} Karaoke`, artistName, albumName },
        { trackName: `${trackName} - Karaoke`, artistName, albumName: "" },
        {
          trackName: `${trackName} (Karaoke Version)`,
          artistName,
          albumName: "",
        },
      ];

  for (const candidate of candidates) {
    // Always score with prioritizeKaraoke=true so karaoke results rank highest.
    // searchOnce() auto-caches the result under lyricsCacheKey — reusable
    // across all videos with the same track/artist/album metadata.
    const result = await searchOnce(candidate, true);

    // Guard: only accept results that are verifiably karaoke
    if (!result || !isKaraokeResult(result)) continue;

    return result;
  }

  return null;
}

/**
 * Sends KARAOKE_LYRICS_UPDATED to the originating tab so the UI can swap in
 * the karaoke result without waiting for a second full request.
 * Errors are swallowed — the tab may have closed or navigated away.
 */
async function notifyKaraokeUpdate(
  tabId: number,
  videoId: string,
  lyrics: LyricsData,
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "KARAOKE_LYRICS_UPDATED",
      payload: { videoId, lyrics },
    });
  } catch (err) {
    console.warn("[Lyrics] Unable to send karaoke update to tab:", err);
  }
}

export interface FindLyricsOptions {
  /**
   * Called when a karaoke result is found asynchronously after the initial
   * response has already been sent. Use this to push the update back to the UI.
   */
  onKaraokeFound?: (lyrics: LyricsData) => void | Promise<void>;
}

/**
 * Resolves lyrics using a stale-while-revalidate strategy.
 *
 * Karaoke results are cached at the song level (lyrics:<artist>:<track>:<album>)
 * by searchOnce(), so they are shared across all videos with the same metadata.
 * There is no separate per-video karaoke index — videoId is only used for
 * resolving video-specific timing offsets.
 *
 * Flow when prioritizeKaraoke is enabled:
 *
 *   1. Any lyrics cache hit (karaoke or normal):
 *      → Return cached lyrics immediately (with video-specific offset if known).
 *      → If the hit is not a karaoke result, run karaoke search in parallel
 *        and call onKaraokeFound when a better result arrives.
 *
 *   2. No cache at all:
 *      → Await karaoke search first (true prioritization).
 *      → If karaoke not found, fall through to sequential normal search.
 *
 * When prioritizeKaraoke is disabled, always runs the normal sequential search.
 */
export async function findLyrics(
  payload: LyricsPayload,
  options: FindLyricsOptions = {},
): Promise<LyricsData | null> {
  const { videoId } = payload;

  // Check for video overrides in remote config
  if (videoId) {
    try {
      const blacklist = await getOrFetchBlacklist();
      const overrides = blacklist.videoOverrides ?? {};
      if (videoId in overrides) {
        const overrideId = overrides[videoId];
        console.log(`[Lyrics] Applying video override for videoId ${videoId} -> ID ${overrideId}`);
        if (overrideId) {
          const lyrics = await fetchLyricsByIdWithCache(overrideId);
          if (lyrics) {
            const offsetMs = await getLyricsOffset(overrideId, videoId);
            return { ...lyrics, offsetMs };
          }
        }
      }
    } catch (e) {
      console.warn("[Lyrics] Failed to apply video override:", e);
    }
  }

  let prioritizeKaraoke = false;
  try {
    const settingsResult = await chrome.storage.local.get(
      "lyrics_extension_settings",
    );
    const storedSettings = settingsResult[
      "lyrics_extension_settings"
    ] as Settings | undefined;
    prioritizeKaraoke = storedSettings?.prioritizeKaraoke ?? false;
  } catch (e) {
    console.error("[Lyrics background] Failed to load settings:", e);
  }

  const normalCandidates = createNormalCandidates(payload);

  // ── 1. Any cache hit → return immediately, search karaoke async if needed ─
  // Pass videoId so the resolved offset is video-specific where available.
  const cachedNormal = await findFirstCachedLyrics(normalCandidates, videoId);
  if (cachedNormal) {
    if (prioritizeKaraoke) {
      // Run karaoke search in parallel; push result to UI when ready.
      void searchAndCacheKaraoke(payload)
        .then(async (karaoke) => {
          if (karaoke && karaoke.id !== cachedNormal.id) {
            await options.onKaraokeFound?.(karaoke);
          }
        })
        .catch((err) => {
          console.warn("[Lyrics] Background karaoke search failed:", err);
        });
    }
    return cachedNormal;
  }

  // ── 3. No cache: try karaoke first, then normal sequential search ─────────
  if (prioritizeKaraoke) {
    const karaokeResult = await searchAndCacheKaraoke(payload);
    if (karaokeResult) return karaokeResult;
  }

  console.log(payload);
  for (const candidate of normalCandidates) {
    const result = await searchOnce(candidate, false);
    console.log(candidate, result);
    if (result) return result;
  }

  return null;
}

async function collectDiagnostics(
  trackName?: string,
  artistName?: string,
  albumName?: string,
): Promise<Record<string, unknown>> {
  const manifest = chrome.runtime.getManifest();
  let cachedValue: unknown = null;

  if (trackName) {
    const cacheKey = lyricsCacheKey({
      trackName,
      artistName: artistName ?? "",
      albumName,
    });
    try {
      const cached = await chrome.storage.local.get(cacheKey);
      cachedValue = cached[cacheKey] ?? null;
    } catch (e) {
      console.error("[Lyrics background] Failed to load cache entry:", e);
    }
  }

  let settings: Settings | undefined;
  try {
    const s = await chrome.storage.local.get("lyrics_extension_settings");
    settings = s["lyrics_extension_settings"] as Settings | undefined;
  } catch (e) {
    console.error(
      "[Lyrics background] Failed to load settings for diagnostics:",
      e,
    );
  }

  return {
    extensionVersion: manifest.version,
    browserVersion:
      typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    cachedEntry: cachedValue,
    settings,
    timestamp: new Date().toISOString(),
  };
}

async function handleReportIssue(payload: {
  description: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  videoUrl?: string;
  lyricsId?: number;
  thumbnail?: string;
}): Promise<void> {
  const diagnostics = await collectDiagnostics(
    payload.trackName,
    payload.artistName,
    payload.albumName,
  );

  const workerUrl =
    (import.meta.env?.VITE_REPORT_PROXY_URL as string) ||
    "https://lyrike-report-proxy.duckviet.workers.dev";

  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: payload.description,
      trackName: payload.trackName,
      artistName: payload.artistName,
      albumName: payload.albumName,
      videoUrl: payload.videoUrl,
      lyricsId: payload.lyricsId,
      thumbnail: payload.thumbnail,
      diagnostics,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Status code ${response.status}`);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_LYRICS") {
    const tabId = sender.tab?.id;
    const videoId = message.payload?.videoId as string | undefined;
    const forceRefresh = message.payload?.forceRefresh as boolean | undefined;

    const performFetch = async () => {
      if (forceRefresh) {
        const normalCandidates = createNormalCandidates(message.payload);
        for (const candidate of normalCandidates) {
          const cacheKey = lyricsCacheKey(candidate);
          const cached = await chrome.storage.local.get(cacheKey);
          const cachedVal = cached[cacheKey];
          if (cachedVal !== undefined) {
            let id: number | null = null;
            if (typeof cachedVal === "number") {
              id = cachedVal;
            } else if (typeof cachedVal === "string") {
              id = parseInt(cachedVal.split("#")[0], 10);
            }
            if (id && Number.isFinite(id)) {
              await chrome.storage.local.remove(`${LYRICS_PAYLOAD_PREFIX}${id}`);
            }
          }
          await chrome.storage.local.remove(cacheKey);
        }
      }

      return findLyrics(message.payload, {
        onKaraokeFound: async (lyrics) => {
          if (typeof tabId !== "number" || !videoId) return;
          await notifyKaraokeUpdate(tabId, videoId, lyrics);
        },
      });
    };

    performFetch()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );

    return true;
  }

  if (message.type === "REPORT_ISSUE") {
    handleReportIssue(message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    return true;
  }

  return false;
});
