import { LyricsData } from "./content/shared/types";

function normalizeText(value: string = ""): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreResult(
  result: LyricsData,
  trackName: string,
  artistName: string,
): number {
  const syncedLyrics = result.syncedLyrics;
  const rt = normalizeText(result.trackName || "");
  const ra = normalizeText(result.artistName || "");
  const t = normalizeText(trackName || "");
  const a = normalizeText(artistName || "");

  let score = 0;

  if (syncedLyrics) score += 100;
  if (t && rt === t) score += 10;
  if (a && ra === a) score += 10;
  if (t && (rt.includes(t) || t.includes(rt))) score += 4;
  if (a && (ra.includes(a) || a.includes(ra))) score += 4;

  return score;
}

interface SearchCandidate {
  trackName: string;
  artistName: string;
}

async function searchOnce({
  trackName,
  artistName,
}: SearchCandidate): Promise<LyricsData | null> {
  if (!trackName) return null;

  const cacheKey = `lyrics:${normalizeText(artistName)}:${normalizeText(trackName)}`;

  const cached = await chrome.storage.local.get(cacheKey);
  if (cached[cacheKey] !== undefined) {
    return cached[cacheKey] as LyricsData | null;
  }

  const url = new URL("https://lrclib.net/api/search");
  url.searchParams.set("track_name", trackName);

  if (artistName) {
    url.searchParams.set("artist_name", artistName);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`LRCLIB error: ${response.status}`);
  }

  const results: LyricsData[] = await response.json();

  console.log(url);
  console.log(results);
  const best =
    results
      .slice()
      .sort(
        (a, b) =>
          scoreResult(b, trackName, artistName) -
          scoreResult(a, trackName, artistName),
      )[0] || null;

  await chrome.storage.local.set({ [cacheKey]: best });
  return best;
}

interface LyricsPayload {
  trackName: string;
  artistName: string;
  channelName: string;
  originalTitle: string;
}

async function findLyrics(payload: LyricsPayload): Promise<LyricsData | null> {
  const { trackName, artistName, channelName, originalTitle } = payload;

  // Normalize channel name: strip "Official", "VEVO", etc.
  const normalizedChannel = channelName
    .replace(
      /\b(official|vevo|music|channel|tv|topic|records?|entertainment)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  const candidates: SearchCandidate[] = [
    // Best case: inferred artist + clean track
    { trackName, artistName },
    // Fallback: use normalized channel as artist
    { trackName, artistName: normalizedChannel },
    // Fallback: raw channel name
    { trackName, artistName: channelName },
    // Fallback: track only (let LRCLIB score sort it out)
    { trackName, artistName: "" },
    // Last resort: original full title (catches edge cases)
    { trackName: originalTitle, artistName: "" },
  ].filter((item, index, arr) => {
    if (!item.trackName) return false;
    // Deduplicate
    return (
      arr.findIndex(
        (x) =>
          normalizeText(x.trackName) === normalizeText(item.trackName) &&
          normalizeText(x.artistName) === normalizeText(item.artistName),
      ) === index
    );
  });

  console.log(candidates);
  for (const candidate of candidates) {
    const result = await searchOnce(candidate);
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
