import { useEffect, useState } from "react";
import { WatchInfo } from "../shared/types";
import { canFetchVideoDetails, fetchVideoDetails } from "../utils/videoInfo";
import { getVideoIdFromURL, inferSongInfo, pickText } from "../utils/trackInfo";

function getFallbackTrack(videoId: string): WatchInfo {
  const domTitle =
    pickText([
      "ytd-watch-metadata h1 yt-formatted-string",
      "h1.title yt-formatted-string",
      "h1.style-scope.ytd-watch-metadata",
    ]) || document.title.replace(/\s*-\s*YouTube\s*$/i, "").trim();

  const domChannel = pickText([
    "ytd-watch-metadata ytd-channel-name a",
    "#channel-name a",
    "#owner #channel-name a",
  ]);

  const { artistName, trackName, albumName } = inferSongInfo(domTitle, domChannel, "");

  return {
    videoId,
    title: domTitle,
    channelName: domChannel,
    artistName,
    trackName,
    albumName,
  };
}

/**
 * Detects and extracts track info from YouTube watch page.
 * Uses DOM scraping for immediate data + API for enriched metadata.
 */
export function useWatchTrack(): WatchInfo | null {
  const [track, setTrack] = useState<WatchInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    const update = async () => {
      const videoId = getVideoIdFromURL();
      if (!videoId) {
        setTrack(null);
        return;
      }

      const fallbackTrack = getFallbackTrack(videoId);

      if (!canFetchVideoDetails()) {
        if (!cancelled) {
          setTrack(fallbackTrack);
        }
        return;
      }

      try {
        const details = await fetchVideoDetails(videoId);
        if (cancelled) return;

        const title = details.title || fallbackTrack.title;
        const channelName = details.channelTitle || fallbackTrack.channelName;
        const { artistName, trackName, albumName } = inferSongInfo(
          title,
          channelName,
          details.description,
        );

        setTrack({
          videoId,
          title,
          channelName,
          artistName,
          trackName,
          albumName,
          thumbnail: details.thumbnail,
        });
      } catch (err) {
        console.warn("[useWatchTrack] API fetch failed, using DOM data", err);
        if (!cancelled) {
          setTrack(fallbackTrack);
        }
      }
    };

    update();

    const observer = new MutationObserver(() => {
      const newId = getVideoIdFromURL();
      if (newId !== track?.videoId) update();
    });

    observer.observe(document.querySelector("title") || document.head, {
      childList: true,
      subtree: true,
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [track?.videoId]);

  useEffect(() => {
    const onNav = () => {
      const videoId = getVideoIdFromURL();
      if (!videoId) setTrack(null);
    };
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);

  return track;
}
