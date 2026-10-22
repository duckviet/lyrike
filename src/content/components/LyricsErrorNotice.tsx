import React from "react";
import { useTranslation } from "react-i18next";
import { LyricsErrorCode, LyricsState } from "../shared/types";

interface LyricsErrorNoticeProps {
  state: Pick<
    LyricsState,
    "error" | "errorCode" | "retryAfterSec" | "refetch"
  >;
  /** Left-align (poster layout) instead of centering (list layout). */
  align?: "center" | "start";
}

/**
 * Explains why lyrics could not be loaded, says whose side the problem is on,
 * and offers the right next step (retry, or refresh the page).
 */
export function LyricsErrorNotice({
  state,
  align = "center",
}: LyricsErrorNoticeProps): React.JSX.Element {
  const { t } = useTranslation();
  const code: LyricsErrorCode = state.errorCode ?? "unknown";
  // After an extension update the old content script cannot reach the
  // background anymore: retrying is pointless, only a page refresh works.
  const canRetry = code !== "extension_unavailable" && !!state.refetch;

  return (
    <div
      role="alert"
      className="flex flex-col gap-1.5"
      style={{
        alignItems: align === "center" ? "center" : "flex-start",
        textAlign: align === "center" ? "center" : "left",
        textTransform: "none",
        fontStyle: "normal",
        fontWeight: 400,
        lineHeight: 1.4,
      }}
    >
      <div className="text-[14px] font-medium text-text-primary">
        {t(`errors.${code}.title`)}
      </div>
      <div className="text-[12px] text-text-secondary max-w-[260px]">
        {t(`errors.${code}.hint`, { seconds: state.retryAfterSec ?? 0 })}
      </div>

      {canRetry && (
        <button
          type="button"
          onClick={state.refetch}
          className="yl-focus-ring mt-1 px-3 py-1.5 border border-border-light rounded-sm bg-transparent text-text-primary text-[12px] cursor-pointer transition-colors duration-150 hover:bg-bg-hover active:scale-[0.98]"
        >
          {t("errors.retry")}
        </button>
      )}

      {state.error && (
        <div className="text-[11px] text-text-muted tabular-nums">
          {t("errors.details", { error: state.error })}
        </div>
      )}
    </div>
  );
}
