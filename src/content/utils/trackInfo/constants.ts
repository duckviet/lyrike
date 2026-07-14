// Shared music context keywords (e.g. album, ep, single, ost)
export const CONTEXT_KEYWORDS = ["album", "ep", "single", "ost"];
export const CONTEXT_PATTERN = CONTEXT_KEYWORDS.join("|");

// Noise words used to clean video titles
export const TITLE_NOISE_WORDS = [
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
  "videoclip",
  "video\\s+clip",
  "clip",
  "prod(?:uced)?(?:\\s+(?:by|por|de))?",
  "guitar(?:ra)?(?:\\s+(?:por|by|de))?",
];

// Substrings to filter out general noise in album detection
export const ALBUM_NOISE_KEYWORDS = ["video", "mv", "audio", "official", "lyric", "preview", "teaser"];
export const ALBUM_NOISE_RE = new RegExp(`\\b(?:${ALBUM_NOISE_KEYWORDS.join("|")})\\b`, "i");

// Common channel suffixes and music label noise words
export const CHANNEL_NOISE_WORDS = [
  "official",
  "vevo",
  "music",
  "channel",
  "tv",
  "hd",
  "topic",
  "records?",
  "entertainment",
  "production",
];
export const CHANNEL_NOISE_PATTERN = CHANNEL_NOISE_WORDS.join("|");

// Regex to normalize channel/artist names for comparison
export const CMP_NOISE_RE = new RegExp(`\\b(?:${CHANNEL_NOISE_PATTERN})\\b`, "g");

// Regex to normalize channel names to artists (excluding 'hd' to match original behavior exactly)
export const CHANNEL_TO_ARTIST_NOISE_WORDS = CHANNEL_NOISE_WORDS.filter((w) => w !== "hd");
export const CHANNEL_TO_ARTIST_NOISE_RE = new RegExp(
  `\\b(?:${CHANNEL_TO_ARTIST_NOISE_WORDS.join("|")})\\b`,
  "gi",
);
