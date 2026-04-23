import React from "react";

interface PiPBackgroundProps {
  showVideo: boolean;
  showThumbnail: boolean;
  thumbnail?: string;
  videoStream: MediaStream | null;
}

export function PiPBackground({
  showVideo,
  showThumbnail,
  thumbnail,
  videoStream,
}: PiPBackgroundProps): React.JSX.Element | null {
  if (showVideo) {
    return (
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <video
          ref={(el) => {
            if (el && el.srcObject !== videoStream) {
              el.srcObject = videoStream;
            }
          }}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover blur-[20px] scale-110 opacity-70"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
    );
  }

  if (showThumbnail) {
    return (
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <img
          src={thumbnail}
          className="w-full h-full object-cover blur-[20px] scale-110 opacity-70"
          alt=""
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
    );
  }

  return null;
}