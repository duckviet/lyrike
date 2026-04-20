import React, { useEffect, useMemo, useState, RefObject } from "react";
import { LyricsLines } from "./LyricsLines";
import {
  LyricsState,
  LyricLine,
  Settings,
  PreparedLyricLine,
} from "../shared/types";
import {
  getLineHeightPx,
  safePrepare,
  measureLineHeight,
} from "../utils/lyricsUtils";
import { MeasuredSlot } from "../shared/types";

interface LyricsContentProps {
  lyricsState: LyricsState;
  syncedLines: LyricLine[];
  activeIndex: number;
  settings: Settings | null;
  activeLineRef?: RefObject<HTMLDivElement | null>;
  loadingTextMarginTop?: number;
  contentWidthPx?: number;
  contentHeightPx?: number;
}

export const LyricsContent = React.memo(function LyricsContent({
  lyricsState,
  syncedLines,
  activeIndex,
  settings,
  activeLineRef,
  loadingTextMarginTop,
  contentWidthPx,
  contentHeightPx,
}: LyricsContentProps): React.JSX.Element {
  const [fontVersion, setFontVersion] = useState(0);

  const hasPlain = !!lyricsState.data?.plainLyrics;

  const fontFamily =
    settings?.fontFamily ||
    "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  const textSize = settings?.textSize || 15;
  const activeTextSize = settings?.activeTextSize || 16;
  const activeFontWeight = settings?.activeFontWeight || 600;
  const inactiveOpacity = settings?.inactiveOpacity || 0.44;
  const visibleLineCount = settings?.visibleLineCount || 5;
  const textAlign = settings?.textAlign || "left";
  const slideDurationSec = Math.min(
    0.8,
    Math.max(0.2, Number(settings?.lyricSlideDurationSec ?? 0.5)),
  );

  const lineGap = 10;
  const maxWidth = Math.max(80, Number(contentWidthPx ?? 320));

  const inactiveLineHeightPx = getLineHeightPx(textSize);
  const activeLineHeightPx = getLineHeightPx(activeTextSize);
  const maxBaseLineHeight = Math.max(inactiveLineHeightPx, activeLineHeightPx);

  const inactiveFont = `normal 400 ${textSize}px ${fontFamily}`;
  const activeFont = `normal ${activeFontWeight} ${activeTextSize}px ${fontFamily}`;

  const halfWindow = Math.max(0, Math.floor((visibleLineCount - 1) / 2));

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let cancelled = false;
    let scheduled = false;

    const bump = () => {
      if (cancelled || scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        if (!cancelled) setFontVersion((v) => v + 1);
      });
    };

    Promise.all([
      document.fonts.load(inactiveFont).catch(() => {}),
      document.fonts.load(activeFont).catch(() => {}),
      document.fonts.ready.catch(() => {}),
    ]).then(() => {
      if (!cancelled) bump();
    });

    return () => {
      cancelled = true;
    };
  }, [inactiveFont, activeFont]);

  const preparedSyncedLines = useMemo((): PreparedLyricLine[] => {
    return syncedLines.map((line, originalIndex) => {
      const text = line.text || "♪";
      return {
        ...line,
        originalIndex,
        __fontVersion: fontVersion,
        __displayText: text,
        __inactivePrepared: safePrepare(text, inactiveFont),
        __activePrepared: safePrepare(text, activeFont),
      };
    });
  }, [syncedLines, inactiveFont, activeFont, fontVersion]);

  const hasSynced = preparedSyncedLines.length > 0;

  const allSlots = useMemo(() => {
    if (!hasSynced) return [];
    return preparedSyncedLines.map((line) => ({
      inactiveHeight: measureLineHeight(
        line.__inactivePrepared,
        inactiveLineHeightPx,
        maxWidth,
      ),
      activeHeight: measureLineHeight(
        line.__activePrepared,
        activeLineHeightPx,
        maxWidth,
      ),
    }));
  }, [
    hasSynced,
    preparedSyncedLines,
    maxWidth,
    inactiveLineHeightPx,
    activeLineHeightPx,
  ]);

  const measuredSlots = useMemo((): MeasuredSlot[] => {
    let cursorY = 0;
    return preparedSyncedLines.map((line, i) => {
      const isActive = line.originalIndex === activeIndex;
      const height = isActive
        ? (allSlots[i]?.activeHeight ?? activeLineHeightPx)
        : (allSlots[i]?.inactiveHeight ?? inactiveLineHeightPx);
      const lineHeightPx = isActive ? activeLineHeightPx : inactiveLineHeightPx;
      const top = cursorY;
      cursorY += height + lineGap;
      return { slotIndex: i, top, measuredHeight: height, lineHeightPx };
    });
  }, [
    preparedSyncedLines,
    allSlots,
    activeIndex,
    activeLineHeightPx,
    inactiveLineHeightPx,
    lineGap,
  ]);

  const activeSlotIndex = preparedSyncedLines.findIndex(
    (line) => line.originalIndex === activeIndex,
  );
  const activeTop =
    activeSlotIndex >= 0 ? (measuredSlots[activeSlotIndex]?.top ?? 0) : 0;
  const activeHeight =
    activeSlotIndex >= 0
      ? (measuredSlots[activeSlotIndex]?.measuredHeight ?? activeLineHeightPx)
      : activeLineHeightPx;

  const fallbackViewportHeight =
    Math.max(1, visibleLineCount) * maxBaseLineHeight +
    (Math.max(1, visibleLineCount) - 1) * lineGap;

  const viewportHeight = Math.max(
    1,
    Number(contentHeightPx) || fallbackViewportHeight,
  );

  const translateY = viewportHeight / 2 - (activeTop + activeHeight / 2);

  return (
    <>
      {lyricsState.loading && (
        <div className="flex flex-col items-center justify-center p-lg text-center">
          <div className="flex gap-1 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-text-accent animate-pulse-slow" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-accent animate-pulse-slow [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-accent animate-pulse-slow [animation-delay:0.4s]" />
          </div>
          <div
            className="text-[14px] leading-normal text-text-muted"
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
        <div className="flex flex-col items-center justify-center p-lg text-center">
          <div className="text-[14px] leading-normal text-text-muted">
            {lyricsState.error
              ? `Lỗi: ${lyricsState.error}`
              : "Không có lyric cho bài này."}
          </div>
        </div>
      )}

      {!lyricsState.loading && lyricsState.data && hasSynced && (
        <div
          className="flex flex-col gap-2.5"
          style={{
            fontFamily,
            textAlign,
            position: "relative",
            display: "block",
            height: "100%",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              transform: `translateY(${translateY}px)`,
              transition: `transform ${slideDurationSec}s cubic-bezier(0.22, 1, 0.36, 1)`,
              willChange: "transform",
            }}
          >
            <LyricsLines
              visibleLines={preparedSyncedLines}
              measuredSlots={measuredSlots}
              activeIndex={activeIndex}
              activeLineRef={activeLineRef}
              textSize={textSize}
              activeTextSize={activeTextSize}
              activeFontWeight={activeFontWeight}
              inactiveOpacity={inactiveOpacity}
              inactiveLineHeightPx={inactiveLineHeightPx}
              activeLineHeightPx={activeLineHeightPx}
              maxBaseLineHeight={maxBaseLineHeight}
              lineGap={lineGap}
              textAlign={textAlign}
              slideDurationSec={slideDurationSec}
              halfWindow={halfWindow}
            />
          </div>
        </div>
      )}

      {!lyricsState.loading && lyricsState.data && !hasSynced && hasPlain && (
        <div
          className="flex flex-col gap-2.5 h-full overflow-y-auto yl-scrollbar"
          style={{ fontFamily, textAlign }}
        >
          {lyricsState.data.plainLyrics!.split("\n").map((line, index) => (
            <div
              key={index}
              className="text-[15px] leading-[1.6] text-text-secondary word-break:break-word py-1"
              style={{
                fontSize: textSize,
                lineHeight: `${inactiveLineHeightPx}px`,
              }}
            >
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      )}

      {!lyricsState.loading && lyricsState.data && !hasSynced && !hasPlain && (
        <div className="flex flex-col items-center justify-center p-lg text-center">
          <div className="text-[14px] leading-normal text-text-muted">
            Provider không có lyric usable.
          </div>
        </div>
      )}
    </>
  );
});
