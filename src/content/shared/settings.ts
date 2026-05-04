import { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  fontFamily: "Montserrat, sans-serif",
  textSize: 16,
  activeTextSize: 30,
  visibleLineCount: 5,
  activeFontWeight: 700,
  fontWeight: 400,
  fontStyle: "italic",
  inactiveOpacity: 0.44,
  lyricSlideDurationSec: 0.4,
  widgetWidth: 360,
  borderRadius: 20,
  backgroundOpacity: 88,
  autoScroll: true,
  hideFloatingWhenPiPOpen: false,
  pipBackgroundMode: "video",
  textAlign: "left",
  language: "en",
};

export const SETTINGS_KEY_VALUE = "lyrics_extension_settings";

export function getDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY_VALUE);
    const storedSettings = result[SETTINGS_KEY_VALUE];

    if (storedSettings && typeof storedSettings === "object") {
      // Merge stored settings with defaults to ensure all new fields exist
      return {
        ...DEFAULT_SETTINGS,
        ...storedSettings,
      };
    }
  } catch (e) {
    console.error("[Lyrics] Failed to load settings:", e);
  }
  return getDefaultSettings();
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  try {
    await chrome.storage.local.set({
      [SETTINGS_KEY_VALUE]: { ...getDefaultSettings(), ...settings },
    });
    return true;
  } catch (e) {
    console.error("[Lyrics] Failed to save settings:", e);
    return false;
  }
}

export async function resetSettings(): Promise<boolean> {
  try {
    await chrome.storage.local.remove(SETTINGS_KEY_VALUE);
    return true;
  } catch (e) {
    console.error("[Lyrics] Failed to reset settings:", e);
    return false;
  }
}

export function subscribeSettingsChange(
  callback: (settings: Settings) => void,
): () => void {
  const handler = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area === "local" && changes[SETTINGS_KEY_VALUE]) {
      callback(changes[SETTINGS_KEY_VALUE].newValue as Settings);
    }
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
