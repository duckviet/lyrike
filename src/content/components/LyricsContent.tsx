import React, { useEffect, useMemo, useRef, useState, RefObject } from "react";
import { useTranslation } from "react-i18next";
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
import { DEFAULT_SETTINGS } from "../shared/settings";
import { MeasuredSlot } from "../shared/types";

interface LyricsContentProps {
  lyricsState: LyricsState;
  syncedLines: LyricLine[];
  activeIndex: number;
  playbackTime: number;
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
  playbackTime,
  settings,
  activeLineRef,
  loadingTextMarginTop,
  contentWidthPx,
  contentHeightPx,
}: LyricsContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fontVersion, setFontVersion] = useState(0);

  const hasPlain = !!lyricsState.data?.plainLyrics;

  const fontFamily = settings?.fontFamily ?? DEFAULT_SETTINGS.fontFamily;
  const textSize = settings?.textSize ?? DEFAULT_SETTINGS.textSize;
  const activeTextSize =
    settings?.activeTextSize ?? DEFAULT_SETTINGS.activeTextSize;
  const activeFontWeight =
    settings?.activeFontWeight ?? DEFAULT_SETTINGS.activeFontWeight;
  const fontWeight = settings?.fontWeight ?? DEFAULT_SETTINGS.fontWeight;
  const fontStyle = settings?.fontStyle ?? DEFAULT_SETTINGS.fontStyle;
  const inactiveOpacity =
    settings?.inactiveOpacity ?? DEFAULT_SETTINGS.inactiveOpacity;
  const visibleLineCount =
    settings?.visibleLineCount ?? DEFAULT_SETTINGS.visibleLineCount;
  const textAlign = settings?.textAlign ?? DEFAULT_SETTINGS.textAlign;
  const slideDurationSec = Math.min(
    0.8,
    Math.max(
      0.2,
      Number(
        settings?.lyricSlideDurationSec ??
          DEFAULT_SETTINGS.lyricSlideDurationSec,
      ),
    ),
  );

  const lineGap = settings?.lineGap ?? DEFAULT_SETTINGS.lineGap;
  const maxWidth = Math.max(80, Number(contentWidthPx ?? 320));

  const inactiveLineHeightPx = getLineHeightPx(textSize);
  const activeLineHeightPx = getLineHeightPx(activeTextSize);
  const maxBaseLineHeight = Math.max(inactiveLineHeightPx, activeLineHeightPx);

  const inactiveFont = `${fontStyle} ${fontWeight} ${textSize}px ${fontFamily}`;
  const activeFont = `${fontStyle} ${activeFontWeight} ${activeTextSize}px ${fontFamily}`;

  const halfWindow = Math.max(0, Math.floor((visibleLineCount - 1) / 2));

  useEffect(() => {
    const ownerDocument = containerRef.current?.ownerDocument ?? document;
    if (!ownerDocument.fonts) return;

    let cancelled = false;
    let scheduled = false;

    const ownerWindow = ownerDocument.defaultView ?? window;

    const bump = () => {
      if (cancelled || scheduled) return;
      scheduled = true;

      ownerWindow.requestAnimationFrame(() => {
        scheduled = false;
        if (!cancelled) {
          setFontVersion((v) => v + 1);
        }
      });
    };

    Promise.all([
      ownerDocument.fonts.load(inactiveFont).catch(() => {}),
      ownerDocument.fonts.load(activeFont).catch(() => {}),
      ownerDocument.fonts.ready.catch(() => {}),
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
            {t("common.loading_lyrics")}
          </div>
        </div>
      )}

      {!lyricsState.loading && !lyricsState.data && (
        <div className="flex flex-col items-center justify-center p-lg text-center">
          <div className="text-[14px] leading-normal text-text-muted">
            {lyricsState.error
              ? t("common.error_loading", { error: lyricsState.error })
              : t("common.no_lyrics")}
          </div>
        </div>
      )}

      {!lyricsState.loading && lyricsState.data && hasSynced && (
        <div
          ref={containerRef}
          className="flex flex-col gap-2.5"
          style={{
            fontFamily,
            textAlign,
            position: "relative",
            display: "block",
            height: viewportHeight,
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
              playbackTime={playbackTime}
              activeLineRef={activeLineRef}
              textSize={textSize}
              activeTextSize={activeTextSize}
              activeFontWeight={activeFontWeight}
              fontWeight={fontWeight}
              fontStyle={fontStyle}
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
          className="flex flex-col gap-2.5"
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
            {t("common.no_usable_lyrics")}
          </div>
        </div>
      )}
    </>
  );
});
