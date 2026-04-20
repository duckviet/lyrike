import { useEffect, useState } from "react";
import { LyricsState, WatchInfo } from "../../shared/types";

function createEmptyLyricsState(): LyricsState {
  return {
    loading: false,
    data: null,
    error: "",
  };
}

export function useLyricsData(track: WatchInfo | null): LyricsState {
  const [lyricsState, setLyricsState] = useState<LyricsState>(
    createEmptyLyricsState(),
  );

  useEffect(() => {
    if (!track?.videoId || !track?.trackName) {
      setLyricsState(createEmptyLyricsState());
      return;
    }

    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      !chrome.runtime.sendMessage
    ) {
      setLyricsState({
        loading: false,
        data: null,
        error: "Chrome runtime is unavailable",
      });
      return;
    }

    let cancelled = false;

    setLyricsState({
      loading: true,
      data: null,
      error: "",
    });

    try {
      chrome.runtime.sendMessage(
        {
          type: "FETCH_LYRICS",
          payload: {
            trackName: track.trackName,
            artistName: track.artistName,
            channelName: track.channelName,
            originalTitle: track.title,
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
    } catch (error: any) {
      if (!cancelled) {
        setLyricsState({
          loading: false,
          data: null,
          error: error?.message || "Fetch failed",
        });
      }
    }

    return () => {
      cancelled = true;
    };
  }, [
    track?.videoId,
    track?.trackName,
    track?.artistName,
    track?.channelName,
    track?.title,
  ]);

  return lyricsState;
}