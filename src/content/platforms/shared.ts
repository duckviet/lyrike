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