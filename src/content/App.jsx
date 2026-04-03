import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { TabSwitcher } from "./TabSwitcher";
import { SettingsPanel } from "./SettingsPanel";
import LyricsPiPPortal from "./LyricsPiPPortal";
import { LyricsContent } from "./LyricsContent";
import { PIP_CSS } from "./pipStyles";
import { getWatchInfo } from "./trackInfo";
import { parseSyncedLyrics, getActiveLineIndex } from "./lyricsUtils";
import { LyricsIcon, PiPIcon, CloseIcon } from "./icons";
import { useWidgetAnimation } from "./useWidgetAnimation";
import {
  loadSettings,
  saveSettings,
  resetSettings,
  subscribeSettingsChange,
} from "../shared/settings.js";

window.addEventListener("error", (e) =>
  console.error("[Lyrics Error]", e.error),
);
window.addEventListener("unhandledrejection", (e) =>
  console.error("[Lyrics Promise Error]", e.reason),
);

function tracePiPBackdropLayers(pipWindow, root) {
  try {
    const doc = pipWindow.document;
    const html = doc.documentElement;
    const body = doc.body;
    const shell = root?.querySelector(".pip-shell");

    const htmlStyle = pipWindow.getComputedStyle(html);
    const bodyStyle = pipWindow.getComputedStyle(body);
    const rootStyle = root ? pipWindow.getComputedStyle(root) : null;
    const shellStyle = shell ? pipWindow.getComputedStyle(shell) : null;

    console.groupCollapsed("[Lyrics PiP] Backdrop trace");
    console.table({
      htmlBackground: htmlStyle.backgroundColor,
      bodyBackground: bodyStyle.backgroundColor,
      rootBackground: rootStyle?.backgroundColor,
      shellBackground:
        shellStyle?.backgroundImage || shellStyle?.backgroundColor,
      shellOpacityVar: shellStyle?.getPropertyValue("--pip-bg-opacity")?.trim(),
      shellOpacity: shellStyle?.opacity,
    });
    console.info(
      "PiP host backdrop (outside document content) is browser-controlled and cannot be directly styled by extension CSS.",
    );
    console.groupEnd();
  } catch (error) {
    console.error("[Lyrics PiP] Backdrop trace failed:", error);
  }
}

export default function App() {
  const [track, setTrack] = useState(null);
  const [lyricsState, setLyricsState] = useState({
    loading: false,
    data: null,
    error: "",
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeTab, setActiveTab] = useState("lyrics");
  const [pos, setPos] = useState({
    x: Math.max(window.innerWidth - 380, 20),
    y: 90,
  });
  const [dragging, setDragging] = useState(null);
  const [isPiPOpen, setIsPiPOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [pendingSettings, setPendingSettings] = useState(null);

  const pipWindowRef = useRef(null);
  const [pipRoot, setPipRoot] = useState(null);
  const [syncAnchor, setSyncAnchor] = useState(null);

  const showFloating = useMemo(() => {
    if (hidden) return false;
    if (isPiPOpen && settings?.hideFloatingWhenPiPOpen) return false;
    return true;
  }, [hidden, isPiPOpen, settings?.hideFloatingWhenPiPOpen]);

  const currentSettings = pendingSettings || settings;
  const { widgetRef } = useWidgetAnimation(showFloating && track?.videoId);

  const syncedLines = useMemo(
    () => parseSyncedLyrics(lyricsState.data?.syncedLyrics || ""),
    [lyricsState.data],
  );
  const activeIndex = useMemo(
    () => getActiveLineIndex(syncedLines, currentTime),
    [syncedLines, currentTime],
  );

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setPendingSettings(s);
    });
    const unsub = subscribeSettingsChange((newSettings) => {
      setSettings(newSettings);
      setPendingSettings(newSettings);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const read = () => {
      const next = getWatchInfo();
      setTrack((prev) => {
        if (!next) return null;
        if (!prev) return next;
        const same = prev.videoId === next.videoId && prev.title === next.title;
        return same ? prev : next;
      });
    };
    read();
    const intervalId = window.setInterval(read, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setHidden(false);
  }, [track?.videoId]);

  useEffect(() => {
    if (!track?.videoId || !track?.trackName) {
      setLyricsState({ loading: false, data: null, error: "" });
      return;
    }
    let cancelled = false;
    setLyricsState({ loading: true, data: null, error: "" });

    chrome.runtime.sendMessage(
      {
        type: "FETCH_LYRICS",
        payload: {
          trackName: track.trackName,
          artistName: track.artistName,
          channelName: track.channelName,
          originalTitle: track.title,
        },
      },
      (response) => {
        if (cancelled) return;
        if (chrome.runtime.lastError) {
          setLyricsState({
            loading: false,
            data: null,
            error: chrome.runtime.lastError.message,
          });
          return;
        }
        if (!response?.ok) {
          setLyricsState({
            loading: false,
            data: null,
            error: response?.error || "Fetch failed",
          });
          return;
        }
        setLyricsState({ loading: false, data: response.data, error: "" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [track?.videoId, track?.trackName, track?.artistName]);

  useEffect(() => {
    if (!track?.videoId) return;
    const sync = () => {
      const video = document.querySelector("video");
      if (!video) return;
      setSyncAnchor({
        videoTime: video.currentTime || 0,
        epochMs: Date.now(),
        paused: video.paused,
        playbackRate: video.playbackRate || 1,
      });
    };
    sync();
    const intervalId = window.setInterval(sync, 1000);
    const video = document.querySelector("video");
    if (video) {
      video.addEventListener("play", sync);
      video.addEventListener("pause", sync);
      video.addEventListener("seeking", sync);
      video.addEventListener("seeked", sync);
      video.addEventListener("ratechange", sync);
    }
    return () => {
      window.clearInterval(intervalId);
      if (video) {
        video.removeEventListener("play", sync);
        video.removeEventListener("pause", sync);
        video.removeEventListener("seeking", sync);
        video.removeEventListener("seeked", sync);
        video.removeEventListener("ratechange", sync);
      }
    };
  }, [track?.videoId]);

  useEffect(() => {
    if (!syncAnchor) return;
    const tick = () => {
      if (syncAnchor.paused) {
        setCurrentTime(syncAnchor.videoTime);
        return;
      }
      const next =
        syncAnchor.videoTime +
        ((Date.now() - syncAnchor.epochMs) / 1000) *
          (syncAnchor.playbackRate || 1);
      setCurrentTime(next);
    };
    tick();
    const intervalId = window.setInterval(tick, 200);
    return () => window.clearInterval(intervalId);
  }, [syncAnchor]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event) => {
      const nextX = event.clientX - dragging.offsetX;
      const nextY = event.clientY - dragging.offsetY;
      const width = settings?.widgetWidth || 360;
      setPos({
        x: Math.max(12, Math.min(nextX, window.innerWidth - width - 12)),
        y: Math.max(12, Math.min(nextY, window.innerHeight - 140)),
      });
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, settings?.widgetWidth]);

  useEffect(() => {
    const onResize = () => {
      const width = settings?.widgetWidth || 360;
      setPos((prev) => ({
        x: Math.max(12, Math.min(prev.x, window.innerWidth - width - 12)),
        y: Math.max(12, Math.min(prev.y, window.innerHeight - 140)),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [settings?.widgetWidth]);

  const handleSettingsChange = useCallback((newSettings) => {
    setPendingSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleResetSettings = useCallback(async () => {
    await resetSettings();
    const defaults = await loadSettings();
    setSettings(defaults);
    setPendingSettings(defaults);
  }, []);

  async function openLyricsPiP() {
    if (!window.documentPictureInPicture?.requestWindow) {
      alert("Trình duyệt hiện tại chưa hỗ trợ Document Picture-in-Picture.");
      return;
    }
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 420,
        height: 560,
      });
      const doc = pipWindow.document;
      doc.title = "YouTube Lyrics";
      doc.body.innerHTML = "";
      doc.body.style.margin = "0";
      doc.documentElement.style.background = "transparent";
      doc.body.style.background = "transparent";

      const styleEl = doc.createElement("style");
      styleEl.textContent = PIP_CSS;
      doc.head.appendChild(styleEl);

      const root = doc.createElement("div");
      root.id = "ytl-pip-root";
      doc.body.appendChild(root);

      pipWindow.requestAnimationFrame(() => {
        tracePiPBackdropLayers(pipWindow, root);
      });

      pipWindowRef.current = pipWindow;
      setPipRoot(root);
      setIsPiPOpen(true);

      pipWindow.addEventListener(
        "pagehide",
        () => {
          pipWindowRef.current = null;
          setPipRoot(null);
          setIsPiPOpen(false);
        },
        { once: true },
      );
    } catch (error) {
      console.error("[Lyrics] Failed to open PiP window:", error);
      pipWindowRef.current = null;
      setPipRoot(null);
      setIsPiPOpen(false);
    }
  }

  const closeLyricsPiP = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }
    pipWindowRef.current = null;
    setPipRoot(null);
    setIsPiPOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      closeLyricsPiP();
    };
  }, [closeLyricsPiP]);

  if (!track?.videoId) return null;

  const artistLabel = track.artistName || track.channelName || "Unknown artist";
  const widgetWidth = currentSettings?.widgetWidth || 360;
  const borderRadius = currentSettings?.borderRadius || 20;
  const bgOpacity = currentSettings?.backgroundOpacity || 88;

  return (
    <>
      {showFloating ? (
        <div
          ref={widgetRef}
          className="yl-widget"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            width: `${widgetWidth}px`,
            borderRadius: `${borderRadius}px`,
            background: `rgba(15, 15, 18, ${bgOpacity / 100})`,
          }}
        >
          <div
            className="yl-header"
            onMouseDown={(e) => {
              if (e.target.closest("button")) return;
              const rect =
                e.currentTarget.parentElement.getBoundingClientRect();
              setDragging({
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top,
              });
            }}
          >
            <div className="yl-meta">
              <div className="yl-title">{track.trackName || track.title}</div>
              <div className="yl-artist">{artistLabel}</div>
            </div>
            <div className="yl-actions">
              <button
                className="yl-btn"
                onClick={openLyricsPiP}
                title="Picture-in-Picture"
              >
                <PiPIcon />
              </button>
              <button
                className="yl-btn"
                onClick={() => setMinimized((v) => !v)}
                title={minimized ? "Expand" : "Minimize"}
              >
                {minimized ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>
              <button
                className="yl-btn"
                onClick={() => setHidden(true)}
                title="Hide"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

          {!minimized && (
            <div className="yl-body">
              {activeTab === "lyrics" && (
                <LyricsContent
                  classPrefix="yl"
                  lyricsState={lyricsState}
                  syncedLines={syncedLines}
                  activeIndex={activeIndex}
                  settings={currentSettings}
                  loadingTextMarginTop={12}
                />
              )}

              {activeTab === "settings" && (
                <SettingsPanel
                  settings={currentSettings}
                  onChange={handleSettingsChange}
                  onReset={handleResetSettings}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <button className="yl-reopen" onClick={() => setHidden(false)}>
          <LyricsIcon /> Lyrics
        </button>
      )}

      <LyricsPiPPortal
        pipRoot={pipRoot}
        lyricsState={lyricsState}
        syncedLines={syncedLines}
        activeIndex={activeIndex}
        settings={currentSettings}
      />
    </>
  );
}
