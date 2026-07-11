import { useEffect, useRef, useState } from "react";
import { LyricsData, LyricsState, WatchInfo } from "../shared/types";

function createEmptyLyricsState(): LyricsState {
  return {
    loading: false,
    data: null,
    error: "",
  };
}

/**
 * Fetches lyrics data for the given track via Chrome runtime messaging.
 *
 * When prioritizeKaraoke is enabled, the background may find a karaoke version
 * asynchronously after the initial response. It pushes a KARAOKE_LYRICS_UPDATED
 * message to this tab; the hook picks it up and swaps the lyrics in the UI.
 *
 * @param track Track information containing videoId and metadata.
 */
export function useLyricsData(track: WatchInfo | null): LyricsState {
  const [lyricsState, setLyricsState] = useState<LyricsState>(
    createEmptyLyricsState(),
  );

  // Keep a stable ref to the current videoId so the message listener can
  // check it without being stale due to closure capture.
  const currentVideoIdRef = useRef<string | undefined>(track?.videoId);

  // Reset state when track changes
  const [prevVideoId, setPrevVideoId] = useState(track?.videoId);
  if (track?.videoId !== prevVideoId) {
    setPrevVideoId(track?.videoId);
    currentVideoIdRef.current = track?.videoId;
    setLyricsState(createEmptyLyricsState());
  }

  // ── Main fetch effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!track?.videoId) {
      return;
    }

    console.log(track);
    const queryTrackName = (track.trackName || track.title || "").trim();
    if (!queryTrackName) {
      return;
    }

    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      !chrome.runtime.sendMessage
    ) {
      requestAnimationFrame(() => {
        setLyricsState({
          loading: false,
          data: null,
          error: "Chrome runtime is unavailable",
        });
      });
      return;
    }

    let cancelled = false;

    requestAnimationFrame(() => {
      setLyricsState({
        loading: true,
        data: null,
        error: "",
      });
    });

    try {
      chrome.runtime.sendMessage(
        {
          type: "FETCH_LYRICS",
          payload: {
            trackName: queryTrackName,
            artistName: track.artistName,
            channelName: track.channelName,
            originalTitle: track.title,
            albumName: track.albumName,
            videoId: track.videoId,
          },
        },
        (response) => {
          if (cancelled) {
            return;
          }
          if (chrome.runtime.lastError) {
            setLyricsState({
              loading: false,
              data: null,
              error: chrome.runtime.lastError.message || "Chrome error",
            });
            return;
          }

          if (!response?.ok) {
            setLyricsState({
              loading: false,
              data: null,
              error: response?.error || "Fetch failed",
            });
            return;
          }

          setLyricsState({
            loading: false,
            data: response.data,
            error: "",
          });
        },
      );
    } catch (error: unknown) {
      if (!cancelled) {
        requestAnimationFrame(() => {
          setLyricsState({
            loading: false,
            data: null,
            error: error instanceof Error ? error.message : "Fetch failed",
          });
        });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [
    track?.videoId,
    track?.trackName,
    track?.title,
    track?.artistName,
    track?.channelName,
    track?.albumName,
  ]);

  // ── Karaoke push-update listener ───────────────────────────────────────────
  //
  // When prioritizeKaraoke is on, the background sends KARAOKE_LYRICS_UPDATED
  // after the initial sendResponse() has already returned. This effect
  // listens for that message and swaps in the karaoke lyrics if the videoId
  // still matches the currently playing track.
  useEffect(() => {
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime?.onMessage
    ) {
      return;
    }

    const handleMessage = (message: {
      type?: string;
      payload?: { videoId?: string; lyrics?: LyricsData };
    }) => {
      if (message.type !== "KARAOKE_LYRICS_UPDATED") return;

      const { videoId: updatedVideoId, lyrics: updatedLyrics } =
        message.payload ?? {};

      // Guard: ignore if the user has already navigated to a different video
      if (!updatedLyrics || updatedVideoId !== currentVideoIdRef.current) return;

      console.log(
        "[Lyrics] Received karaoke push-update for videoId:",
        updatedVideoId,
      );
      setLyricsState({ loading: false, data: updatedLyrics, error: "" });
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [track?.videoId]);

  return lyricsState;
}
