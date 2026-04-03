import React from "react";
import { LyricsIcon } from "../icons";

export function ReopenLyricsButton({ onClick }) {
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