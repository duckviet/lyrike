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
import { useVideoStream } from "./hooks/useVideoStream";
import { createThumbnailTheme } from "./utils/thumbnailTheme";
import { ThemeVars } from "./shared/types";
import { usePlayerControls } from "./hooks/usePlayerControls";
import { PIP_BG_MODE } from "./constants/settings";

export default function App(): React.JSX.Element | null {
  useGlobalErrorLogging();

  const track = useWatchTrack();
  const lyricsState = useLyricsData(track);
  const currentTime = useVideoCurrentTime(track?.videoId);
  
  const {
    isPaused,
    volume,
    offset,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    adjustOffset,
  } = usePlayerControls();

  const { settings, updateSettings, resetAllSettings } = useLyricsSettings();

  const { pipRoot, isPiPOpen, openLyricsPiP, closeLyricsPiP } = useLyricsPiP();
  const videoStream = useVideoStream(
    isPiPOpen && settings?.pipBackgroundMode === "video",
    track?.videoId,
  );

  const [minimized, setMinimized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("lyrics");
  const [themeVars, setThemeVars] = useState<ThemeVars>({});

  const widgetWidth = settings?.widgetWidth ?? DEFAULT_WIDGET_WIDTH;
  const borderRadius = settings?.borderRadius ?? DEFAULT_BORDER_RADIUS;
  const backgroundOpacity = settings?.backgroundOpacity ?? DEFAULT_BG_OPACITY;

  const { pos, startDrag } = useFloatingWidgetPosition(widgetWidth);

  const isHidden = settings?.showFloatingWidget === false;

  const showFloating =
    !isHidden && !(isPiPOpen && settings?.hideFloatingWhenPiPOpen);

  const { widgetRef } = useWidgetAnimation(showFloating && track?.videoId);

  const syncedLyricsText = lyricsState.data?.syncedLyrics || "";

  const syncedLines = useMemo(
    () => parseSyncedLyrics(syncedLyricsText),
    [syncedLyricsText],
  );

  const activeIndex = useMemo(
    () => getActiveLineIndex(syncedLines, currentTime + offset),
    [syncedLines, currentTime, offset],
  );

  useEffect(() => {
    if (!track?.videoId) {
      closeLyricsPiP();
    }
  }, [track?.videoId, closeLyricsPiP]);

  useEffect(() => {
    let cancelled = false;

    const themeEnabled = settings?.pipBackgroundMode === PIP_BG_MODE.COLOR;

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
  }, [track?.videoId, settings?.pipBackgroundMode]);

  // Apply saved offset when lyrics data is loaded
  useEffect(() => {
    if (lyricsState.data?.offsetMs !== undefined) {
      const savedOffsetSec = lyricsState.data.offsetMs / 1000;
      if (!isNaN(savedOffsetSec)) {
        adjustOffset(savedOffsetSec - offset);
      }
    } else {
      adjustOffset(-offset);
    }
  }, [lyricsState.data?.id]);

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
          playbackTime={currentTime + offset}
          settings={settings}
          onStartDrag={startDrag}
          onOpenPiP={openLyricsPiP}
          onToggleMinimized={() => setMinimized((value) => !value)}
          onHide={() =>
            settings && updateSettings({ ...settings, showFloatingWidget: false })
          }
          onTabChange={setActiveTab}
          onSettingsChange={updateSettings}
          onResetSettings={resetAllSettings}
        />
      ) : (
        <ReopenLyricsButton
          onClick={() =>
            settings && updateSettings({ ...settings, showFloatingWidget: true })
          }
        />
      )}

      <LyricsPiPPortal
        pipRoot={pipRoot}
        lyricsState={lyricsState}
        syncedLines={syncedLines}
        activeIndex={activeIndex}
        playbackTime={currentTime + offset}
        settings={settings}
        themeVars={themeVars}
        thumbnail={track.thumbnail}
        artist={artistLabel}
        title={title}
        lyricsId={typeof lyricsState.data?.id === "number" ? lyricsState.data.id : undefined}
        videoStream={videoStream ?? undefined}
        playerControls={{
          isPaused,
          volume,
          offset,
          togglePlay,
          nextTrack,
          prevTrack,
          setVolume,
          adjustOffset,
        }}
      />
    </>
  );
}
