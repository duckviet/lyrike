export interface TrackMeta {
  trackId: string;
  title: string;
  artistName: string;
  channelName: string;
  albumName?: string;
  thumbnail?: string;
}

export interface PlatformAdapter {
  readonly id: "youtube" | "ytmusic" | "spotify";

  isPlayerPage(): boolean;

  getTrackMeta(): Promise<TrackMeta | null>;

  onTrackChange(cb: () => void): () => void;

  getMediaElement(): HTMLVideoElement | HTMLAudioElement | null;
  getCurrentTime(): number;
  isPaused(): boolean;
  togglePlay(): void;
  nextTrack(): void;
  prevTrack(): void;
  setVolume(v: number): void;
  getVolume(): number;

  isAdShowing?(): boolean;
  captureVideoStream?(): MediaStream | null;
}