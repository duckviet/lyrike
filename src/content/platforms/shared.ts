export function normalizeVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getVideoThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function getMainVideoElement(): HTMLVideoElement | null {
  const preferredSelectors = [
    "video.html5-main-video",
    "video.video-stream.html5-main-video",
    "ytmusic-player video.html5-main-video",
    "ytmusic-player video.video-stream.html5-main-video",
  ];

  for (const selector of preferredSelectors) {
    const element = document.querySelector<HTMLVideoElement>(selector);
    if (element) {
      return element;
    }
  }

  const videos = Array.from(
    document.querySelectorAll<HTMLVideoElement>("video"),
  );

  if (videos.length === 0) {
    return null;
  }

  const visibleMainVideo = videos.find((video) => {
    const rect = video.getBoundingClientRect();

    return (
      rect.width > 100 &&
      rect.height > 100 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    );
  });

  return visibleMainVideo ?? videos[0] ?? null;
}

export function queryText(selectors: string[]): string {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.textContent?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

export function getBestMediaElement(): HTMLVideoElement | HTMLAudioElement | null {
  const mainVideo = getMainVideoElement();
  if (mainVideo) {
    return mainVideo;
  }

  const mediaElements = Array.from(
    document.querySelectorAll<HTMLMediaElement>("video, audio"),
  );

  if (mediaElements.length === 0) {
    return null;
  }

  const visibleMedia = mediaElements.filter((media) => {
    const rect = media.getBoundingClientRect();

    return (
      rect.width > 100 &&
      rect.height > 100 &&
      media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    );
  });

  return visibleMedia[0] ?? mediaElements[0] ?? null;
}

function parseClockDurationSec(raw: string): number | undefined {
  const cleaned = raw.trim();
  if (!/^\d{1,2}(?::\d{2}){1,2}$/.test(cleaned)) return undefined;
  const parts = cleaned.split(":").map(Number);
  const seconds =
    parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
  return seconds > 0 && seconds <= 3600 ? seconds : undefined;
}

export function getMediaDurationSec(): number | undefined {
  const isAd =
    typeof document !== "undefined" &&
    !!document.querySelector(".html5-video-player.ad-showing");

  if (!isAd) {
    const rawDuration = getBestMediaElement()?.duration;
    if (
      typeof rawDuration === "number" &&
      Number.isFinite(rawDuration) &&
      rawDuration > 0 &&
      rawDuration <= 3600
    ) {
      return Math.round(rawDuration);
    }

    const ytDurationText = queryText([".ytp-time-duration"]);
    const parsedYt = ytDurationText
      ? parseClockDurationSec(ytDurationText)
      : undefined;
    if (parsedYt) return parsedYt;

    const ytmTimeInfo = queryText(["ytmusic-player-bar .time-info"]);
    const totalPart = ytmTimeInfo.split("/")[1];
    const parsedYtm = totalPart ? parseClockDurationSec(totalPart) : undefined;
    if (parsedYtm) return parsedYtm;
  }

  return undefined;
}

export function captureVideoStreamFromElement(
  mediaElement: HTMLVideoElement | HTMLAudioElement | null,
): MediaStream | null {
  if (!mediaElement || !(mediaElement instanceof HTMLVideoElement)) {
    return null;
  }

  try {
    const videoWithCapture = mediaElement as HTMLVideoElement & {
      captureStream?(fps?: number): MediaStream;
      mozCaptureStream?(fps?: number): MediaStream;
    };

    return (
      videoWithCapture.captureStream?.(15) ??
      videoWithCapture.mozCaptureStream?.(15) ??
      null
    );
  } catch {
    return null;
  }
}

export function createTrackChangeSubscription(
  getTrackId: () => string | null,
  cb: () => void,
): () => void {
  let currentTrackId = getTrackId();

  const notifyIfChanged = () => {
    const nextTrackId = getTrackId();

    if (nextTrackId !== currentTrackId) {
      currentTrackId = nextTrackId;
      cb();
    }
  };

  const observer = new MutationObserver(notifyIfChanged);

  if (document.head) {
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  window.addEventListener("popstate", notifyIfChanged);

  const intervalId = window.setInterval(notifyIfChanged, 500);

  return () => {
    observer.disconnect();
    window.removeEventListener("popstate", notifyIfChanged);
    window.clearInterval(intervalId);
  };
}