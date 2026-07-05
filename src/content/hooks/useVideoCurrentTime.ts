import { useEffect, useState } from "react";
import { usePlatform } from "../PlatformContext";
import {
  CURRENT_TIME_TICK_MS,
  VIDEO_SYNC_INTERVAL_MS,
} from "../constants/ui";

interface SyncAnchor {
  videoTime: number;
  epochMs: number;
  paused: boolean;
  playbackRate: number;
}

function createSyncAnchor(video: HTMLMediaElement): SyncAnchor {
  return {
    videoTime: video.currentTime || 0,
    epochMs: Date.now(),
    paused: video.paused,
    playbackRate: video.playbackRate || 1,
  };
}

/**
 * Tracks current playback time of the video with synchronization.
 * @param videoId Optional video ID to track. Resets when changed.
 */
export function useVideoCurrentTime(videoId?: string | null): number {
  const platform = usePlatform();
  const [syncAnchor, setSyncAnchor] = useState<SyncAnchor | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Reset when videoId changes
  const [prevVideoId, setPrevVideoId] = useState(videoId);
  if (videoId !== prevVideoId) {
    setPrevVideoId(videoId);
    setSyncAnchor(null);
    setCurrentTime(0);
  }

  useEffect(() => {
    if (!videoId) {
      return;
    }

    const sync = () => {
      const video = platform.getMediaElement();

      if (!video) {
        return;
      }

      setSyncAnchor(createSyncAnchor(video));
    };

    sync();

    const syncIntervalId = window.setInterval(
      sync,
      VIDEO_SYNC_INTERVAL_MS,
    );

    const video = platform.getMediaElement();

    if (video) {
      video.addEventListener("play", sync);
      video.addEventListener("pause", sync);
      video.addEventListener("seeking", sync);
      video.addEventListener("seeked", sync);
      video.addEventListener("ratechange", sync);
    }

    return () => {
      window.clearInterval(syncIntervalId);

      if (video) {
        video.removeEventListener("play", sync);
        video.removeEventListener("pause", sync);
        video.removeEventListener("seeking", sync);
        video.removeEventListener("seeked", sync);
        video.removeEventListener("ratechange", sync);
      }
    };
  }, [platform, videoId]);

  useEffect(() => {
    if (!syncAnchor) {
      return;
    }

    const tick = () => {
      if (syncAnchor.paused) {
        setCurrentTime(syncAnchor.videoTime);
        return;
      }

      const elapsedSeconds =
        (Date.now() - syncAnchor.epochMs) / 1000;
      const nextTime =
        syncAnchor.videoTime +
        elapsedSeconds * (syncAnchor.playbackRate || 1);

      setCurrentTime(nextTime);
    };

    tick();

    const tickIntervalId = window.setInterval(
      tick,
      CURRENT_TIME_TICK_MS,
    );

    return () => {
      window.clearInterval(tickIntervalId);
    };
  }, [syncAnchor]);

  return currentTime;
}