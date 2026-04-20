import React, { useEffect, useMemo, useState, RefObject } from "react";
import { layout, prepare } from "@chenglou/pretext";
import { LyricsLines } from "./LyricsLines";
import { getVisibleLines } from "../utils/lyricsUtils";
import {
  LyricsState,
  LyricLine,
  Settings,
  PreparedLyricLine,
} from "../../shared/types";

const DEFAULT_FONT_FAMILY =
  "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
const LINE_HEIGHT_RATIO = 1.6;

function getLineHeightPx(fontSize: number): number {
  return fontSize * LINE_HEIGHT_RATIO;
}

function safePrepare(text: string, font: string): any {
  try {
    return prepare(text, font);
  } catch {
    return null;
  }
}

interface LyricsContentProps {
  classPrefix: string;
  lyricsState: LyricsState;
  syncedLines: LyricLine[];
  activeIndex: number;
  settings: Settings | null;
  activeLineRef?: RefObject<HTMLDivElement | null>;
  loadingTextMarginTop?: number;
  contentWidthPx?: number;
}

export function LyricsContent({
  classPrefix,
  lyricsState,
  syncedLines,
  activeIndex,
  settings,
  activeLineRef,
  loadingTextMarginTop,
  contentWidthPx,
}: LyricsContentProps): React.JSX.Element {
  const [fontVersion, setFontVersion] = useState(0);

  const hasPlain = !!lyricsState.data?.plainLyrics;

  const fontFamily = settings?.fontFamily || DEFAULT_FONT_FAMILY;
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

  const lineGap = classPrefix === "pip" ? 8 : 10;
  const maxWidth = Math.max(80, Number(contentWidthPx ?? 320));

  const inactiveLineHeightPx = getLineHeightPx(textSize);
  const activeLineHeightPx = getLineHeightPx(activeTextSize);
  const maxBaseLineHeight = Math.max(inactiveLineHeightPx, activeLineHeightPx);

  const inactiveFont = `normal 400 ${textSize}px ${fontFamily}`;
  const activeFont = `normal ${activeFontWeight} ${activeTextSize}px ${fontFamily}`;

  const bufferedCount = visibleLineCount;

  // Re-measure when web fonts finish loading.
  useEffect(() => {
    // @ts-ignore
    if (typeof document === "undefined" || !document.fonts) return;

    let cancelled = false;

    const bump = () => {
      if (!cancelled) {
        setFontVersion((v) => v + 1);
      }
    };

    // @ts-ignore
    document.fonts.ready.then(bump).catch(() => {});

    // @ts-ignore
    document.fonts.addEventListener?.("loadingdone", bump);

    return () => {
      cancelled = true;
      // @ts-ignore
      document.fonts.removeEventListener?.("loadingdone", bump);
    };
  }, [fontFamily]);

  // Prepare all synced lines once per text/font configuration.
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

  const visibleLines = useMemo(() => {
    if (!preparedSyncedLines.length) return [];
    return getVisibleLines(preparedSyncedLines, activeIndex, bufferedCount);
  }, [preparedSyncedLines, activeIndex, bufferedCount]);

  const measuredSlots = useMemo(() => {
    if (!hasSynced || !visibleLines.length) {
      return [];
    }

    let cursorY = 0;

    return visibleLines.map((line, slotIndex) => {
      const isActive = line.originalIndex === activeIndex;
      const prepared = isActive
        ? line.__activePrepared
        : line.__inactivePrepared;
      const lineHeightPx = isActive ? activeLineHeightPx : inactiveLineHeightPx;

      let measuredHeight = lineHeightPx;

      if (prepared) {
        try {
          measuredHeight = Math.max(
            lineHeightPx,
            layout(prepared, maxWidth, lineHeightPx).height,
          );
        } catch {
          measuredHeight = lineHeightPx;
        }
      }

      const top = cursorY;
      cursorY += measuredHeight + lineGap;

      return {
        slotIndex,
        top,
        measuredHeight,
        lineHeightPx,
      };
    });
  }, [
    hasSynced,
    visibleLines,
    activeIndex,
    activeLineHeightPx,
    inactiveLineHeightPx,
    maxWidth,
    lineGap,
  ]);

  const measuredViewportHeight = measuredSlots.length
    ? measuredSlots[measuredSlots.length - 1].top +
      measuredSlots[measuredSlots.length - 1].measuredHeight
    : 0;

  const fallbackViewportHeight =
    Math.max(1, visibleLineCount) * maxBaseLineHeight +
    (Math.max(1, visibleLineCount) - 1) * lineGap;

  const viewportHeight = Math.max(
    fallbackViewportHeight,
    measuredViewportHeight,
  );

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
            textAlign: textAlign as any,
            position: "relative",
            display: "block",
            height: `${Math.ceil(viewportHeight)}px`,
            overflow: "hidden",
          }}
        >
          <LyricsLines
            visibleLines={visibleLines}
            measuredSlots={measuredSlots}
            activeIndex={activeIndex}
            classPrefix={classPrefix}
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
          />
        </div>
      )}

      {!lyricsState.loading && lyricsState.data && !hasSynced && hasPlain && (
        <div
          className={`${classPrefix}-lines`}
          style={{
            fontFamily,
            textAlign: textAlign as any,
          }}
        >
          {lyricsState.data.plainLyrics!.split("\n").map((line, index) => (
            <div
              key={index}
              className={`${classPrefix}-line plain`}
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
        <div className={`${classPrefix}-status`}>
          <div className={`${classPrefix}-status-text`}>
            Provider không có lyric usable.
          </div>
        </div>
      )}
    </>
  );
}
