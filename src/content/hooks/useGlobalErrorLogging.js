import { useEffect } from "react";

export function useGlobalErrorLogging() {
  useEffect(() => {
    const handleError = (event) => {
      console.error("[Lyrics Error]", event.error);
    };

    const handleUnhandledRejection = (event) => {
      console.error("[Lyrics Promise Error]", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener(
      "unhandledrejection",
      handleUnhandledRejection,
    );

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);
}