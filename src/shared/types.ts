export interface WatchInfo {
  videoId: string;
  title: string;
  channelName: string;
  artistName: string;
  trackName: string;
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
  __inactivePrepared: any; // Type from @chenglou/pretext
  __activePrepared: any;   // Type from @chenglou/pretext
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
  usePiPDominantColorTheme: boolean;
  textAlign: "left" | "center" | "right";
}

export interface ThemeVars {
  [key: string]: string;
}

export interface Position {
  x: number;
  y: number;
}
