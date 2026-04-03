import React, { useEffect, useMemo, useState } from "react";
import LyricsPiPPortal from "./components/LyricsPiPPortal";
import { getActiveLineIndex, parseSyncedLyrics } from "./utils/lyricsUtils";
import {
  DEFAULT_BG_OPACITY,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_WIDGET_WIDTH,
} from "./constants/ui";
import { FloatingLyricsWidget } from "./components/FloatingLyricsWidget";
import { ReopenLyricsButton } from "./components/ReopenLyricsButton";
import { useFloatingWidgetPosition } from "./hooks/useFloatingWidgetPosition";
import { useGlobalErrorLogging } from "./hooks/useGlobalErrorLogging";
import { useLyricsData } from "./hooks/useLyricsData";
import { useLyricsPiP } from "./hooks/useLyricsPiP";
import { useLyricsSettings } from "./hooks/useLyricsSettings";
import { useVideoCurrentTime } from "./hooks/useVideoCurrentTime";
import { useWidgetAnimation } from "./hooks/useWidgetAnimation";
import { useWatchTrack } from "./hooks/useWatchTrack";
import { createThumbnailTheme } from "./utils/thumbnailTheme";

export default function App() {
  useGlobalErrorLogging();

  const track = useWatchTrack();
  const lyricsState = useLyricsData(track);
  const currentTime = useVideoCurrentTime(track?.videoId);

  const { settings, updateSettings, resetAllSettings } = useLyricsSettings();

  const { pipRoot, isPiPOpen, openLyricsPiP, closeLyricsPiP } = useLyricsPiP();

  const [hiddenForVideoId, setHiddenForVideoId] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState("lyrics");
  const [themeVars, setThemeVars] = useState({});

  const widgetWidth = settings?.widgetWidth ?? DEFAULT_WIDGET_WIDTH;
  const borderRadius = settings?.borderRadius ?? DEFAULT_BORDER_RADIUS;
  const backgroundOpacity = settings?.backgroundOpacity ?? DEFAULT_BG_OPACITY;

  const { pos, startDrag } = useFloatingWidgetPosition(widgetWidth);

  const isHidden = hiddenForVideoId === track?.videoId;

  const showFloating =
    !isHidden && !(isPiPOpen && settings?.hideFloatingWhenPiPOpen);

  const { widgetRef } = useWidgetAnimation(showFloating && track?.videoId);

  const syncedLyricsText = lyricsState.data?.syncedLyrics || "";

  const syncedLines = useMemo(
    () => parseSyncedLyrics(syncedLyricsText),
    [syncedLyricsText],
  );

  const activeIndex = useMemo(
    () => getActiveLineIndex(syncedLines, currentTime),
    [syncedLines, currentTime],
  );

  useEffect(() => {
    if (!track?.videoId) {
      closeLyricsPiP();
    }
  }, [track?.videoId, closeLyricsPiP]);

  useEffect(() => {
    let cancelled = false;

    const themeEnabled = settings?.usePiPDominantColorTheme ?? true;

    const loadTheme = async () => {
      try {
        const nextThemeVars = await createThumbnailTheme(
          track?.videoId,
          themeEnabled,
        );

        if (!cancelled) {
          setThemeVars(nextThemeVars);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[Lyrics] Failed to build thumbnail theme:", error);
          setThemeVars({});
        }
      }
    };

    loadTheme();

    return () => {
      cancelled = true;
    };
  }, [track?.videoId, settings?.usePiPDominantColorTheme]);

  if (!track?.videoId) {
    return null;
  }

  const title = track.trackName || track.title;
  const artistLabel = track.artistName || track.channelName || "Unknown artist";

  return (
    <>
      {showFloating ? (
        <FloatingLyricsWidget
          widgetRef={widgetRef}
          pos={pos}
          widgetWidth={widgetWidth}
          borderRadius={borderRadius}
          backgroundOpacity={backgroundOpacity}
          title={title}
          artist={artistLabel}
          minimized={minimized}
          activeTab={activeTab}
          lyricsState={lyricsState}
          syncedLines={syncedLines}
          activeIndex={activeIndex}
          settings={settings}
          onStartDrag={startDrag}
          onOpenPiP={openLyricsPiP}
          onToggleMinimized={() => setMinimized((value) => !value)}
          onHide={() => setHiddenForVideoId(track?.videoId)}
          onTabChange={setActiveTab}
          onSettingsChange={updateSettings}
          onResetSettings={resetAllSettings}
          themeVars={themeVars}
        />
      ) : (
        <ReopenLyricsButton onClick={() => setHiddenForVideoId(null)} />
      )}

      <LyricsPiPPortal
        pipRoot={pipRoot}
        lyricsState={lyricsState}
        syncedLines={syncedLines}
        activeIndex={activeIndex}
        settings={settings}
        themeVars={themeVars}
      />
    </>
  );
}
