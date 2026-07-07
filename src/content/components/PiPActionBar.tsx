import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { useTranslation } from "react-i18next";

interface PiPActionBarProps {
  isVisible: boolean;
  artist?: string;
  title?: string;
  lyricsId?: number;
  videoId?: string;
  placement?: "overlay" | "inline";
  playerControls: {
    isPaused: boolean;
    volume: number;
    offset: number;
    togglePlay: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    setVolume: (v: number) => void;
    adjustOffset: (d: number) => void;
  };
}

function lyricsOffsetKey(id: number): string {
  return `lyrics_offset:${id}`;
}

export const PiPActionBar: React.FC<PiPActionBarProps> = ({
  isVisible,
  lyricsId,
  artist,
  title,
  videoId,
  placement = "overlay",
  playerControls,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleQuickReport = () => {
    setIsSubmitting(true);
    const videoUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : "";

    chrome.runtime.sendMessage(
      {
        type: "REPORT_ISSUE",
        payload: {
          description: "Missing lyric",
          trackName: title || "",
          artistName: artist || "",
          albumName: "",
          videoUrl,
          lyricsId,
        },
      },
      (response) => {
        setIsSubmitting(false);
        if (response && response.ok) {
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 3000);
        } else {
          const errMsg = response?.error || "Unknown error";
          alert(`Report failed: ${errMsg}`);
        }
      },
    );
  };

  // Debounce save offset (10s)
  useEffect(() => {
    if (typeof lyricsId !== "number") return;

    // Clear previous timeout if offset changed within 10s
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const offsetMs = Math.round(playerControls.offset * 1000);
        await chrome.storage.local.set({
          [lyricsOffsetKey(lyricsId)]: offsetMs,
        });
      } catch (err) {
        console.error("[Lyrics] Failed to save offset debounce:", err);
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [playerControls.offset, lyricsId]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (placement === "inline") return;

    if (isVisible) {
      gsap.to(containerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        pointerEvents: "auto",
      });
    } else {
      gsap.to(containerRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
        pointerEvents: "none",
      });
    }
  }, [isVisible]);

  return (
    <>
      <style>{`
        .pip-volume-range {
          -webkit-appearance: none;
          appearance: none;
          width: 64px;
          height: 3px;
          background: rgba(255,255,255,0.25);
          border-radius: 2px;
          cursor: pointer;
        }
        .pip-volume-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .pip-volume-range::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          ...(placement === "inline"
            ? {
                position: "relative",
                inset: "auto",
                zIndex: 1,
                opacity: 1,
                transform: "none",
                pointerEvents: "auto",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 10,
                padding: "10px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "auto",
              }
            : {
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                opacity: 0,
                transform: "translateY(20px)",
                pointerEvents: "none",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.0) 100%)",
                padding: "20px 12px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "54px",
              }),
        }}
      >
        {/* Prev */}
        <button
          onClick={playerControls.prevTrack}
          style={btnStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
          }
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={playerControls.togglePlay}
          style={{
            ...btnStyle,
            background: "rgba(255,255,255,0.95)",
            color: "#000",
            width: 30,
            height: 30,
            borderRadius: "50%",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {playerControls.isPaused ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={playerControls.nextTrack}
          style={btnStyle}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
          }
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        <div style={dividerStyle} />

        {/* Volume */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }}
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={playerControls.volume}
            onChange={(e) =>
              playerControls.setVolume(parseFloat(e.target.value))
            }
            className="pip-volume-range"
            style={{ accentColor: "white", cursor: "pointer" }}
          />
        </div>

        <div style={dividerStyle} />

        {/* Offset */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => playerControls.adjustOffset(-0.5)}
            style={offsetBtnStyle}
            title={t("settings.pip.offset.earlier", { value: 0.5 })}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            -0.5s
          </button>
          <span
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.4)",
              minWidth: 32,
              textAlign: "center",
            }}
          >
            {playerControls.offset > 0 ? "+" : ""}
            {playerControls.offset.toFixed(1)}s
          </span>
          <button
            onClick={() => playerControls.adjustOffset(0.5)}
            style={offsetBtnStyle}
            title={t("settings.pip.offset.later", { value: 0.5 })}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            +0.5s
          </button>
        </div>

        <div style={dividerStyle} />

        {/* Quick Report Button */}
        <button
          onClick={handleQuickReport}
          style={{
            ...btnStyle,
            width: 24,
            height: 24,
            background: isSubmitting
              ? "rgba(255,255,255,0.05)"
              : isSuccess
                ? "rgba(46,125,50,0.3)"
                : "rgba(255,255,255,0.12)",
            color: isSuccess ? "#81c784" : "rgba(255,255,255,0.9)",
            position: "relative",
          }}
          title={
            isSuccess
              ? t("settings.report.success")
              : t("settings.report.report_desc")
          }
          disabled={isSubmitting || isSuccess}
          onMouseEnter={(e) => {
            if (!isSubmitting && !isSuccess)
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting && !isSuccess)
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
          }}
        >
          {isSubmitting ? (
            <svg
              className="animate-spin"
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              style={{ display: "block" }}
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isSuccess ? (
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ display: "block" }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "block" }}
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};

const btnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.9)",
  border: "none",
  cursor: "pointer",
  transition: "all 0.2s ease",
  flexShrink: 0,
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 14,
  background: "rgba(255,255,255,0.15)",
  margin: "0 2px",
  flexShrink: 0,
};

const offsetBtnStyle: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: 4,
  background: "rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.8)",
  border: "none",
  cursor: "pointer",
  fontSize: 9,
  fontWeight: "bold",
  transition: "background 0.2s ease",
};
