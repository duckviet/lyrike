import { useEffect, useRef, useState } from "react";
import { usePlatform } from "../PlatformContext";

function isStreamHealthy(stream: MediaStream | null): boolean {
  if (!stream || !stream.active) {
    return false;
  }

  const videoTracks = stream.getVideoTracks();
  return videoTracks.length > 0 && videoTracks.some((t) => t.readyState === "live");
}

/**
 * Captures the stream from the main video element for PiP background.
 * Avoids capturing YouTube ads. When an ad is showing, the stream is cleared.
 * Automatically recaptures when tracks change, sources reset, or stream ends.
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

    if (!enabled) {
      stopCurrentStream();
      return;
    }

    let cancelled = false;
    let lastCapturedVideo: HTMLVideoElement | null = null;
    let lastCapturedSrc: string = "";
    let recaptureTimer: number | null = null;
    let boundVideo: HTMLVideoElement | null = null;

    const detachVideoListeners = (video: HTMLVideoElement | null) => {
      if (!video) return;
      video.removeEventListener("emptied", onVideoReset);
      video.removeEventListener("loadstart", onVideoReset);
      video.removeEventListener("loadeddata", onVideoReady);
      video.removeEventListener("canplay", onVideoReady);
      video.removeEventListener("playing", onVideoReady);
    };

    const scheduleRecapture = (delay = 200) => {
      if (cancelled || !enabled) return;

      if (recaptureTimer !== null) {
        window.clearTimeout(recaptureTimer);
      }

      recaptureTimer = window.setTimeout(() => {
        recaptureTimer = null;
        captureCurrentVideo();
      }, delay);
    };

    const onVideoReset = () => {
      // Media element is resetting/loading for a new track
      scheduleRecapture(250);
    };

    const onVideoReady = () => {
      // Media element now has frames ready or started playing
      if (
        !isStreamHealthy(streamRef.current) ||
        (boundVideo && (boundVideo.currentSrc || boundVideo.src) !== lastCapturedSrc)
      ) {
        scheduleRecapture(50);
      }
    };

    const attachVideoListeners = (video: HTMLVideoElement) => {
      if (boundVideo === video) return;
      detachVideoListeners(boundVideo);
      boundVideo = video;

      video.addEventListener("emptied", onVideoReset);
      video.addEventListener("loadstart", onVideoReset);
      video.addEventListener("loadeddata", onVideoReady);
      video.addEventListener("canplay", onVideoReady);
      video.addEventListener("playing", onVideoReady);
    };

    const captureCurrentVideo = () => {
      if (cancelled || !enabled) {
        return;
      }

      if (platform.isAdShowing?.()) {
        lastCapturedVideo = null;
        lastCapturedSrc = "";
        stopCurrentStream();
        return;
      }

      const media = platform.getMediaElement();

      if (!media || !(media instanceof HTMLVideoElement)) {
        stopCurrentStream();
        return;
      }

      attachVideoListeners(media);

      const currentSrc = media.currentSrc || media.src || "";
      const isHealthy = isStreamHealthy(streamRef.current);
      const isSameVideoAndSrc =
        media === lastCapturedVideo &&
        currentSrc === lastCapturedSrc &&
        lastCapturedSrc !== "";

      if (isSameVideoAndSrc && isHealthy) {
        return;
      }

      // If video has not loaded current frame data yet, wait and retry
      if (media.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        scheduleRecapture(150);
        return;
      }

      const nextStream = platform.captureVideoStream?.() ?? null;

      if (!nextStream || !isStreamHealthy(nextStream)) {
        scheduleRecapture(250);
        return;
      }

      lastCapturedVideo = media;
      lastCapturedSrc = currentSrc;

      // Listen for when this stream's tracks end (e.g. video source detached/reset)
      nextStream.getVideoTracks().forEach((track) => {
        track.addEventListener(
          "ended",
          () => {
            scheduleRecapture(100);
          },
          { once: true },
        );
      });

      setStream((oldStream) => {
        if (oldStream && oldStream !== nextStream) {
          oldStream.getTracks().forEach((track) => track.stop());
        }

        streamRef.current = nextStream;
        return nextStream;
      });
    };

    // Initial capture attempt
    scheduleRecapture(0);

    const unsubscribeTrackChange = platform.onTrackChange?.(() => {
      scheduleRecapture(100);
    });

    /**
     * YouTube toggles .ad-showing on .html5-video-player.
     */
    const player = document.querySelector(".html5-video-player");
    const mutationObserver = new MutationObserver(() => {
      if (platform.isAdShowing?.()) {
        lastCapturedVideo = null;
        lastCapturedSrc = "";
        stopCurrentStream();
      } else {
        scheduleRecapture(200);
      }
    });

    if (player) {
      mutationObserver.observe(player, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    /**
     * Fallback polling in case transitions occur without DOM mutation/events
     */
    const intervalId = window.setInterval(() => {
      if (platform.isAdShowing?.()) {
        lastCapturedVideo = null;
        lastCapturedSrc = "";
        stopCurrentStream();
        return;
      }

      const currentVideo = platform.getMediaElement();
      if (!(currentVideo instanceof HTMLVideoElement)) {
        return;
      }

      const currentSrc = currentVideo.currentSrc || currentVideo.src || "";
      const healthy = isStreamHealthy(streamRef.current);

      if (
        !healthy ||
        currentVideo !== lastCapturedVideo ||
        (currentSrc && currentSrc !== lastCapturedSrc)
      ) {
        captureCurrentVideo();
      }
    }, 1000);

    return () => {
      cancelled = true;

      if (recaptureTimer !== null) {
        window.clearTimeout(recaptureTimer);
      }

      detachVideoListeners(boundVideo);
      boundVideo = null;

      if (unsubscribeTrackChange) {
        unsubscribeTrackChange();
      }

      mutationObserver.disconnect();
      window.clearInterval(intervalId);
      stopCurrentStream();
    };
  }, [enabled, platform, videoId]);

  return stream;
}
