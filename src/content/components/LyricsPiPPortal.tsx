import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LyricsContent } from "./LyricsContent";
import { PIP_WINDOW_WIDTH } from "../constants/ui";
import { LyricsState, LyricLine, Settings, ThemeVars } from "../../shared/types";

interface LyricsPiPPortalProps {
  pipRoot: HTMLElement | null;
  lyricsState: LyricsState;
  syncedLines: LyricLine[];
  activeIndex: number;
  settings: Settings | null;
  themeVars: ThemeVars;
}

export default function LyricsPiPPortal({
  pipRoot,
  lyricsState,
  syncedLines,
  activeIndex,
  settings,
  themeVars,
}: LyricsPiPPortalProps): React.JSX.Element | null {
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [contentSize, setContentSize] = useState({
    width: Math.max(80, PIP_WINDOW_WIDTH - 32),
    height: 0,
  });

  const pipBgOpacity = Math.max(
    0.3,
    Math.min(1, Number((settings?.backgroundOpacity ?? 88) / 100)),
  );

  useEffect(() => {
    const element = bodyRef.current;
    if (!element) return;

    const updateSize = () => {
      const styles = window.getComputedStyle(element);
      const paddingX =
        parseFloat(styles.paddingLeft || "0") +
        parseFloat(styles.paddingRight || "0");

      setContentSize({
        width: Math.max(80, element.clientWidth - paddingX),
        height: Math.max(0, element.clientHeight),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [pipRoot]);

  useEffect(() => {
    if (activeIndex < 0) return;
    activeLineRef.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [activeIndex]);

  if (!pipRoot) return null;

  return createPortal(
    <div
      className="pip-shell"
      style={{
        "--pip-bg-opacity": pipBgOpacity,
        ...Object.fromEntries(Object.entries(themeVars).map(([k, v]) => [k, v])),
      } as React.CSSProperties}
    >
      <div className="pip-body" ref={bodyRef}>
        <LyricsContent
          classPrefix="pip"
          lyricsState={lyricsState}
          syncedLines={syncedLines}
          activeIndex={activeIndex}
          settings={settings}
          activeLineRef={activeLineRef}
          contentWidthPx={contentSize.width}
          // @ts-ignore
          contentHeightPx={contentSize.height}
        />
      </div>
    </div>,
    pipRoot,
  );
}
