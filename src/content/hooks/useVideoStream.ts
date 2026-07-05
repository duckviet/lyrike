import { useEffect, useRef, useState } from "react";
import { usePlatform } from "../PlatformContext";

/**
 * Captures the stream from the main YouTube video element.
 * Avoids capturing YouTube ads. When an ad is showing, the stream is cleared
 * so the PiP background will not keep the last ad frame.
 */
export function useVideoStream(
  enabled: boolean,
  videoId?: string | null,
): MediaStream | null {
  const platform = usePlatform();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    const stopCurrentStream = () => {
      setStream((oldStream) => {
        if (oldStream) {
          oldStream.getTracks().forEach((track) => track.stop());
        }

        streamRef.current = null;
        return null;
      });
    };

    if (!enabled || !videoId) {
      stopCurrentStream();
      return;
    }

    let cancelled = false;
    let lastCapturedVideo: HTMLVideoElement | null = null;
    let recaptureTimer: number | null = null;

    const captureCurrentVideo = () => {
      if (cancelled || !enabled || !videoId) {
        return;
      }

      if (platform.isAdShowing?.()) {
        lastCapturedVideo = null;
        stopCurrentStream();
        return;
      }

      const video = platform.getMediaElement();

      if (!video) {
        console.warn("[Lyrics] No video element found to capture stream.");
        stopCurrentStream();
        return;
      }

      if (!(video instanceof HTMLVideoElement)) {
        stopCurrentStream();
        return;
      }

      if (video === lastCapturedVideo && streamRef.current) {
        return;
      }

      const nextStream = platform.captureVideoStream?.() ?? null;

      if (!nextStream) {
        console.warn(
          "[Lyrics] video.captureStream is not supported in this browser.",
        );
        stopCurrentStream();
        return;
      }

      lastCapturedVideo = video;

      setStream((oldStream) => {
        if (oldStream && oldStream !== nextStream) {
          oldStream.getTracks().forEach((track) => track.stop());
        }

        streamRef.current = nextStream;
        return nextStream;
      });
    };

    const scheduleRecapture = () => {
      if (recaptureTimer !== null) {
        window.clearTimeout(recaptureTimer);
      }

      recaptureTimer = window.setTimeout(() => {
        recaptureTimer = null;
        captureCurrentVideo();
      }, 300);
    };

    captureCurrentVideo();

    /**
     * YouTube toggles .ad-showing on .html5-video-player.
     * When this class appears: clear the stream immediately.
     * When it disappears: recapture the real video.
     */
    const player = document.querySelector(".html5-video-player");
    const mutationObserver = new MutationObserver(() => {
      if (platform.isAdShowing?.()) {
        lastCapturedVideo = null;
        stopCurrentStream();
      } else {
        scheduleRecapture();
      }
    });

    if (player) {
      mutationObserver.observe(player, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    /**
     * Fallback polling because YouTube may replace DOM nodes without a clean
     * mutation on the old player/video element.
     */
    const intervalId = window.setInterval(() => {
      if (platform.isAdShowing?.()) {
        lastCapturedVideo = null;
        stopCurrentStream();
        return;
      }

      const currentVideo = platform.getMediaElement();

      if (!streamRef.current || currentVideo !== lastCapturedVideo) {
        captureCurrentVideo();
      }
    }, 1000);

    return () => {
      cancelled = true;

      if (recaptureTimer !== null) {
        window.clearTimeout(recaptureTimer);
      }

      mutationObserver.disconnect();
      window.clearInterval(intervalId);
      stopCurrentStream();
    };
  }, [enabled, platform, videoId]);
  return stream;
}
