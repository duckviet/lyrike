import { youtubeAdapter } from "./youtube";
import { ytMusicAdapter } from "./ytmusic";
import type { PlatformAdapter } from "./types";

export function getPlatformAdapter(): PlatformAdapter | null {
  const host = location.hostname;

  if (host === "music.youtube.com") {
    return ytMusicAdapter;
  }

  if (host === "www.youtube.com") {
    return youtubeAdapter;
  }

  return null;
}

export type { PlatformAdapter, TrackMeta } from "./types";