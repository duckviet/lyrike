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
}: PiPSplitInfoPanelProps): React.JSX.Element {
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
            width: "100%",
            maxWidth: 240,
            aspectRatio: "16 / 9",
            borderRadius: 8,
            overflow: "hidden",
            background: thumbnail ? "transparent" : "rgba(255,255,255,0.06)",
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
                scale: 1.05,
              }}
            />
          ) : null}
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
