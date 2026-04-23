import { useCallback, useEffect, useRef, useState } from "react";
import {
  PIP_WINDOW_HEIGHT,
  PIP_WINDOW_WIDTH,
} from "../constants/ui";
import { PIP_CSS } from "../pipStyles";
import { preparePiPDocument } from "../utils/pipWindow";

/**
 * Manages Picture-in-Picture window for lyrics display.
 */
export function useLyricsPiP(): {
  pipRoot: HTMLElement | null;
  isPiPOpen: boolean;
  openLyricsPiP: () => Promise<void>;
  closeLyricsPiP: () => void;
} {
  const pipWindowRef = useRef<Window | null>(null);
  const [pipRoot, setPipRoot] = useState<HTMLElement | null>(null);
  const [isPiPOpen, setIsPiPOpen] = useState<boolean>(false);

  const resetPiPState = useCallback(() => {
    pipWindowRef.current = null;
    setPipRoot(null);
    setIsPiPOpen(false);
  }, []);

  const openLyricsPiP = useCallback(async () => {
    if (!window.documentPictureInPicture?.requestWindow) {
      alert(
        "Trình duyệt hiện tại chưa hỗ trợ Document " +
          "Picture-in-Picture.",
      );
      return;
    }

    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }

    try {
      const pipWindow =
        await window.documentPictureInPicture.requestWindow({
          width: PIP_WINDOW_WIDTH,
          height: PIP_WINDOW_HEIGHT,
        });

      const root = preparePiPDocument(pipWindow, PIP_CSS);

      pipWindowRef.current = pipWindow;
      setPipRoot(root);
      setIsPiPOpen(true);

      pipWindow.addEventListener("pagehide", resetPiPState, {
        once: true,
      });
    } catch (error) {
      console.error("[Lyrics] Failed to open PiP window:", error);
      resetPiPState();
    }
  }, [resetPiPState]);

  const closeLyricsPiP = useCallback(() => {
    const pipWindow = pipWindowRef.current;

    if (pipWindow && !pipWindow.closed) {
      pipWindow.close();
    }

    resetPiPState();
  }, [resetPiPState]);

  useEffect(() => {
    return () => {
      closeLyricsPiP();
    };
  }, [closeLyricsPiP]);

  return {
    pipRoot,
    isPiPOpen,
    openLyricsPiP,
    closeLyricsPiP,
  };
}