import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LyricsContent } from "./LyricsContent";
import { PIP_WINDOW_HEIGHT, PIP_WINDOW_WIDTH } from "../constants/ui";
import { LyricsState, LyricLine, Settings, ThemeVars } from "../shared/types";
import { PiPActionBar } from "./PiPActionBar";
import { PiPSplitInfoPanel } from "./PiPSplitInfoPanel";
import { usePiPHover } from "../hooks/usePiPHover";

interface LyricsPiPPortalProps {
  pipRoot: HTMLElement | null;
  lyricsState: LyricsState;
  syncedLines: LyricLine[];
  activeIndex: number;
  playbackTime: number;
  settings: Settings | null;
  themeVars: ThemeVars;
  thumbnail?: string;
  artist?: string;
  title?: string;
  lyricsId?: number;
  videoId?: string;
  videoStream?: MediaStream;
  playerControls: {
    isPaused: boolean;
    volume: number;
    offset: number;
    togglePlay: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    setVolume: (v: number) => void;
    adjustOffset: (d: number) => void;
  };
}

export default function LyricsPiPPortal({
  pipRoot,
  lyricsState,
  syncedLines,
  activeIndex,
  playbackTime,
  settings,
  themeVars,
  thumbnail,
  artist,
  title,
  lyricsId,
  videoId,
  videoStream,
  playerControls,
}: LyricsPiPPortalProps): React.JSX.Element | null {
  const { isHovered, showHover, startAutoHideTimer } = usePiPHover(pipRoot);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    // e.clientY trong PiP window là toạ độ tính từ top của PiP viewport
    const fromBottom = el.clientHeight - e.clientY;

    if (fromBottom <= 32) {
      showHover();
    } else if (isHovered) {
      // Đang hiện mà di ra khỏi vùng đáy → hẹn giờ ẩn
      startAutoHideTimer(800);
    }
  };

  const [contentSize, setContentSize] = useState({
    width: Math.max(80, PIP_WINDOW_WIDTH - 32),
    height: Math.max(1, PIP_WINDOW_HEIGHT - 32),
  });
  const [pipWidth, setPipWidth] = useState(PIP_WINDOW_WIDTH);

  const pipBgOpacity = Math.max(
    0.3,
    Math.min(1, Number((settings?.backgroundOpacity ?? 88) / 100)),
  );

  const showVideo = !!(settings?.pipBackgroundMode === "video" && videoStream);
  const showThumbnail = !!(
    settings?.pipBackgroundMode === "thumbnail" && thumbnail
  );

  const isSplitLayout = settings?.pipLayoutMode === "split";
  const collapseWidth = Math.max(
    320,
    Number(settings?.pipInfoCollapseWidth ?? 400),
  );
  const showInfoPanel = isSplitLayout && pipWidth >= collapseWidth;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const ownerWindow = element.ownerDocument.defaultView ?? window;

    const updateSize = () => {
      setPipWidth(Math.max(1, element.clientWidth));
    };

    updateSize();

    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? ResizeObserver;
    const observer = new ResizeObserverCtor(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [pipRoot]);

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
        width: Math.max(50, element.clientWidth - paddingX),
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
  }, [pipRoot, settings?.pipLayoutMode, showInfoPanel]);

  if (!pipRoot) return null;

  return createPortal(
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={
        {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          "--pip-bg-opacity": showVideo || showThumbnail ? 0 : pipBgOpacity,
          // Nếu có video/ảnh nền thì làm trong suốt hoàn toàn các biến màu nền
          "--color-bg-primary":
            showVideo || showThumbnail
              ? "transparent"
              : themeVars["--color-bg-primary"],
          "--color-bg-secondary":
            showVideo || showThumbnail
              ? "transparent"
              : themeVars["--color-bg-secondary"],
          background:
            showVideo || showThumbnail
              ? "transparent"
              : "linear-gradient(to bottom, var(--color-bg-primary, rgba(35, 35, 42, var(--pip-bg-opacity))), var(--color-bg-secondary, rgba(15, 15, 18, var(--pip-bg-opacity))))",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.03), inset 0 0 0 1px rgba(255,255,255,0.08), 0 24px 52px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.14), var(--shadow-glow, 0 0 28px rgba(180,160,255,0.22))",
          ...themeVars,
        } as React.CSSProperties
      }
    >
      {showVideo ? (
        <div className="absolute inset-0 z-below overflow-hidden pointer-events-none">
          <video
            ref={(el) => {
              if (!el) return;

              if (el.srcObject !== videoStream) {
                el.srcObject = videoStream ?? null;
              }
            }}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover blur-bg opacity-70"
          />

          <div
            className="absolute inset-0"
            style={{ background: "rgba(0, 0, 0, 0.2)" }}
          />
        </div>
      ) : showThumbnail ? (
        <div className="absolute inset-0 z-below overflow-hidden pointer-events-none">
          <img
            src={thumbnail}
            className="w-full h-full object-cover blur-bg opacity-70"
            alt=""
          />
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0, 0, 0, 0.2)" }}
          />
        </div>
      ) : null}

      {isSplitLayout ? (
        <div
          style={{
            height: "100%",
            minHeight: 0,
            display: "flex",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {showInfoPanel ? (
            <div
              style={{
                minHeight: 0,
                flex: "1 1 0%",
                paddingInline: 16,
              }}
            >
              <PiPSplitInfoPanel
                thumbnail={thumbnail}
                title={title}
                artist={artist}
                lyricsId={lyricsId}
                playerControls={playerControls}
              />
            </div>
          ) : null}

          <div
            style={{
              height: "100%",
              minHeight: 0,
              minWidth: 0,
              overflowY: "auto",
              overflowX: "hidden",
              flex: showInfoPanel ? "2 1 0%" : "1 1 auto",
              padding: showInfoPanel
                ? "14px 20px 16px 0px"
                : "14px 14px 16px 18px",
            }}
            ref={bodyRef}
          >
            <LyricsContent
              lyricsState={lyricsState}
              syncedLines={syncedLines}
              activeIndex={activeIndex}
              playbackTime={playbackTime}
              settings={settings}
              contentWidthPx={contentSize.width}
              contentHeightPx={contentSize.height}
            />
          </div>

          <PiPActionBar
            isVisible={isHovered}
            playerControls={playerControls}
            lyricsId={lyricsId}
            artist={artist}
            title={title}
            videoId={videoId}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              height: "100%",
              minHeight: 0,
              padding: "14px 14px 16px 18px",
              overflowY: "auto",
              overflowX: "hidden",
            }}
            ref={bodyRef}
          >
            <LyricsContent
              lyricsState={lyricsState}
              syncedLines={syncedLines}
              activeIndex={activeIndex}
              playbackTime={playbackTime}
              settings={settings}
              contentWidthPx={contentSize.width}
              contentHeightPx={contentSize.height}
            />
          </div>

          <PiPActionBar
            isVisible={isHovered}
            playerControls={playerControls}
            lyricsId={lyricsId}
            artist={artist}
            title={title}
            videoId={videoId}
          />
        </>
      )}
    </div>,
    pipRoot,
  );
}
