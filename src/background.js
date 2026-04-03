function normalizeText(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreResult(result, trackName, artistName) {
  const rt = normalizeText(result.trackName || '');
  const ra = normalizeText(result.artistName || '');
  const t = normalizeText(trackName || '');
  const a = normalizeText(artistName || '');

  let score = 0;

  if (t && rt === t) score += 10;
  if (a && ra === a) score += 10;
  if (t && (rt.includes(t) || t.includes(rt))) score += 4;
  if (a && (ra.includes(a) || a.includes(ra))) score += 4;

  return score;
}

async function searchOnce({ trackName, artistName }) {
  if (!trackName) return null;

  const cacheKey =
    `lyrics:${normalizeText(artistName)}:${normalizeText(trackName)}`;

  const cached = await chrome.storage.local.get(cacheKey);
  if (cached[cacheKey] !== undefined) {
    return cached[cacheKey];
  }

  const url = new URL('https://lrclib.net/api/search');
  url.searchParams.set('track_name', trackName);

  if (artistName) {
    url.searchParams.set('artist_name', artistName);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`LRCLIB error: ${response.status}`);
  }

  const results = await response.json();
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

async function findLyrics(payload) {
  const candidates = [
    {
      trackName: payload.trackName,
      artistName: payload.artistName,
    },
    {
      trackName: payload.trackName,
      artistName: payload.channelName,
    },
    {
      trackName: payload.originalTitle,
      artistName: payload.artistName,
    },
    {
      trackName: payload.trackName,
      artistName: '',
    },
  ].filter((item, index, arr) => {
    if (!item.trackName) return false;

    return (
      arr.findIndex(
        (x) =>
          normalizeText(x.trackName) === normalizeText(item.trackName) &&
          normalizeText(x.artistName) === normalizeText(item.artistName),
      ) === index
    );
  });

  for (const candidate of candidates) {
    const result = await searchOnce(candidate);
    if (result) return result;
  }

  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'FETCH_LYRICS') return;

  findLyrics(message.payload)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error.message || 'Unknown error',
      }),
    );

  return true;
});
