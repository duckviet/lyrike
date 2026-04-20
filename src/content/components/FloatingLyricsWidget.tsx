import React, { RefObject } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { TabSwitcher } from "./TabSwitcher";
import { LyricsContent } from "./LyricsContent";
import { WidgetHeader } from "./WidgetHeader";
import {
  Position,
  LyricsState,
  LyricLine,
  Settings,
  ThemeVars,
} from "../../shared/types";

interface FloatingLyricsWidgetProps {
  widgetRef: RefObject<HTMLDivElement | null>;
  pos: Position;
  widgetWidth: number;
  borderRadius: number;
  backgroundOpacity: number;
  title: string;
  artist: string;
  minimized: boolean;
  activeTab: string;
  lyricsState: LyricsState;
  syncedLines: LyricLine[];
  activeIndex: number;
  settings: Settings | null;
  onStartDrag: (event: React.MouseEvent<HTMLElement>) => void;
  onOpenPiP: () => void;
  onToggleMinimized: () => void;
  onHide: () => void;
  onTabChange: (tab: string) => void;
  onSettingsChange: (settings: Settings) => void;
  onResetSettings: () => void;
  themeVars: ThemeVars;
}

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
}: FloatingLyricsWidgetProps): React.JSX.Element {
  const contentWidthPx = Math.max(80, Number(widgetWidth ?? 360) - 32);

  return (
    <div
      ref={widgetRef}
      className="yl-widget"
      style={
        {
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${widgetWidth}px`,
          borderRadius: `${borderRadius}px`,
          background: `rgba(15, 15, 18, ${backgroundOpacity / 100})`,
          ...Object.fromEntries(
            Object.entries(themeVars).map(([k, v]) => [k, v]),
          ),
        } as React.CSSProperties
      }
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

          {activeTab === "settings" && settings && (
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
