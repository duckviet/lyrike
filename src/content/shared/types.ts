import {
  FontStyle,
  Language,
  PipBackgroundMode,
  TextAlign,
} from "../constants/settings";

export const PIP_LAYOUT_MODE = {
  CLASSIC: "classic",
  SPLIT: "split",
} as const;
export type PipLayoutMode =
  (typeof PIP_LAYOUT_MODE)[keyof typeof PIP_LAYOUT_MODE];

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

export interface LyricsState {
  loading: boolean;
  data: LyricsData | null;
  error: string;
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
  pipLayoutMode: PipLayoutMode;
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
