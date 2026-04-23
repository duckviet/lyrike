export interface WatchInfo {
  videoId: string;
  title: string;
  channelName: string;
  artistName: string;
  trackName: string;
  thumbnail?: string;
}

export interface LyricsData {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  trackName?: string;
  artistName?: string;
  id?: number;
  instrumental?: boolean;
}

export interface LyricsState {
  loading: boolean;
  data: LyricsData | null;
  error: string;
}

export interface LyricLine {
  time: number;
  text: string;
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
  inactiveOpacity: number;
  lyricSlideDurationSec: number;
  widgetWidth: number;
  borderRadius: number;
  backgroundOpacity: number;
  autoScroll: boolean;
  hideFloatingWhenPiPOpen: boolean;
  pipBackgroundMode: "default" | "color" | "thumbnail" | "video";
  textAlign: "left" | "center" | "right";
  language: "vi" | "en" | "auto";
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
