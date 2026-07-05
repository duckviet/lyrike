import { canFetchVideoDetails, fetchVideoDetails } from "../utils/videoInfo";
import { normalizeChannelToArtist } from "../utils/trackInfo";
import {
  captureVideoStreamFromElement,
  createTrackChangeSubscription,
  getVideoThumbnailUrl,
  getBestMediaElement,
  normalizeVolume,
  queryText,
} from "./shared";
import type { PlatformAdapter, TrackMeta } from "./types";

function getVideoIdFromURL(): string | null {
  if (!location.pathname.startsWith("/watch")) {
    return null;
  }

  return new URLSearchParams(location.search).get("v");
}

function stripYouTubeSuffix(value: string): string {
  return value.replace(/\s*-\s*YouTube\s*$/i, "").trim();
}

function getFallbackTrackMeta(trackId: string): TrackMeta {
  const title =
    queryText([
      "ytd-watch-metadata h1 yt-formatted-string",
      "h1.title yt-formatted-string",
      "h1.style-scope.ytd-watch-metadata",
    ]) || stripYouTubeSuffix(document.title);

  const channelName = queryText([
    "ytd-watch-metadata ytd-channel-name a",
    "#channel-name a",
    "#owner #channel-name a",
  ]);

  return {
    trackId,
    title,
    channelName,
    artistName: normalizeChannelToArtist(channelName),
    thumbnail: getVideoThumbnailUrl(trackId),
  };
}

export const youtubeAdapter: PlatformAdapter = {
  id: "youtube",

  isPlayerPage() {
    return location.hostname === "www.youtube.com" && location.pathname.startsWith("/watch");
  },

  async getTrackMeta() {
    const trackId = getVideoIdFromURL();

    if (!trackId) {
      return null;
    }

    const fallbackMeta = getFallbackTrackMeta(trackId);

    if (!canFetchVideoDetails()) {
      return fallbackMeta;
    }

    try {
      const details = await fetchVideoDetails(trackId);

      return {
        trackId,
        title: details.title || fallbackMeta.title,
        channelName: details.channelTitle || fallbackMeta.channelName,
        artistName: normalizeChannelToArtist(
          details.channelTitle || fallbackMeta.channelName,
        ),
        thumbnail: details.thumbnail,
      };
    } catch (error) {
      console.warn("[youtubeAdapter] video details fetch failed, using DOM data", error);
      return fallbackMeta;
    }
  },

  onTrackChange(cb) {
    return createTrackChangeSubscription(getVideoIdFromURL, cb);
  },

  getMediaElement() {
    return getBestMediaElement();
  },

  getCurrentTime() {
    return getBestMediaElement()?.currentTime || 0;
  },

  isPaused() {
    return getBestMediaElement()?.paused ?? true;
  },

  togglePlay() {
    const media = getBestMediaElement();

    if (!media) {
      return;
    }

    if (media.paused) {
      void media.play();
    } else {
      media.pause();
    }
  },

  nextTrack() {
    document.querySelector<HTMLButtonElement>(".ytp-next-button")?.click();
  },

  prevTrack() {
    const prevButton = document.querySelector<HTMLButtonElement>(".ytp-prev-button");

    if (prevButton) {
      prevButton.click();
      return;
    }

    const media = getBestMediaElement();

    if (media) {
      media.currentTime = 0;
    }
  },

  setVolume(value: number) {
    const media = getBestMediaElement();

    if (media) {
      media.volume = normalizeVolume(value);
    }
  },

  getVolume() {
    return getBestMediaElement()?.volume ?? 1;
  },

  isAdShowing() {
    return !!document.querySelector(".html5-video-player.ad-showing");
  },

  captureVideoStream() {
    return captureVideoStreamFromElement(getBestMediaElement());
  },
};