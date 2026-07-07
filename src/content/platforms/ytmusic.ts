import { normalizeChannelToArtist } from "../utils/trackInfo";
import {
  captureVideoStreamFromElement,
  getMainVideoElement,
  getVideoThumbnailUrl,
  normalizeVolume,
  queryText,
} from "./shared";
import type { PlatformAdapter, TrackMeta } from "./types";

function getTrackIdFromURL(): string | null {
  if (!location.pathname.startsWith("/watch")) {
    return null;
  }

  return new URLSearchParams(location.search).get("v");
}

function stripMusicSuffix(value: string): string {
  return value.replace(/\s*-\s*YouTube Music\s*$/i, "").trim();
}

function readPlayerMeta() {
  const title =
    queryText([
      "ytmusic-player-bar yt-formatted-string.title",
      "ytmusic-player-bar .content-info-wrapper yt-formatted-string.title",
      "ytmusic-player-bar .title",
    ]) || stripMusicSuffix(document.title);

  const artistName = queryText([
    "ytmusic-player-bar .byline a",
    "ytmusic-player-bar .content-info-wrapper .byline a",
    "ytmusic-player-bar .byline",
  ]);

  const albumName = queryText([
    "ytmusic-player-bar .subtitle a",
    "ytmusic-player-bar .content-info-wrapper .subtitle a",
    "ytmusic-player-bar .subtitle",
  ]);

  return {
    title,
    artistName,
    albumName,
  };
}

function getFallbackTrackMeta(trackId: string): TrackMeta {
  const { title, artistName, albumName } = readPlayerMeta();

  return {
    trackId,
    title,
    channelName: artistName,
    artistName: normalizeChannelToArtist(artistName),
    albumName: albumName || undefined,
    thumbnail: getVideoThumbnailUrl(trackId),
  };
}

export const ytMusicAdapter: PlatformAdapter = {
  id: "ytmusic",

  isPlayerPage() {
    return (
      location.hostname === "music.youtube.com" &&
      location.pathname.startsWith("/watch")
    );
  },

  async getTrackMeta() {
    const trackId = getTrackIdFromURL();

    if (!trackId) {
      return null;
    }

    const waitForPlayerMeta = async (): Promise<TrackMeta> => {
      const startedAt = Date.now();

      while (Date.now() - startedAt < 1500) {
        const fallbackMeta = getFallbackTrackMeta(trackId);

        if (
          fallbackMeta.title &&
          fallbackMeta.title !== document.title &&
          fallbackMeta.title !== "YouTube Music"
        ) {
          return fallbackMeta;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 100));
      }

      return getFallbackTrackMeta(trackId);
    };

    return waitForPlayerMeta();
  },

  onTrackChange(cb) {
    const getMetadataSignature = () => {
      const { title, artistName, albumName } = readPlayerMeta();
      return [getTrackIdFromURL() ?? "", title, artistName, albumName].join(
        "|",
      );
    };

    let lastSignature = getMetadataSignature();

    const notifyIfChanged = () => {
      const nextSignature = getMetadataSignature();

      if (nextSignature !== lastSignature) {
        lastSignature = nextSignature;
        cb();
      }
    };

    const observer = new MutationObserver(notifyIfChanged);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const intervalId = window.setInterval(notifyIfChanged, 500);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
    };
  },

  getMediaElement() {
    return getMainVideoElement();
  },

  getCurrentTime() {
    return getMainVideoElement()?.currentTime || 0;
  },

  isPaused() {
    return getMainVideoElement()?.paused ?? true;
  },

  togglePlay() {
    const media = getMainVideoElement();

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
    document
      .querySelector<HTMLButtonElement>(
        'ytmusic-player-bar button[aria-label="Next"]',
      )
      ?.click();
  },

  prevTrack() {
    const prevButton = document.querySelector<HTMLButtonElement>(
      'ytmusic-player-bar button[aria-label="Previous"]',
    );

    if (prevButton) {
      prevButton.click();
      return;
    }

    const media = getMainVideoElement();

    if (media) {
      media.currentTime = 0;
    }
  },

  setVolume(value: number) {
    const media = getMainVideoElement();

    if (media) {
      media.volume = normalizeVolume(value);
    }
  },

  getVolume() {
    return getMainVideoElement()?.volume ?? 1;
  },

  isAdShowing() {
    return !!document.querySelector(".html5-video-player.ad-showing");
  },

  captureVideoStream() {
    return captureVideoStreamFromElement(getMainVideoElement());
  },
};