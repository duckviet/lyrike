import React from "react";
import { CloseIcon, PiPIcon } from "../icons";

function ExpandIcon(): React.JSX.Element {
  return (
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
  );
}

function MinimizeIcon(): React.JSX.Element {
  return (
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
  );
}

interface WidgetHeaderProps {
  title: string;
  artist: string;
  minimized: boolean;
  onStartDrag: (event: React.MouseEvent<HTMLElement>) => void;
  onOpenPiP: () => void;
  onToggleMinimized: () => void;
  onHide: () => void;
}

export function WidgetHeader({
  title,
  artist,
  minimized,
  onStartDrag,
  onOpenPiP,
  onToggleMinimized,
  onHide,
}: WidgetHeaderProps): React.JSX.Element {
  return (
    <div className="yl-header" onMouseDown={onStartDrag}>
      <div className="yl-meta">
        <div className="yl-title">{title}</div>
        <div className="yl-artist">{artist}</div>
      </div>

      <div className="yl-actions">
        <button
          type="button"
          className="yl-btn"
          onClick={onOpenPiP}
          title="Picture-in-Picture"
          aria-label="Open Picture-in-Picture"
        >
          <PiPIcon />
        </button>

        <button
          type="button"
          className="yl-btn"
          onClick={onToggleMinimized}
          title={minimized ? "Expand" : "Minimize"}
          aria-label={minimized ? "Expand widget" : "Minimize widget"}
        >
          {minimized ? <ExpandIcon /> : <MinimizeIcon />}
        </button>

        <button
          type="button"
          className="yl-btn"
          onClick={onHide}
          title="Hide"
          aria-label="Hide widget"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}