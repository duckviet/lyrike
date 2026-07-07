import React from "react";

interface PiPSplitInfoPanelProps {
  thumbnail?: string;
  title?: string;
  artist?: string;
  lyricsId?: number;
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

export function PiPSplitInfoPanel({
  thumbnail,
  title,
  artist,
  playerControls,
}: PiPSplitInfoPanelProps): React.JSX.Element {
  const isPaused = playerControls?.isPaused ?? true;

  return (
    <div
      style={{
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "12px",
        gap: 10,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignItems: "center",
          minHeight: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "min(160px, 45vh)",
            height: "min(160px, 45vh)",
            "--vinyl-size": "min(160px, 45vh)",
          } as React.CSSProperties}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
              overflow: "hidden",
              background: "#0a0a0c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <style>{`
              @keyframes yl-vinyl-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
            
            {/* Spinning Vinyl Record body */}
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `
                  repeating-radial-gradient(circle at center,
                    #1a1a1f 0px, #232329 1.5px, #101014 3px, #1a1a1f 4.5px),
                  radial-gradient(circle at center, #2a2a30 0%, #0a0a0c 70%)
                `,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "yl-vinyl-spin 6s linear infinite",
                animationPlayState: isPaused ? "paused" : "running",
                transition: "transform 0.6s ease",
                transform: isPaused ? "scale(0.97)" : "scale(1)",
                willChange: "transform",
              }}
            >
              {/* Light reflection bands (xoay cùng đĩa) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: `conic-gradient(from 0deg,
                    transparent 0deg,
                    rgba(255,255,255,0.06) 40deg,
                    transparent 80deg,
                    transparent 180deg,
                    rgba(255,255,255,0.05) 220deg,
                    transparent 260deg)`,
                  pointerEvents: "none",
                }}
              />

              {/* Groove rings */}
              {["5%", "11%", "19%", "27%", "36%"].map((inset) => (
                <div
                  key={inset}
                  style={{
                    position: "absolute",
                    inset,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.035)",
                    pointerEvents: "none",
                  }}
                />
              ))}

              {/* Paper label ring (viền bạc/metallic) */}
              <div
                style={{
                  width: "48%",
                  height: "48%",
                  borderRadius: "50%",
                  padding: "1.8%",
                  background:
                    "conic-gradient(from 45deg, #444, #aaa, #444, #aaa, #444)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                }}
              >
                {/* Album center label */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid #000",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </div>
              </div>

              {/* Spindle */}
              <div
                style={{
                  position: "absolute",
                  width: "10%",
                  height: "10%",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #555, #1a1a1a)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "inset 0 1px 3px rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    width: "30%",
                    height: "30%",
                    borderRadius: "50%",
                    background: "#050507",
                    boxShadow: "inset 0 1px 1px rgba(0,0,0,0.8)",
                  }}
                />
              </div>
            </div>

            {/* Non-spinning Glossy Sheen Overlay */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 0.1) 100%)",
                pointerEvents: "none",
                mixBlendMode: "screen",
              }}
            />
          </div>

          {/* Tonearm — đặt sau phần vinyl body, trước/sau sheen đều được */}
          <div
            style={{
              position: "absolute",
              top: "calc(var(--vinyl-size) * 6 / 160)",
              right: "calc(var(--vinyl-size) * 10 / 160)",
              width: "calc(var(--vinyl-size) * 70 / 160)",
              height: "calc(var(--vinyl-size) * 110 / 160)",
              pointerEvents: "none",
              zIndex: 2,
              // Xoay quanh trục pivot (đầu trên bên phải)
              transformOrigin: "calc(var(--vinyl-size) * 56 / 160) calc(var(--vinyl-size) * 14 / 160)",
              transform: isPaused ? "rotate(-24deg)" : "rotate(4deg)",
              transition: "transform 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)",
              // Nhấc lên khi pause (bóng đổ xa hơn)
              filter: isPaused
                ? "drop-shadow(calc(var(--vinyl-size) * 4 / 160) calc(var(--vinyl-size) * 8 / 160) calc(var(--vinyl-size) * 6 / 160) rgba(0,0,0,0.6))"
                : "drop-shadow(calc(var(--vinyl-size) * 1 / 160) calc(var(--vinyl-size) * 2 / 160) calc(var(--vinyl-size) * 3 / 160) rgba(0,0,0,0.5))",
            }}
          >
            {/* Pivot base (đế trục) */}
            <div
              style={{
                position: "absolute",
                top: "calc(var(--vinyl-size) * 2 / 160)",
                right: "calc(var(--vinyl-size) * 2 / 160)",
                width: "calc(var(--vinyl-size) * 24 / 160)",
                height: "calc(var(--vinyl-size) * 24 / 160)",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4a4a50 0%, #2a2a2e 35%, #18181c 55%, #38383e 75%, #1c1c20 100%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow:
                  "inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -2px 3px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)",
              }}
            />
            {/* Pivot cap */}
            <div
              style={{
                position: "absolute",
                top: "calc(var(--vinyl-size) * 9 / 160)",
                right: "calc(var(--vinyl-size) * 9 / 160)",
                width: "calc(var(--vinyl-size) * 10 / 160)",
                height: "calc(var(--vinyl-size) * 10 / 160)",
                borderRadius: "50%",
                background: "radial-gradient(circle at 35% 30%, #6a6a70, #232326 70%)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
              }}
            />

            {/* Arm (cần) */}
            <div
              style={{
                position: "absolute",
                top: "calc(var(--vinyl-size) * 14 / 160)",
                right: "calc(var(--vinyl-size) * 13 / 160)",
                width: "calc(var(--vinyl-size) * 3.5 / 160)",
                height: "calc(var(--vinyl-size) * 78 / 160)",
                borderRadius: 2,
                background: "linear-gradient(90deg, #8a8a92, #c8c8d0 50%, #6a6a72)",
                transformOrigin: "top center",
                transform: "rotate(12deg)",
              }}
            >
              {/* Headshell + kim (đầu đọc) */}
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(var(--vinyl-size) * -12 / 160)",
                  left: "calc(var(--vinyl-size) * -5 / 160)",
                  width: "calc(var(--vinyl-size) * 13 / 160)",
                  height: "calc(var(--vinyl-size) * 16 / 160)",
                  borderRadius: "3px 3px 5px 5px",
                  background: "linear-gradient(180deg, #3a3a42, #1a1a20)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  transform: "rotate(-8deg)",
                }}
              >
                {/* Stylus (kim) */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(var(--vinyl-size) * -3 / 160)",
                    left: "50%",
                    width: "calc(var(--vinyl-size) * 2 / 160)",
                    height: "calc(var(--vinyl-size) * 4 / 160)",
                    background: "#ddd",
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
            </div>

            {/* Counterweight (đối trọng) */}
            <div
              style={{
                position: "absolute",
                top: "calc(var(--vinyl-size) * -4 / 160)",
                right: "calc(var(--vinyl-size) * 8 / 160)",
                width: "calc(var(--vinyl-size) * 12 / 160)",
                height: "calc(var(--vinyl-size) * 12 / 160)",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #45454b 0%, #1c1c20 60%, #08080a 100%)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 230,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          <div
            title={title}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.94)",
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title || "—"}
          </div>
          <div
            title={artist}
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.25,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {artist || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
