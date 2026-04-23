import { useEffect, useState } from "react";

/**
 * Captures the stream from the YouTube video element.
 * @param enabled Whether the capture is active.
 * @returns The captured MediaStream or null.
 */
export function useVideoStream(
  enabled: boolean,
  videoId?: string | null,
): MediaStream | null {
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled || !videoId) {
      return;
    }

    const video = document.querySelector("video");
    if (!video) {
      console.warn("[Lyrics] No video element found to capture stream.");
      return;
    }

    try {
      // Capture at 15 FPS for better performance
      const videoWithCapture = video as HTMLVideoElement & {
        captureStream?(fps: number): MediaStream;
      };

      const nextStream: MediaStream | null = videoWithCapture.captureStream
        ? videoWithCapture.captureStream(15)
        : null;

      if (nextStream) {
        requestAnimationFrame(() => {
          setStream((oldStream) => {
            if (oldStream) {
              oldStream.getTracks().forEach((track) => track.stop());
            }
            return nextStream;
          });
        });
      } else {
        console.warn(
          "[Lyrics] video.captureStream is not supported in this browser.",
        );
      }
    } catch (error: unknown) {
      console.error("[Lyrics] Failed to capture video stream:", error);
      requestAnimationFrame(() => {
        setStream(null);
      });
    }

    return () => {
      setStream((oldStream) => {
        if (oldStream) {
          oldStream.getTracks().forEach((track) => track.stop());
        }
        return null;
      });
    };
  }, [enabled, videoId]);

  return stream;
}
