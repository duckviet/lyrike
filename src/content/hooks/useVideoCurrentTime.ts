import { useEffect, useState } from "react";
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

function createSyncAnchor(video: HTMLVideoElement): SyncAnchor {
  return {
    videoTime: video.currentTime || 0,
    epochMs: Date.now(),
    paused: video.paused,
    playbackRate: video.playbackRate || 1,
  };
}

function getVideoElement(): HTMLVideoElement | null {
  return document.querySelector("video");
}

export function useVideoCurrentTime(videoId?: string | null): number {
  const [syncAnchor, setSyncAnchor] = useState<SyncAnchor | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    if (!videoId) {
      setSyncAnchor(null);
      setCurrentTime(0);
      return;
    }

    const sync = () => {
      const video = getVideoElement();

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

    const video = getVideoElement();

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
  }, [videoId]);

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