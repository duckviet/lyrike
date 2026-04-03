import { useCallback, useEffect, useState } from "react";
import {
  loadSettings,
  resetSettings,
  saveSettings,
  subscribeSettingsChange,
} from "../../shared/settings.js";

export function useLyricsSettings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let mounted = true;

    loadSettings()
      .then((nextSettings) => {
        if (mounted) {
          setSettings(nextSettings);
        }
      })
      .catch((error) => {
        console.error("[Lyrics Settings] Load failed:", error);
      });

    const unsubscribe = subscribeSettingsChange((nextSettings) => {
      setSettings(nextSettings);
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const updateSettings = useCallback((nextSettings) => {
    setSettings(nextSettings);

    void saveSettings(nextSettings).catch((error) => {
      console.error("[Lyrics Settings] Save failed:", error);
    });
  }, []);

  const resetAllSettings = useCallback(async () => {
    try {
      await resetSettings();
      const defaults = await loadSettings();
      setSettings(defaults);
    } catch (error) {
      console.error("[Lyrics Settings] Reset failed:", error);
    }
  }, []);

  return {
    settings,
    updateSettings,
    resetAllSettings,
  };
}