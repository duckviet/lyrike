import { useEffect, useState } from "react";
import { TRACK_POLL_INTERVAL_MS } from "../constants/ui";
import { getWatchInfo } from "../utils/trackInfo";
import { WatchInfo } from "../../shared/types";

function isSameTrack(prev: WatchInfo, next: WatchInfo): boolean {
  return (
    prev.videoId === next.videoId &&
    prev.title === next.title &&
    prev.trackName === next.trackName &&
    prev.artistName === next.artistName &&
    prev.channelName === next.channelName
  );
}

export function useWatchTrack(): WatchInfo | null {
  const [track, setTrack] = useState<WatchInfo | null>(null);

  useEffect(() => {
    const readTrack = () => {
      try {
        const nextTrack = getWatchInfo();

        setTrack((prevTrack) => {
          if (!nextTrack) {
            return null;
          }

          if (!prevTrack) {
            return nextTrack;
          }

          return isSameTrack(prevTrack, nextTrack) ? prevTrack : nextTrack;
        });
      } catch (error) {
        console.error("[Lyrics] Failed to read watch info:", error);
        setTrack(null);
      }
    };

    readTrack();

    const intervalId = window.setInterval(readTrack, TRACK_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return track;
}
