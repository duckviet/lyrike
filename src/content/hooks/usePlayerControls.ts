import { useState, useEffect, useCallback } from "react";

export function usePlayerControls() {
  const [isPaused, setIsPaused] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const findVideo = () => document.querySelector("video");
    
    let video = findVideo();
    
    const updateState = () => {
      if (video) {
        setIsPaused(video.paused);
        setVolumeState(video.volume);
      }
    };

    const setupListeners = (v: HTMLVideoElement) => {
      v.addEventListener("play", updateState);
      v.addEventListener("pause", updateState);
      v.addEventListener("volumechange", updateState);
    };

    const cleanupListeners = (v: HTMLVideoElement) => {
      v.removeEventListener("play", updateState);
      v.removeEventListener("pause", updateState);
      v.removeEventListener("volumechange", updateState);
    };

    if (video) {
      setupListeners(video);
      updateState();
    }

    // Handle dynamic video elements (e.g. navigation on YouTube)
    const observer = new MutationObserver(() => {
      const newVideo = findVideo();
      if (newVideo !== video) {
        if (video) cleanupListeners(video);
        video = newVideo;
        if (video) {
          setupListeners(video);
          updateState();
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (video) cleanupListeners(video);
      observer.disconnect();
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = document.querySelector("video");
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const nextTrack = useCallback(() => {
    const nextBtn = document.querySelector<HTMLButtonElement>(".ytp-next-button");
    if (nextBtn) nextBtn.click();
  }, []);

  const prevTrack = useCallback(() => {
    // YouTube usually doesn't have a simple "prev" button that always goes to previous track.
    // Sometimes it's the "back" button in the browser or it's handled by YouTube's internal state.
    // However, there is often a .ytp-prev-button if in a playlist.
    const prevBtn = document.querySelector<HTMLButtonElement>(".ytp-prev-button");
    if (prevBtn) {
      prevBtn.click();
    } else {
      // If no prev button, maybe just seek to 0 if at start? 
      // Or just do nothing if not available.
      const video = document.querySelector("video");
      if (video) video.currentTime = 0;
    }
  }, []);

  const setVolume = useCallback((value: number) => {
    const video = document.querySelector("video");
    if (video) {
      video.volume = Math.max(0, Math.min(1, value));
    }
  }, []);

  const adjustOffset = useCallback((delta: number) => {
    setOffset((prev) => prev + delta);
  }, []);

  return {
    isPaused,
    volume,
    offset,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    adjustOffset,
    setOffset,
  };
}
