import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LyricsContent } from "./LyricsContent";
import { PIP_WINDOW_HEIGHT, PIP_WINDOW_WIDTH } from "../constants/ui";
import { LyricsState, LyricLine, Settings, ThemeVars } from "../shared/types";

interface LyricsPiPPortalProps {
  pipRoot: HTMLElement | null;
  lyricsState: LyricsState;
  syncedLines: LyricLine[];
  activeIndex: number;
  settings: Settings | null;
  themeVars: ThemeVars;
  thumbnail?: string;
  videoStream?: MediaStream;
}

export default function LyricsPiPPortal({
  pipRoot,
  lyricsState,
  syncedLines,
  activeIndex,
  settings,
  themeVars,
  thumbnail,
  videoStream,
}: LyricsPiPPortalProps): React.JSX.Element | null {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [contentSize, setContentSize] = useState({
    width: Math.max(80, PIP_WINDOW_WIDTH - 32),
    height: Math.max(1, PIP_WINDOW_HEIGHT - 32),
  });

  const pipBgOpacity = Math.max(
    0.3,
    Math.min(1, Number((settings?.backgroundOpacity ?? 88) / 100)),
  );

  useEffect(() => {
    const element = bodyRef.current;
    if (!element) return;

    const ownerWindow = element.ownerDocument.defaultView ?? window;

    const updateSize = () => {
      const styles = ownerWindow.getComputedStyle(element);
      const paddingX =
        parseFloat(styles.paddingLeft || "0") +
        parseFloat(styles.paddingRight || "0");
      const paddingY =
        parseFloat(styles.paddingTop || "0") +
        parseFloat(styles.paddingBottom || "0");

      setContentSize({
        width: Math.max(80, element.clientWidth - paddingX),
        height: Math.max(1, element.clientHeight - paddingY),
      });
    };

    updateSize();

    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? ResizeObserver;
    const observer = new ResizeObserverCtor(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [pipRoot]);

  if (!pipRoot) return null;

  const showVideo = !!(settings?.pipShowVideoBackground && videoStream);
  const showThumbnail = !!(settings?.pipShowThumbnailBackground && thumbnail);

  return createPortal(
    <div
      className="h-full flex flex-col overflow-hidden bg-linear-to-b from-[#23232a]/[var(--pip-bg-opacity)] to-[#0f0f12]/[var(--pip-bg-opacity)] shadow-[inset_0_1_0_rgba(255,255,255,0.03),inset_0_0_0_1px_rgba(255,255,255,0.08),0_24px_52px_rgba(0,0,0,0.22),0_0_0_1px_rgba(255,255,255,0.14),0_0_28px_rgba(180,160,255,0.22)]"
      style={
        {
          "--pip-bg-opacity": showVideo || showThumbnail ? 0 : pipBgOpacity,
          ...themeVars,
        } as React.CSSProperties
      }
    >
      {showVideo ? (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <video
            ref={(el) => {
              if (el && el.srcObject !== videoStream) {
                el.srcObject = videoStream;
              }
            }}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover blur-[20px] scale-110 opacity-70"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ) : showThumbnail ? (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <img
            src={thumbnail}
            className="w-full h-full object-cover blur-[20px] scale-110 opacity-70"
            alt=""
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ) : null}
      <div
        className="h-full p-[14px_14px_16px_18px] relative min-h-0 overflow-y-auto yl-scrollbar"
        ref={bodyRef}
      >
        <LyricsContent
          lyricsState={lyricsState}
          syncedLines={syncedLines}
          activeIndex={activeIndex}
          settings={settings}
          contentWidthPx={contentSize.width}
          contentHeightPx={contentSize.height}
        />
      </div>
    </div>,
    pipRoot,
  );
}
