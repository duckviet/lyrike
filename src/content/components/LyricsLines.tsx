import React, { useLayoutEffect, useRef, RefObject } from "react";
import gsap from "gsap";
import { PreparedLyricLine, MeasuredSlot, LyricWord } from "../shared/types";

interface LyricsLinesProps {
  visibleLines: PreparedLyricLine[];
  measuredSlots: MeasuredSlot[];
  activeIndex: number;
  playbackTime: number;
  activeLineRef?: RefObject<HTMLDivElement | null>;
  textSize: number;
  activeTextSize: number;
  activeFontWeight: number;
  fontWeight: number;
  fontStyle: string;
  inactiveOpacity: number;
  inactiveLineHeightPx: number;
  activeLineHeightPx: number;
  maxBaseLineHeight: number;
  lineGap: number;
  textAlign: string;
  slideDurationSec: number;
  halfWindow: number;
}

export function LyricsLines({
  visibleLines,
  measuredSlots,
  activeIndex,
  playbackTime,
  activeLineRef,
  textSize,
  activeTextSize,
  activeFontWeight,
  fontWeight,
  fontStyle,
  inactiveOpacity,
  inactiveLineHeightPx,
  activeLineHeightPx,
  maxBaseLineHeight,
  lineGap,
  textAlign,
  slideDurationSec,
  halfWindow,
}: LyricsLinesProps): React.JSX.Element {
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Find slot index of the active line (may differ from originalIndex).
  const activeSlotIndex = visibleLines.findIndex(
    (l) => l.originalIndex === activeIndex,
  );

  const prevState = useRef<Map<number, { y: number; opacity: number }>>(
    new Map(),
  );

  useLayoutEffect(() => {
    visibleLines.forEach((line, slotIndex) => {
      const el = lineRefs.current.get(line.originalIndex);
      if (!el) return;

      const slot = measuredSlots[slotIndex];
      const isActive = line.originalIndex === activeIndex;

      const top = slot?.top ?? slotIndex * (maxBaseLineHeight + lineGap);

      // Distance from active line (in slot units).
      const distance =
        activeSlotIndex >= 0 ? Math.abs(slotIndex - activeSlotIndex) : 0;
      const withinWindow = distance <= halfWindow;

      let targetOpacity: number;
      if (!withinWindow) {
        targetOpacity = 0;
      } else if (isActive) {
        targetOpacity = 1;
      } else {
        // Optional: gently fade lines further from the active one.
        const fadeStep = inactiveOpacity / Math.max(1, halfWindow);
        targetOpacity = Math.max(
          0,
          inactiveOpacity - fadeStep * (distance - 1),
        );
      }

      // Performance: Only animate if values changed
      const prev = prevState.current.get(line.originalIndex);
      if (
        prev &&
        Math.abs(prev.y - top) < 0.1 &&
        Math.abs(prev.opacity - targetOpacity) < 0.01
      ) {
        return;
      }
      prevState.current.set(line.originalIndex, {
        y: top,
        opacity: targetOpacity,
      });

      gsap.to(el, {
        y: top,
        opacity: targetOpacity,
        duration: slideDurationSec,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  }, [
    visibleLines,
    measuredSlots,
    activeIndex,
    activeSlotIndex,
    inactiveOpacity,
    slideDurationSec,
    maxBaseLineHeight,
    lineGap,
    halfWindow,
  ]);

  useLayoutEffect(() => {
    const refs = lineRefs.current;
    return () => {
      refs.forEach((el) => gsap.killTweensOf(el));
      refs.clear();
      if (activeLineRef) {
        activeLineRef.current = null;
      }
    };
  }, [activeLineRef]);

  return (
    <div style={{ position: "relative" }}>
      {visibleLines.map((line, slotIndex) => {
        const isActive = line.originalIndex === activeIndex;
        const slot = measuredSlots[slotIndex];
        const distance =
          activeSlotIndex >= 0 ? Math.abs(slotIndex - activeSlotIndex) : 0;
        const withinWindow = distance <= halfWindow;

        return (
          <div
            key={line.originalIndex}
            ref={(el) => {
              if (el) {
                lineRefs.current.set(line.originalIndex, el);
                if (!el.dataset.initialized) {
                  const initialTop =
                    slot?.top ?? slotIndex * (maxBaseLineHeight + lineGap);
                  gsap.set(el, {
                    y: initialTop,
                    opacity: withinWindow
                      ? isActive
                        ? 1
                        : inactiveOpacity
                      : 0,
                  });
                  el.dataset.initialized = "1";
                }
              } else {
                lineRefs.current.delete(line.originalIndex);
              }
              if (isActive && activeLineRef) {
                activeLineRef.current = el;
              }
            }}
            className={`text-[15px] leading-[1.6] text-text-muted wrap-break-word py-[3px] ${isActive
                ? "text-text-primary font-semibold [text-shadow:0_0_20px_rgba(255,255,255,0.15)] scale-[1.01] origin-left-center"
                : ""
              }`}
            style={{
              fontSize: isActive ? activeTextSize : textSize,
              fontWeight: isActive ? activeFontWeight : fontWeight,
              fontStyle: fontStyle,
              minHeight: `${Math.ceil(
                slot?.measuredHeight ??
                (isActive ? activeLineHeightPx : inactiveLineHeightPx),
              )}px`,
              lineHeight: `${slot?.lineHeightPx ??
                (isActive ? activeLineHeightPx : inactiveLineHeightPx)
                }px`,
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              transformOrigin:
                textAlign === "right"
                  ? "right center"
                  : textAlign === "center"
                    ? "center center"
                    : "left center",
              willChange: "transform, opacity",
              pointerEvents: withinWindow ? "auto" : "none",
              // transition: `font-size ${slideDurationSec}s ease`,
            }}
          >
            {isActive &&
              line.isKaraoke &&
              line.words &&
              line.words.length > 0 ? (
              <KaraokeWords
                words={line.words}
                lineEnd={visibleLines[slotIndex + 1]?.time}
                playbackTime={playbackTime}
              />
            ) : (
              line.__displayText
            )}
          </div>
        );
      })}
    </div>
  );
}

function KaraokeWords({
  words,
  lineEnd,
  playbackTime,
}: {
  words: LyricWord[];
  lineEnd?: number;
  playbackTime: number;
}): React.JSX.Element {
  return (
    <>
      {words.map((word, i) => {
        const start = word.time;
        const end = words[i + 1]?.time ?? lineEnd ?? start + 0.6;
        const duration = Math.max(0.001, end - start);

        // 0 = chưa hát, 1 = đã hát xong
        const progress = Math.min(
          1,
          Math.max(0, (playbackTime - start) / duration),
        );
        const isSinging = progress > 0 && progress < 1;

        // Wipe fill: phần đã hát sáng, phần chưa hát mờ
        const fillPct = `${progress * 100}%`;

        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              whiteSpace: "pre",
              // transform: isSinging ? "scale(1.04)" : "scale(1)",
              transformOrigin: "center bottom",
              textShadow: isSinging
                ? "0 0 14px var(--color-text-accent, rgba(180, 160, 255, 0.55))"
                : "none",
              transition: "transform 0.18s ease, text-shadow 0.18s ease",
              willChange: "transform",
              ...(isSinging
                ? {
                  backgroundImage: `linear-gradient(
                      to right,
                      var(--color-text-primary, #ffffff) 0%,
                      var(--color-text-accent, rgba(180, 160, 255, 0.95)) calc(${fillPct} - 8px),
                      rgba(255, 255, 255, 0.32) calc(${fillPct} + 8px)
                    )`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }
                : {
                  color:
                    progress === 1
                      ? "var(--color-text-primary, #ffffff)"
                      : "rgba(255, 255, 255, 0.32)",
                }),
            }}
          >
            {word.text}
          </span>
        );
      })}
    </>
  );
}
