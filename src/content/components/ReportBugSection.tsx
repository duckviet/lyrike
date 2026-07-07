import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WatchInfo } from "../shared/types";
import { CollapsibleSection } from "./SettingsPanel";

interface ReportBugSectionProps {
  track?: WatchInfo | null;
  lyricsId?: number;
}

export function ReportBugSection({
  track,
  lyricsId,
}: ReportBugSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [attachTrack, setAttachTrack] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({
    type: null,
    message: null,
  });

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setStatus({ type: null, message: null });

    const videoUrl = attachTrack && track?.videoId
      ? `https://www.youtube.com/watch?v=${track.videoId}`
      : "";

    chrome.runtime.sendMessage(
      {
        type: "REPORT_ISSUE",
        payload: {
          description: description.trim(),
          trackName: attachTrack ? (track?.trackName || track?.title || "") : "",
          artistName: attachTrack ? (track?.artistName || track?.channelName || "") : "",
          albumName: attachTrack ? (track?.albumName || "") : "",
          videoUrl,
          lyricsId: attachTrack ? lyricsId : undefined,
          thumbnail: attachTrack ? (track?.thumbnail || "") : "",
        },
      },
      (response) => {
        setIsSubmitting(false);
        if (chrome.runtime.lastError) {
          setStatus({
            type: "error",
            message:
              chrome.runtime.lastError.message ||
              "Unknown communication error",
          });
          return;
        }

        if (response && response.ok) {
          setStatus({
            type: "success",
            message: t("settings.report.success"),
          });
          setDescription("");

          if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
          successTimeoutRef.current = setTimeout(() => {
            setStatus((prev) =>
              prev.type === "success" ? { type: null, message: null } : prev
            );
          }, 5000);
        } else {
          setStatus({
            type: "error",
            message: response?.error || "Unknown server error",
          });
        }
      },
    );
  };

  const attachedTitle = track?.trackName || track?.title || "";
  const attachedArtist = track?.artistName || track?.channelName || "";

  return (
    <CollapsibleSection
      title={t("settings.report.title")}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[11px] text-text-secondary leading-snug">
          {t("settings.report.desc")}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            onKeyPress={(e) => e.stopPropagation()}
            placeholder={t("settings.report.placeholder")}
            disabled={isSubmitting}
            className="w-full min-h-[80px] p-[8px_10px] bg-bg-tertiary border border-border-subtle rounded-sm text-text-primary text-[13px] resize-y outline-none focus:border-text-accent/60 transition-colors duration-150"
            required
          />

          {/* Attach track button or attached track info */}
          {!attachTrack && track && (
            <button
              type="button"
              onClick={() => setAttachTrack(true)}
              className="w-full py-2 px-3 border border-dashed border-border-subtle hover:border-text-accent rounded-sm text-text-secondary text-[12px] hover:text-text-primary transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 bg-transparent"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              <span>{t("settings.report.attach_track")}</span>
            </button>
          )}

          {attachTrack && track && (
            <div className="relative p-2.5 bg-white/5 border border-border-subtle rounded-sm flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setAttachTrack(false)}
                className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded-full text-text-secondary hover:text-red-400 hover:bg-white/5 cursor-pointer border-none bg-transparent"
                title="Detach track"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <span className="text-[11px] font-semibold text-text-accent uppercase tracking-wider pr-6">
                {t("settings.report.track_info")}
              </span>

              <div className="flex flex-col gap-1 text-[12px] text-text-secondary pr-6">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-text-primary truncate">
                    {attachedTitle}
                  </span>
                  <span className="text-text-muted truncate shrink-0">
                    {attachedArtist}
                  </span>
                </div>
                {track.albumName && (
                  <div className="text-[11px]">
                    Album:{" "}
                    <span className="text-text-primary">{track.albumName}</span>
                  </div>
                )}
                <div className="text-[11px] flex justify-between">
                  <span>
                    Lyrics ID:{" "}
                    <span className="text-text-primary">{lyricsId || "—"}</span>
                  </span>
                  {track.videoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${track.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-accent hover:underline"
                    >
                      YouTube Link
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {!track && (
            <div className="p-2.5 bg-white/5 border border-border-subtle rounded-sm text-[12px] text-text-muted">
              {t("settings.report.no_track")}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !description.trim()}
            className="mt-1 w-full p-[8px_16px] rounded-sm bg-text-accent text-white hover:bg-text-accent/90 disabled:bg-white/5 disabled:text-text-secondary disabled:cursor-not-allowed font-medium text-[13px] cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
                <span>{t("settings.report.submitting")}</span>
              </>
            ) : (
              <span>{t("settings.report.submit")}</span>
            )}
          </button>
        </form>

        {status.type && (
          <div
            className={`p-2.5 rounded-sm text-[12px] leading-snug border ${
              status.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {status.type === "success"
              ? status.message
              : t("settings.report.error", { error: status.message })}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
