import React, { useMemo } from "react";
import { getVisibleLines } from "./lyricsUtils";

export function LyricsContent({
  classPrefix,
  lyricsState,
  syncedLines,
  activeIndex,
  settings,
  activeLineRef,
  loadingTextMarginTop,
}) {
  const hasSynced = syncedLines.length > 0;
  const hasPlain = !!lyricsState.data?.plainLyrics;

  const fontFamily =
    settings?.fontFamily ||
    "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  const textSize = settings?.textSize || 15;
  const activeTextSize = settings?.activeTextSize || 16;
  const activeFontWeight = settings?.activeFontWeight || 600;
  const inactiveOpacity = settings?.inactiveOpacity || 0.44;
  const visibleLineCount = settings?.visibleLineCount || 5;
  const slideDurationSec = Math.min(
    0.8,
    Math.max(0.2, Number(settings?.lyricSlideDurationSec ?? 0.5)),
  );
  const accentDurationSec = Math.max(
    0.2,
    Math.min(0.4, slideDurationSec * 0.7),
  );

  const visibleLines = useMemo(
    () => getVisibleLines(syncedLines, activeIndex, visibleLineCount),
    [syncedLines, activeIndex, visibleLineCount],
  );

  const maxLineFontSize = Math.max(textSize, activeTextSize);
  const lineHeight = 1.6;
  const baseLineHeight = Math.ceil(maxLineFontSize * lineHeight);
  const lineGap = classPrefix === "pip" ? 8 : 10;
  const slotHeight = baseLineHeight + lineGap;
  const viewportHeight = Math.max(1, visibleLineCount) * slotHeight - lineGap;

  return (
    <>
      {lyricsState.loading && (
        <div className={`${classPrefix}-status`}>
          <div className={`${classPrefix}-loading-dots`}>
            <span />
            <span />
            <span />
          </div>
          <div
            className={`${classPrefix}-status-text`}
            style={
              loadingTextMarginTop
                ? { marginTop: loadingTextMarginTop }
                : undefined
            }
          >
            Đang tìm lyric...
          </div>
        </div>
      )}

      {!lyricsState.loading && !lyricsState.data && (
        <div className={`${classPrefix}-status`}>
          <div className={`${classPrefix}-status-text`}>
            {lyricsState.error
              ? `Lỗi: ${lyricsState.error}`
              : "Không có lyric cho bài này."}
          </div>
        </div>
      )}

      {!lyricsState.loading && lyricsState.data && hasSynced && (
        <div
          className={`${classPrefix}-lines`}
          style={{
            fontFamily,
            position: "relative",
            display: "block",
            height: `${viewportHeight}px`,
            overflow: "hidden",
          }}
        >
          {visibleLines.map((line, slotIndex) => {
            const originalIndex = syncedLines.indexOf(line);
            const isActive = originalIndex === activeIndex;

            return (
              <div
                key={`${line.time}-${originalIndex}`}
                ref={isActive ? activeLineRef : null}
                className={`${classPrefix}-line ${isActive ? "active" : ""}`}
                style={{
                  fontSize: isActive ? activeTextSize : textSize,
                  fontWeight: isActive ? activeFontWeight : 400,
                  opacity: isActive ? 1 : inactiveOpacity,
                  minHeight: `${baseLineHeight}px`,
                  lineHeight,
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  transform: `translateY(${slotIndex * slotHeight}px)`,
                  willChange: "transform, opacity",
                  transition: `transform ${slideDurationSec}s cubic-bezier(0.22, 1, 0.36, 1), opacity ${accentDurationSec}s ease, color ${accentDurationSec}s ease, text-shadow ${accentDurationSec}s ease`,
                }}
              >
                {line.text || "♪"}
              </div>
            );
          })}
        </div>
      )}

      {!lyricsState.loading && lyricsState.data && !hasSynced && hasPlain && (
        <div className={`${classPrefix}-lines`} style={{ fontFamily }}>
          {lyricsState.data.plainLyrics.split("\n").map((line, index) => (
            <div
              key={index}
              className={`${classPrefix}-line plain`}
              style={{ fontSize: textSize, lineHeight: 1.6 }}
            >
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      )}

      {!lyricsState.loading && lyricsState.data && !hasSynced && !hasPlain && (
        <div className={`${classPrefix}-status`}>
          <div className={`${classPrefix}-status-text`}>
            Provider không có lyric usable.
          </div>
        </div>
      )}

      {!!lyricsState.data && (
        <div className={`${classPrefix}-footer`}>
          LRCLIB{" "}
          {lyricsState.data.albumName &&
            `• Album: ${lyricsState.data.albumName}`}
        </div>
      )}
    </>
  );
}
