import { useState, useEffect, useCallback, useRef } from "react";
import { usePlatform } from "../PlatformContext";
import { setMediaKaraokeMode } from "../utils/karaokeAudio";

export function usePlayerControls() {
  const platform = usePlatform();
  const [isPaused, setIsPaused] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [offset, setOffset] = useState(0);
  const [karaokeMode, setKaraokeMode] = useState(false);
  const karaokeModeRef = useRef(karaokeMode);

  useEffect(() => {
    karaokeModeRef.current = karaokeMode;
    const media = platform.getMediaElement();
    if (!media) return;
    const isAd = platform.isAdShowing?.() ?? false;
    setMediaKaraokeMode(media, !isAd && karaokeMode);
  }, [platform, karaokeMode]);

  useEffect(() => {
    if (!platform.isPlayerPage()) {
      return;
    }

    const findMedia = () => platform.getMediaElement();

    let media = findMedia();


    const applyKaraoke = (target: HTMLVideoElement | HTMLAudioElement | null) => {
      if (!target) return;
      const isAd = platform.isAdShowing?.() ?? false;
      setMediaKaraokeMode(target, !isAd && karaokeModeRef.current);
    };

    const updateState = () => {
      if (media) {
        setIsPaused(media.paused);
        setVolumeState(media.volume);
        applyKaraoke(media);
      }
    };

    const setupListeners = (value: HTMLVideoElement | HTMLAudioElement) => {
      value.addEventListener("play", updateState);
      value.addEventListener("pause", updateState);
      value.addEventListener("volumechange", updateState);
    };

    const cleanupListeners = (value: HTMLVideoElement | HTMLAudioElement) => {
      value.removeEventListener("play", updateState);
      value.removeEventListener("pause", updateState);
      value.removeEventListener("volumechange", updateState);
    };

    if (media) {
      setupListeners(media);
      updateState();
    }

    // Handle dynamic media elements (e.g. navigation on YouTube / YouTube Music)
    const observer = new MutationObserver(() => {
      const newMedia = findMedia();
      if (newMedia !== media) {
        if (media) {
          setMediaKaraokeMode(media, false);
          cleanupListeners(media);
        }
        media = newMedia;
        if (media) {
          setupListeners(media);
          updateState();
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (media) {
        setMediaKaraokeMode(media, false);
        cleanupListeners(media);
      }
      observer.disconnect();
    };
  }, [platform]);

  const togglePlay = useCallback(() => {
    platform.togglePlay();
  }, [platform]);

  const nextTrack = useCallback(() => {
    platform.nextTrack();
  }, [platform]);

  const prevTrack = useCallback(() => {
    platform.prevTrack();
  }, [platform]);

  const setVolume = useCallback((value: number) => {
    platform.setVolume(value);
  }, [platform]);

  const adjustOffset = useCallback((delta: number) => {
    setOffset((prev) => prev + delta);
  }, []);

  const toggleKaraokeMode = useCallback(() => {
    setKaraokeMode((prev) => !prev);
  }, []);

  return {
    isPaused,
    volume,
    offset,
    karaokeMode,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    adjustOffset,
    setOffset,
    toggleKaraokeMode,
  };
}
