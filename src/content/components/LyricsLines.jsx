import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function LyricsLines({
  visibleLines,
  measuredSlots,
  activeIndex,
  classPrefix,
  activeLineRef,
  textSize,
  activeTextSize,
  activeFontWeight,
  inactiveOpacity,
  inactiveLineHeightPx,
  activeLineHeightPx,
  maxBaseLineHeight,
  lineGap,
  textAlign,
  slideDurationSec,
}) {
  const groupRef = useRef(null);
  const previousActiveIndexRef = useRef(activeIndex);
  const previousActiveTopRef = useRef(null);

  useLayoutEffect(() => {
    const groupElement = groupRef.current;

    if (!groupElement) return;

    const slotIndex = visibleLines.findIndex(
      (line) => line.originalIndex === activeIndex,
    );

    const nextActiveTop =
      slotIndex < 0
        ? null
        : (measuredSlots[slotIndex]?.top ??
          slotIndex * (maxBaseLineHeight + lineGap));
    const previousActiveTop = previousActiveTopRef.current;
    const previousActiveIndex = previousActiveIndexRef.current;

    let fromY = 0;

    if (
      previousActiveTop !== null &&
      nextActiveTop !== null &&
      previousActiveIndex !== activeIndex
    ) {
      // Keep visual continuity, then animate the whole block into the new layout.
      fromY = previousActiveTop - nextActiveTop;
    }

    gsap.killTweensOf(groupElement);
    gsap.set(groupElement, { y: fromY });
    gsap.to(groupElement, {
      y: 0,
      duration: slideDurationSec,
      ease: "power3.out",
      overwrite: "auto",
    });

    previousActiveTopRef.current = nextActiveTop;
    previousActiveIndexRef.current = activeIndex;
  }, [
    visibleLines,
    measuredSlots,
    activeIndex,
    slideDurationSec,
    maxBaseLineHeight,
    lineGap,
  ]);

  useLayoutEffect(() => {
    const groupElement = groupRef.current;

    return () => {
      if (groupElement) {
        gsap.killTweensOf(groupElement);
      }
      if (activeLineRef) {
        activeLineRef.current = null;
      }
    };
  }, [activeLineRef]);

  return (
    <div ref={groupRef}>
      {visibleLines.map((line, slotIndex) => (
        <div
          key={line.originalIndex}
          ref={(el) => {
            if (line.originalIndex === activeIndex && activeLineRef) {
              activeLineRef.current = el;
            }
          }}
          className={`${classPrefix}-line ${line.originalIndex === activeIndex ? "active" : ""}`}
          style={{
            fontSize:
              line.originalIndex === activeIndex ? activeTextSize : textSize,
            fontWeight:
              line.originalIndex === activeIndex ? activeFontWeight : 400,
            opacity: line.originalIndex === activeIndex ? 1 : inactiveOpacity,
            minHeight: `${Math.ceil(measuredSlots[slotIndex]?.measuredHeight ??
              (line.originalIndex === activeIndex
                ? activeLineHeightPx
                : inactiveLineHeightPx))}px`,
            lineHeight: `${measuredSlots[slotIndex]?.lineHeightPx ??
              (line.originalIndex === activeIndex
                ? activeLineHeightPx
                : inactiveLineHeightPx)}px`,
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            transform: `translateY(${measuredSlots[slotIndex]?.top ?? slotIndex * (maxBaseLineHeight + lineGap)}px)`,
            transformOrigin:
              textAlign === "right"
                ? "right center"
                : textAlign === "center"
                  ? "center center"
                  : "left center",
            willChange: "transform, opacity",
          }}
        >
          {line.__displayText}
        </div>
      ))}
    </div>
  );
}