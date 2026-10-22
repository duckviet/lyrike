import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LyricLine,
  LyricsState,
  PipMetaStyle,
  Settings,
} from "../shared/types";
import { CoverPolaroid, VinylRecord } from "./PiPMetaArt";
import { LyricsErrorNotice } from "./LyricsErrorNotice";
import { DEFAULT_SETTINGS } from "../shared/settings";

interface PiPPosterLyricsProps {
  lyricsState: LyricsState;
  syncedLines: LyricLine[];
  activeIndex: number;
  settings: Settings | null;
  thumbnail?: string;
  title?: string;
  artist?: string;
  /** Draw our own blurred-cover backdrop (when no video/thumbnail bg is on). */
  showOwnBackdrop: boolean;
  /** 0–1 multiplier for the edge vignette (lower when the user lightens the PiP overlay). */
  vignetteStrength?: number;
  /** Show the artwork + title/artist column beside the lyrics. */
  showMeta: boolean;
  metaStyle: PipMetaStyle;
  isPaused: boolean;
}

// Lines are revealed one after another inside a group, then the whole group
// is swapped out for the next one (like the reference reel).
const GROUP_SIZE = 2;
// The old ghost slides fully out before the new one slides in (no overlap).
const GHOST_EXIT_MS = 550;
const GHOST_ENTER_MS = 750;
// Ghost text size relative to the user's active lyric size.
const GHOST_SCALE = 2.2;
const META_ART_SIZE = "min(20cqw, 30cqh)";
// Title/artist block width relative to the artwork (title wraps within it).
const META_INFO_WIDTH_RATIO = 2;

const POSTER_CSS = `
@keyframes poster-line-in {
  from { opacity: 0; transform: translateY(0.4em); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0);     filter: blur(0); }
}
@keyframes poster-group-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Ghosts travel the full window width: in from off-screen right, out to
   off-screen left (100vw always clears the PiP window edges). */
@keyframes poster-ghost-in {
  from { transform: translateX(100vw) rotate(-5deg); }
  to   { transform: translateX(0)     rotate(-5deg); }
}
@keyframes poster-ghost-out {
  from { transform: translateX(0)      rotate(-5deg); }
  to   { transform: translateX(-100vw) rotate(-5deg); }
}
@keyframes poster-polaroid-in {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
.poster-line { transition: color 0.5s ease; }
.poster-ghost-in  { animation: poster-ghost-in ${GHOST_ENTER_MS}ms cubic-bezier(0.22,1,0.36,1) both; }
.poster-ghost-wait { animation-delay: ${GHOST_EXIT_MS}ms; }
.poster-ghost-out { animation: poster-ghost-out ${GHOST_EXIT_MS}ms cubic-bezier(0.64,0,0.78,0) both; }
@media (prefers-reduced-motion: reduce) {
  .poster-anim, .poster-ghost-in, .poster-ghost-wait { animation-delay: ${GHOST_EXIT_MS}ms; }
.poster-ghost-out { animation: none !important; }
}
`;

const lineText = (line?: LyricLine): string => line?.text?.trim() ?? "";

interface GhostEntry {
  key: number;
  text: string;
  leaving: boolean;
  /** Wait for the previous ghost to finish sliding out first. */
  delayed: boolean;
}

// Keeps the previous ghost mounted while it plays its exit animation.
function useGhostEntries(key: number, text: string): GhostEntry[] {
  const [entries, setEntries] = useState<GhostEntry[]>([]);
  const [seen, setSeen] = useState({ key: NaN, text: "" });
  const timer = useRef<number | undefined>(undefined);

  // Adjust state during render when the group changes (no effect cascade).
  if (seen.key !== key || seen.text !== text) {
    setSeen({ key, text });
    const kept = entries
      .filter((e) => e.key !== key)
      .map((e) => ({ ...e, leaving: true }));
    setEntries(
      text
        ? [...kept, { key, text, leaving: false, delayed: kept.length > 0 }]
        : kept,
    );
  }

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setEntries((prev) => prev.filter((e) => !e.leaving));
    }, GHOST_EXIT_MS);
  }, [key, text]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return entries;
}

export function PiPPosterLyrics({
  lyricsState,
  syncedLines,
  activeIndex,
  settings,
  thumbnail,
  title,
  artist,
  showOwnBackdrop,
  showMeta,
  metaStyle,
  isPaused,
  vignetteStrength = 1,
}: PiPPosterLyricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const fontFamily = settings?.fontFamily ?? DEFAULT_SETTINGS.fontFamily;
  const fontStyle = settings?.fontStyle ?? DEFAULT_SETTINGS.fontStyle;
  const inActiveTextSize =
    settings?.textSize ?? DEFAULT_SETTINGS.textSize;
  const activeTextSize =
    settings?.activeTextSize ?? DEFAULT_SETTINGS.activeTextSize;
  const activeFontWeight =
    settings?.activeFontWeight ?? DEFAULT_SETTINGS.activeFontWeight;
  const inactiveOpacity =
    settings?.inactiveOpacity ?? DEFAULT_SETTINGS.inactiveOpacity;

  const ghostSize = Math.round(inActiveTextSize * GHOST_SCALE);
  // Breathing room between the lyric block and the ghost text above/below.
  // Generous on tall windows, tightens with the window height (vh) so the
  // ghosts stay close to the lyrics when the user shrinks the PiP vertically.
  const ghostGapMax = Math.round(activeTextSize * 2.2);
  const ghostGap = `clamp(6px, 9vh, ${ghostGapMax}px)`;
  // Height of a two-line ghost slot.
  const ghostAreaHeight = Math.round(ghostSize * 0.95 * 2);

  const { group, groupStart, ghostText } = useMemo(() => {
    const idx = Math.max(-1, activeIndex);
    const start = idx < 0 ? 0 : idx - (idx % GROUP_SIZE);
    const end = Math.min(syncedLines.length, start + GROUP_SIZE);

    const visible: { index: number; text: string }[] = [];
    for (let i = start; i <= idx && i < end; i++) {
      visible.push({ index: i, text: lineText(syncedLines[i]) || "♪" });
    }

    // Ghosts frame the group: the nearest non-empty line before it on top,
    // the nearest one after it below (e.g. 1 -- [2, 3] -- 4).
    let top = "";
    for (let i = start - 1; i >= 0 && !top; i--) top = lineText(syncedLines[i]);
    // Before the first line starts there is no group yet, so don't reveal
    // the upcoming line as a ghost either.
    let bottom = "";
    for (let i = end; idx >= 0 && i < syncedLines.length && !bottom; i++) {
      bottom = lineText(syncedLines[i]);
    }

    return {
      group: visible,
      groupStart: start,
      ghostText: { top, bottom },
    };
  }, [syncedLines, activeIndex]);

  const topGhosts = useGhostEntries(groupStart, ghostText.top);
  const bottomGhosts = useGhostEntries(groupStart, ghostText.bottom);

  const hasSynced = syncedLines.length > 0;
  const showError =
    !lyricsState.loading && !lyricsState.data && !!lyricsState.error;
  const emptyMessage = lyricsState.loading
    ? t("common.loading_lyrics")
    : !lyricsState.data
      ? lyricsState.error
        ? ""
        : t("common.no_lyrics")
      : !hasSynced
        ? t("common.no_usable_lyrics")
        : "";

  // Fixed-size slots: the ghost keeps its size and its distance from the lyric
  // block. When the window is too short the stage simply overflows and the
  // window edge clips the ghost (it never shrinks).
  const ghostAreaStyle = (side: "top" | "bottom"): React.CSSProperties => ({
    flex: "0 0 auto",
    height: ghostAreaHeight,
    position: "relative",
    [side === "top" ? "marginBottom" : "marginTop"]: ghostGap,
  });

  const renderGhosts = (entries: GhostEntry[], side: "top" | "bottom") =>
    entries.map((entry) => (
      <div
        key={`${side}-${entry.key}`}
        className={
          entry.leaving
            ? "poster-ghost-out"
            : `poster-ghost-in${entry.delayed ? " poster-ghost-wait" : ""}`
        }
        style={{
          position: "absolute",
          // Hug the lyric block; the font shrinks to fit when space is tight.
          [side === "top" ? "bottom" : "top"]: 0,
          left: side === "top" ? "4vw" : "38vw",
          width: "max-content",
          maxWidth: side === "top" ? "80vw" : "58vw",
          fontFamily,
          fontWeight: 800,
          fontSize: ghostSize,
          // lineHeight: 0.95,
          // letterSpacing: "-0.01em",
          textTransform: "uppercase",
          overflowWrap: "anywhere",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
          color: "rgba(255,255,255,0.08)",
          // Tilt away from the lyric block so the ghost never overlaps it.
          transformOrigin: side === "top" ? "left bottom" : "right top",
          pointerEvents: "none",
          userSelect: "none",
          textShadow: "none",
        }}
      >
        {entry.text}
      </div>
    ));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        containerType: "size",
        fontFamily,
        color: "#fff",
      }}
    >
      <style>{POSTER_CSS}</style>

      {showOwnBackdrop && (
        <div style={{ position: "absolute", inset: 0, background: "#050505" }}>
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "blur(40px) saturate(1.2)",
                transform: "scale(1.4)",
                opacity: 0.5,
              }}
            />
          )}
        </div>
      )}

      {/* Vignette so the ghost text and the lyrics stay readable. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 60% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 85%), linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.4))",
          pointerEvents: "none",
          opacity: vignetteStrength,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          padding: "24px 0 56px",
          containerType: "inline-size",
        }}
      >
        <div style={ghostAreaStyle("top")}>
          {renderGhosts(topGhosts, "top")}
        </div>

        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: "6cqw",
            padding: "0 6cqw",
          }}
        >
          {showMeta && (
            <div
              className="poster-anim"
              key={thumbnail}
              style={{
                flex: `0 0 ${META_ART_SIZE}`,
                minWidth: 0,
                textAlign: "center",
                animation:
                  "poster-polaroid-in 0.6s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              {metaStyle === "cover" ? (
                <CoverPolaroid thumbnail={thumbnail} size={META_ART_SIZE} />
              ) : (
                <VinylRecord
                  thumbnail={thumbnail}
                  size={META_ART_SIZE}
                  isPaused={isPaused}
                />
              )}
              <div
                style={{
                  marginTop: "0.8em",
                  fontSize: "clamp(8px, 2cqw, 14px)",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  lineHeight: 1.25,
                  // Narrower than the artwork; long titles wrap instead of
                  // being truncated.
                  maxWidth: `calc(${META_ART_SIZE} * ${META_INFO_WIDTH_RATIO})`,
                  marginInline: "auto",
                  overflowWrap: "anywhere",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  marginTop: "0.2em",
                  fontSize: "clamp(9px, 1.9cqw, 12px)",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.6)",
                  maxWidth: `calc(${META_ART_SIZE} * ${META_INFO_WIDTH_RATIO})`,
                  marginInline: "auto",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {artist}
              </div>
            </div>
          )}

          <div
            key={`group-${groupStart}`}
            className="poster-anim"
            style={{
              flex: "1 1 0%",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.35em",
              fontSize: activeTextSize,
              fontWeight: activeFontWeight,
              fontStyle,
              lineHeight: 1.12,
              textTransform: "uppercase",
              overflowWrap: "break-word",
              // Without the artwork column the lyrics own the whole row.
              textAlign: showMeta ? undefined : "center",
              animation: "poster-group-in 0.35s ease both",
            }}
          >
            {showError ? (
              <LyricsErrorNotice
                state={lyricsState}
                align={showMeta ? "start" : "center"}
              />
            ) : emptyMessage ? (
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                  textTransform: "none",
                }}
              >
                {emptyMessage}
              </div>
            ) : (
              group.map((line) => {
                const isActive = line.index === activeIndex;
                return (
                  <div
                    key={line.index}
                    className="poster-line poster-anim"
                    style={{
                      color: isActive
                        ? "#fff"
                        : `rgba(255,255,255,${inactiveOpacity})`,
                      textShadow: isActive
                        ? "var(--pip-text-halo, 0 0 0 transparent)"
                        : undefined,
                      animation: isActive
                        ? "poster-line-in 0.55s cubic-bezier(0.22,1,0.36,1) both"
                        : undefined,
                    }}
                  >
                    {line.text}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={ghostAreaStyle("bottom")}>
          {renderGhosts(bottomGhosts, "bottom")}
        </div>
      </div>
    </div>
  );
}
