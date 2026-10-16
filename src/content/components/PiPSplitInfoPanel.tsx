import React from "react";
import { PipMetaStyle } from "../shared/types";
import { CoverPolaroid, VinylRecord } from "./PiPMetaArt";

interface PiPSplitInfoPanelProps {
  thumbnail?: string;
  title?: string;
  artist?: string;
  lyricsId?: number;
  metaStyle: PipMetaStyle;
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

const ART_SIZE = "min(160px, 45vh)";

export function PiPSplitInfoPanel({
  thumbnail,
  title,
  artist,
  metaStyle,
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
        {metaStyle === "cover" ? (
          <CoverPolaroid thumbnail={thumbnail} size={ART_SIZE} />
        ) : (
          <VinylRecord
            thumbnail={thumbnail}
            size={ART_SIZE}
            isPaused={isPaused}
          />
        )}

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
              textWrap: "balance",
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
              textWrap: "balance",
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
