import { useEffect, useState } from "react";
import { LyricsState, WatchInfo } from "../shared/types";

function createEmptyLyricsState(): LyricsState {
  return {
    loading: false,
    data: null,
    error: "",
  };
}

/**
 * Fetches lyrics data for the given track via Chrome runtime messaging.
 * @param track Track information containing videoId and metadata.
 */
export function useLyricsData(track: WatchInfo | null): LyricsState {
  const [lyricsState, setLyricsState] = useState<LyricsState>(
    createEmptyLyricsState(),
  );

  // Reset state when track changes
  const [prevVideoId, setPrevVideoId] = useState(track?.videoId);
  if (track?.videoId !== prevVideoId) {
    setPrevVideoId(track?.videoId);
    setLyricsState(createEmptyLyricsState());
  }

  useEffect(() => {
    if (!track?.videoId) {
      return;
    }

    console.log(track)
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

  return lyricsState;
}
