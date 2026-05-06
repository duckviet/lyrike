import { RefObject, useEffect, useRef, useState } from "react";
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
} from "../shared/types";

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
  themeVars?: ThemeVars;
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
  const contentBodyRef = useRef<HTMLDivElement | null>(null);
  const [contentWidthPx, setContentWidthPx] = useState<number>(
    Math.max(80, Number(widgetWidth ?? 360) - 48),
  );

  useEffect(() => {
    const element = contentBodyRef.current;
    if (!element) {
      setContentWidthPx(Math.max(80, Number(widgetWidth ?? 360) - 48));
      return;
    }

    const ownerWindow = element.ownerDocument.defaultView ?? window;

    const updateWidth = () => {
      const styles = ownerWindow.getComputedStyle(element);
      const paddingX =
        parseFloat(styles.paddingLeft || "0") +
        parseFloat(styles.paddingRight || "0");

      setContentWidthPx(Math.max(80, element.clientWidth - paddingX));
    };

    updateWidth();

    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? ResizeObserver;
    const observer = new ResizeObserverCtor(updateWidth);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [widgetWidth, minimized]);

  return (
    <div
      ref={widgetRef}
      className="yl-widget p-3 fixed shadow-lg overflow-hidden border border-border-subtle backdrop-blur-[20px] text-text-primary"
      style={
        {
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${widgetWidth}px`,
          borderRadius: `${borderRadius}px`,
          background: `rgba(15, 15, 18, ${backgroundOpacity / 100})`,
          ...Object.fromEntries(
            Object.entries(themeVars || {}).map(([k, v]) => [k, v]),
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
        <div
          ref={contentBodyRef}
          className="yl-body p-3 max-h-[calc(72vh-120px)] overflow-y-auto overflow-x-hidden yl-scrollbar max-[400px]:max-h-[calc(65vh-120px)]"
        >
          {activeTab === "lyrics" && (
            <LyricsContent
              lyricsState={lyricsState}
              syncedLines={syncedLines}
              activeIndex={activeIndex}
              settings={settings}
              loadingTextMarginTop={12}
              // activeLineRef={activeLineRef}
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
