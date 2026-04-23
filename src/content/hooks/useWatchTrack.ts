import { useEffect, useState } from "react";
import { WatchInfo } from "../shared/types";
import { fetchVideoDetails } from "../utils/videoInfo";
import { getVideoIdFromURL, inferSongInfo, pickText } from "../utils/trackInfo";

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

      const domTitle = pickText([
        "ytd-watch-metadata h1 yt-formatted-string",
        "h1.title yt-formatted-string",
        "h1.style-scope.ytd-watch-metadata",
      ]);
      const domChannel = pickText([
        "ytd-watch-metadata ytd-channel-name a",
        "#channel-name a",
        "#owner #channel-name a",
      ]);

      try {
        const details = await fetchVideoDetails(videoId);
        if (cancelled) return;

        const title = details.title || domTitle;
        const channelName = details.channelTitle || domChannel;
        const { artistName, trackName } = inferSongInfo(
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
          thumbnail: details.thumbnail,
        });
      } catch (err) {
        console.warn("[useWatchTrack] API fetch failed, using DOM data", err);
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
