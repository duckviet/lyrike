import { useState, useEffect, useRef, useCallback } from "react";

export function usePiPHover(pipRoot: HTMLElement | null) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const showHover = useCallback(() => {
    clearTimer();
    setIsHovered(true);
  }, [clearTimer]);

  const hideHover = useCallback(() => {
    clearTimer();
    setIsHovered(false);
  }, [clearTimer]);

  const handlePointerLeave = useCallback(() => {
    hideHover();
  }, [hideHover]);

  const handleBlur = useCallback(() => {
    hideHover();
  }, [hideHover]);

  useEffect(() => {
    if (!pipRoot) return;
    const pipDoc = pipRoot.ownerDocument;
    const pipWin = pipDoc.defaultView;
    if (!pipWin) return;

    const handleVisibilityChange = () => {
      if (pipDoc.hidden) {
        hideHover();
      }
    };

    pipDoc.documentElement.addEventListener("pointerleave", handlePointerLeave);
    pipWin.addEventListener("blur", handleBlur);
    pipDoc.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      pipDoc.documentElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      pipWin.removeEventListener("blur", handleBlur);
      pipDoc.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimer();
    };
  }, [pipRoot, handlePointerLeave, handleBlur, clearTimer, hideHover]);

  const startAutoHideTimer = useCallback(
    (duration = 2500) => {
      clearTimer();
      hoverTimerRef.current = window.setTimeout(() => {
        setIsHovered(false);
      }, duration);
    },
    [clearTimer],
  );

  return {
    isHovered,
    showHover,
    hideHover,
    startAutoHideTimer,
    clearTimer,
  };
}
