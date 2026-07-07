import { useEffect, useState } from "react";
import { usePlatform } from "../PlatformContext";
import { inferSongInfo } from "../utils/trackInfo";
import type { TrackMeta } from "../platforms";
import { WatchInfo } from "../shared/types";

function toWatchInfo(track: TrackMeta | null): WatchInfo | null {
  if (!track) {
    return null;
  }

  const { artistName, trackName, albumName } = inferSongInfo(
    track.title,
    track.artistName || track.channelName,
    "",
  );

  return {
    videoId: track.trackId,
    title: track.title,
    channelName: track.channelName,
    artistName,
    trackName,
    albumName: track.albumName ?? albumName,
    thumbnail: track.thumbnail,
  };
}

export function useCurrentTrack(): WatchInfo | null {
  const platform = usePlatform();
  const [track, setTrack] = useState<WatchInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    const update = async () => {
      const meta = await platform.getTrackMeta();

      if (cancelled) {
        return;
      }

      setTrack(toWatchInfo(meta));
    };

    void update();

    const unsubscribe = platform.onTrackChange(() => {
      void update();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [platform]);

  return track;
}