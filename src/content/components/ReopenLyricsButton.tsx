import React from "react";
import { LyricsIcon } from "../icons";

interface ReopenLyricsButtonProps {
  onClick: () => void;
}

export function ReopenLyricsButton({ onClick }: ReopenLyricsButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className="yl-reopen"
      onClick={onClick}
      aria-label="Reopen lyrics widget"
    >
      <LyricsIcon /> Lyrics
    </button>
  );
}