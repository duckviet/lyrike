import React from "react";
import { LyricsIcon } from "../icons";

interface ReopenLyricsButtonProps {
  onClick: () => void;
}

export function ReopenLyricsButton({
  onClick,
}: ReopenLyricsButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className="fixed top-[90px] right-5 z-[var(--z-index-max)] px-5 py-3 border-none rounded-lg bg-bg-secondary backdrop-blur-[16px] text-white text-[13px] font-medium cursor-pointer shadow-lg transition-all duration-150 flex items-center gap-sm hover:-translate-y-0.5 [&>svg]:w-4 [&>svg]:h-4"
      onClick={onClick}
      aria-label="Reopen lyrics widget"
    >
      <LyricsIcon /> Lyrike
    </button>
  );
}
