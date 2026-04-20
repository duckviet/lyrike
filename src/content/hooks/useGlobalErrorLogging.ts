import { useEffect } from "react";

export function useGlobalErrorLogging(): void {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("[Lyrics Error]", event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[Lyrics Promise Error]", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);
}
