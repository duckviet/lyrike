import { ARTIST_RE, TRACK_RE, ALBUM_RE } from "./regex-builder";
import {
  removeBracketedNoise,
  cleanTrackName,
  normalizeChannelToArtist,
  extractPrimaryArtist,
} from "./normalize";
import {
  parsePipeSeparatedTitle,
  parseDashSeparatedTitle,
} from "./parsers";
import { CONTEXT_PATTERN, ALBUM_NOISE_RE } from "./constants";

const ALBUM_TRAILING_PIPE_RE = new RegExp(
  `\\s*[|｜]\\s*([^|｜]*\\b(?:${CONTEXT_PATTERN})\\b[^|｜]*)$`,
  "i",
);

const ALBUM_BRACKET_RE = new RegExp(
  `\\[[^\\]]*\\b(?:${CONTEXT_PATTERN})\\b[^\\]]*\\]|\\([^)]*\\b(?:${CONTEXT_PATTERN})\\b[^)]*\\)`,
  "i",
);

export function parseDescriptionMeta(
  description: string,
  channelName: string,
  titleResult: { artistName: string; trackName: string } | null,
): { artistName?: string; trackName?: string; albumName?: string } {
  if (!description) return {};
  const result: { artistName?: string; trackName?: string; albumName?: string } = {};

  // Explicit labels — require colon directly after keyword (bounded to 150 chars max to avoid runaways)
  const artistMatch = description.match(ARTIST_RE);
  if (artistMatch) result.artistName = artistMatch[1].trim();

  const trackMatch = description.match(TRACK_RE);
  if (trackMatch) result.trackName = trackMatch[1].trim();

  const albumMatch = description.match(ALBUM_RE);
  if (albumMatch) result.albumName = albumMatch[1].trim();

  // Auto-generated topic channel description parsing
  if (description.includes("Provided to YouTube by")) {
    const lines = description.split("\n").map((l) => l.trim()).filter(Boolean);
    const idx = lines.findIndex((l) => l.includes("Provided to YouTube by"));
    if (idx !== -1 && idx + 2 < lines.length) {
      const albumLine = lines[idx + 2];
      if (
        !albumLine.startsWith("℗") &&
        !albumLine.toLowerCase().includes("released on") &&
        !albumLine.toLowerCase().includes("auto-generated")
      ) {
        result.albumName = albumLine;
      }
    }
  }

  if (result.artistName && result.trackName && result.albumName) return result;

  // "Written & performed by X, Y" — take first (bounded to 150 chars max)
  if (!result.artistName) {
    const perfMatch = description.match(
      /(?:written\s*&?\s*)?performed\s+by\s+([^,\n]{1,150})/im,
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
): { artistName: string; trackName: string; albumName?: string } {
  // 1. Extract album name from title if present
  let titleAlbumName: string | undefined;

  // Try trailing pipe first
  const albumMatch = title.match(ALBUM_TRAILING_PIPE_RE);
  if (albumMatch) {
    titleAlbumName = albumMatch[1].trim();
  } else {
    // Try bracketed content
    const bracketMatch = title.match(ALBUM_BRACKET_RE);
    if (bracketMatch) {
      const rawAlbum = bracketMatch[0].slice(1, -1).trim();
      if (!ALBUM_NOISE_RE.test(rawAlbum)) {
        titleAlbumName = rawAlbum;
      }
    }
  }

  // 2. YouTube Music auto-generated "Artist - Topic" channels
  if (/\s*-\s*topic\s*$/i.test(channelName)) {
    const descMeta = parseDescriptionMeta(description, channelName, null);
    return {
      artistName: normalizeChannelToArtist(channelName),
      trackName: cleanTrackName(removeBracketedNoise(title)),
      albumName: descMeta.albumName || titleAlbumName,
    };
  }

  // 3. Title parsing — try pipe first, then dash
  const pipeResult = parsePipeSeparatedTitle(title, channelName);
  const dashResult = parseDashSeparatedTitle(title, channelName);
  const titleResult = pipeResult || dashResult;

  // 4. Description metadata — pass titleResult so it knows whether to
  //    attempt first-line fallback
  const descMeta = parseDescriptionMeta(description, channelName, titleResult);

  // 5. Merge: description structured fields > title parse > channel fallback
  const artistName = extractPrimaryArtist(
    descMeta.artistName ||
      titleResult?.artistName ||
      normalizeChannelToArtist(channelName),
  );

  const trackName =
    descMeta.trackName ||
    titleResult?.trackName ||
    cleanTrackName(removeBracketedNoise(title));

  const albumName = descMeta.albumName || titleAlbumName;

  return { artistName, trackName, albumName };
}
