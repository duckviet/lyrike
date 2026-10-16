import React, { useEffect, useState } from "react";
import { trimImageBorders } from "../utils/trimImageBorders";

// Shared "meta" artwork for the PiP layouts: a spinning vinyl record or a
// polaroid-style album cover. `size` is any CSS length (px, cqw, min(), ...).

interface MetaArtProps {
  thumbnail?: string;
  size: string;
}

// Thumbnail with dark letterbox/pillarbox borders trimmed off (falls back to
// the original until trimming finishes).
function useTrimmedImage(src?: string): string | undefined {
  const [trimmed, setTrimmed] = useState<{ src: string; url: string }>();

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    void trimImageBorders(src).then((url) => {
      if (!cancelled) setTrimmed({ src, url });
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return trimmed && trimmed.src === src ? trimmed.url : src;
}

export function VinylRecord({
  thumbnail: rawThumbnail,
  size,
  isPaused,
}: MetaArtProps & { isPaused: boolean }): React.JSX.Element {
  const thumbnail = useTrimmedImage(rawThumbnail);
  return (
    <div
      style={
        {
          position: "relative",
          width: size,
          height: size,
          "--vinyl-size": size,
        } as React.CSSProperties
      }
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
          {["3%", "7%", "11%", "15%"].map((inset) => (
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
              width: "44%",
              height: "44%",
              borderRadius: "50%",
              padding: "1.4%",
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
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : null}
            </div>
          </div>

          {/* Spindle */}
          <div
            style={{
              position: "absolute",
              width: "7%",
              height: "7%",
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
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 0.1) 100%)",
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
          transformOrigin:
            "calc(var(--vinyl-size) * 56 / 160) calc(var(--vinyl-size) * 14 / 160)",
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
            background:
              "linear-gradient(135deg, #4a4a50 0%, #2a2a2e 35%, #18181c 55%, #38383e 75%, #1c1c20 100%)",
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
            background:
              "radial-gradient(circle at 35% 30%, #6a6a70, #232326 70%)",
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
            background:
              "linear-gradient(135deg, #45454b 0%, #1c1c20 60%, #08080a 100%)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.5)",
          }}
        />
      </div>
    </div>
  );
}

export function CoverPolaroid({
  thumbnail: rawThumbnail,
  size,
}: MetaArtProps): React.JSX.Element {
  const thumbnail = useTrimmedImage(rawThumbnail);
  const frame: React.CSSProperties = {
    width: size,
    aspectRatio: "1 / 1",
    display: "block",
    borderRadius: 6,
  };
  return thumbnail ? (
    <img
      src={thumbnail}
      alt=""
      style={{
        ...frame,
        objectFit: "cover",
        padding: "1%",
        background: "#f2f2ee",
        boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
      }}
    />
  ) : (
    <div style={{ ...frame, background: "rgba(255,255,255,0.12)" }} />
  );
}
