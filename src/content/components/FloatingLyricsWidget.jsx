import React from "react";
import { SettingsPanel } from "./SettingsPanel";
import { TabSwitcher } from "./TabSwitcher";
import { LyricsContent } from "./LyricsContent";
import { WidgetHeader } from "./WidgetHeader";

export function FloatingLyricsWidget({
  widgetRef,
  pos,
  widgetWidth,
  borderRadius,
  backgroundOpacity,
  title,
  artist,
  minimized,
  activeTab,
  lyricsState,
  syncedLines,
  activeIndex,
  settings,
  onStartDrag,
  onOpenPiP,
  onToggleMinimized,
  onHide,
  onTabChange,
  onSettingsChange,
  onResetSettings,
  themeVars,
}) {
  const contentWidthPx = Math.max(80, Number(widgetWidth ?? 360) - 32);

  return (
    <div
      ref={widgetRef}
      className="yl-widget"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${widgetWidth}px`,
        borderRadius: `${borderRadius}px`,
        background: `rgba(15, 15, 18, ${backgroundOpacity / 100})`,
        ...themeVars,
      }}
    >
      <WidgetHeader
        title={title}
        artist={artist}
        minimized={minimized}
        onStartDrag={onStartDrag}
        onOpenPiP={onOpenPiP}
        onToggleMinimized={onToggleMinimized}
        onHide={onHide}
      />

      <TabSwitcher activeTab={activeTab} onChange={onTabChange} />

      {!minimized && (
        <div className="yl-body">
          {activeTab === "lyrics" && (
            <LyricsContent
              classPrefix="yl"
              lyricsState={lyricsState}
              syncedLines={syncedLines}
              activeIndex={activeIndex}
              settings={settings}
              loadingTextMarginTop={12}
              contentWidthPx={contentWidthPx}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPanel
              settings={settings}
              onChange={onSettingsChange}
              onReset={onResetSettings}
            />
          )}
        </div>
      )}
    </div>
  );
}
