import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LyricsContent } from "./LyricsContent";

export default function LyricsPiPPortal({
  pipRoot,
  lyricsState,
  syncedLines,
  activeIndex,
  settings,
}) {
  const activeLineRef = useRef(null);
  const pipBgOpacity = Math.max(
    0.3,
    Math.min(1, Number((settings?.backgroundOpacity ?? 88) / 100)),
  );

  useEffect(() => {
    if (activeIndex < 0) return;
    activeLineRef.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [activeIndex]);

  if (!pipRoot) return null;

  return createPortal(
    <div className="pip-shell" style={{ "--pip-bg-opacity": pipBgOpacity }}>
      <div className="pip-body">
        <LyricsContent
          classPrefix="pip"
          lyricsState={lyricsState}
          syncedLines={syncedLines}
          activeIndex={activeIndex}
          settings={settings}
          activeLineRef={activeLineRef}
        />
      </div>
    </div>,
    pipRoot,
  );
}
