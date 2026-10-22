import {
  FontStyle,
  Language,
  PipBackgroundMode,
  TextAlign,
} from "../constants/settings";

export const PIP_LYRIC_DISPLAY = {
  CLASSIC: "classic",
  POSTER: "poster",
} as const;
export type PipLyricDisplay =
  (typeof PIP_LYRIC_DISPLAY)[keyof typeof PIP_LYRIC_DISPLAY];

export const PIP_META_STYLE = {
  VINYL: "vinyl",
  COVER: "cover",
} as const;
export type PipMetaStyle =
  (typeof PIP_META_STYLE)[keyof typeof PIP_META_STYLE];

export interface WatchInfo {
  videoId: string;
  title: string;
  channelName: string;
  artistName: string;
  trackName: string;
  albumName?: string;
  thumbnail?: string;
}

export interface LyricsData {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  id?: number;
  instrumental?: boolean;
  offsetMs?: number;
}

/** Why a lyrics request failed, so the UI can explain it and offer a fix. */
export type LyricsErrorCode =
  | "rate_limited"
  | "server_busy"
  | "service_error"
  | "offline"
  | "extension_unavailable"
  | "unknown";

export interface LyricsState {
  loading: boolean;
  data: LyricsData | null;
  /** Raw technical message (kept for diagnostics, not for display as-is). */
  error: string;
  errorCode?: LyricsErrorCode;
  /** Only for `rate_limited`: seconds until requests are allowed again. */
  retryAfterSec?: number;
  refetch?: () => void;
}

export interface LyricWord {
  text: string;
  time: number;
}

export interface LyricLine {
  time: number;
  text: string;
  isKaraoke?: boolean;
  words?: LyricWord[];
}

export interface PreparedLyricLine extends LyricLine {
  originalIndex: number;
  __fontVersion: number;
  __displayText: string;
  __inactivePrepared: unknown;
  __activePrepared: unknown;
}

export interface Settings {
  fontFamily: string;
  textSize: number;
  activeTextSize: number;
  visibleLineCount: number;
  activeFontWeight: number;
  fontWeight: number;
  fontStyle: FontStyle;
  inactiveOpacity: number;
  lyricSlideDurationSec: number;
  widgetWidth: number;
  borderRadius: number;
  backgroundOpacity: number;
  autoScroll: boolean;
  hideFloatingWhenPiPOpen: boolean;
  pipBackgroundMode: PipBackgroundMode;
  /** Darkness (%) of the overlay above the PiP video/thumbnail background. */
  pipOverlayOpacity: number;
  /** Blur (px) of the PiP video/thumbnail background. */
  pipBackgroundBlur: number;
  pipLyricDisplay: PipLyricDisplay;
  pipShowMeta: boolean;
  pipMetaStyle: PipMetaStyle;
  pipInfoCollapseWidth: number;
  textAlign: TextAlign;
  language: Language;
  showFloatingWidget: boolean;
  lineGap: number;
  prioritizeKaraoke: boolean;
  version: number;
}

export interface ThemeVars {
  [key: string]: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface MeasuredSlot {
  slotIndex: number;
  top: number;
  measuredHeight: number;
  lineHeightPx: number;
}
