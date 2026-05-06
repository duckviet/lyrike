import {
  FONT_STYLE,
  LANGUAGE,
  PIP_BG_MODE,
  TEXT_ALIGN,
} from "../constants/settings";
import { Settings } from "./types";

export const CURRENT_SETTINGS_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  fontFamily: "Montserrat, sans-serif",
  textSize: 16,
  activeTextSize: 30,
  visibleLineCount: 5,
  activeFontWeight: 700,
  fontWeight: 400,
  fontStyle: FONT_STYLE.ITALIC,
  inactiveOpacity: 0.44,
  lyricSlideDurationSec: 0.4,
  widgetWidth: 360,
  borderRadius: 20,
  backgroundOpacity: 88,
  autoScroll: true,
  hideFloatingWhenPiPOpen: false,
  pipBackgroundMode: PIP_BG_MODE.VIDEO,
  textAlign: TEXT_ALIGN.LEFT,
  language: LANGUAGE.EN,
  showFloatingWidget: true,
  lineGap: 10,
  version: CURRENT_SETTINGS_VERSION,
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
      const merged: Settings = {
        ...DEFAULT_SETTINGS,
        ...storedSettings,
      };

      // Validation logic: Nếu settings quá cũ hoặc có giá trị không hợp lệ
      const isInvalid =
        !merged.version ||
        merged.version < CURRENT_SETTINGS_VERSION ||
        typeof merged.lineGap !== "number";

      if (isInvalid) {
        console.warn("[Lyrike] Old or invalid settings detected, repairing...");
        merged.version = CURRENT_SETTINGS_VERSION;

        // Logic fix cho các enum
        const VALID_PIP_MODES = Object.values(PIP_BG_MODE) as string[];
        const VALID_LANGUAGES = Object.values(LANGUAGE) as string[];
        const VALID_TEXT_ALIGNS = Object.values(TEXT_ALIGN) as string[];
        const VALID_FONT_STYLES = Object.values(FONT_STYLE) as string[];

        if (!VALID_PIP_MODES.includes(merged.pipBackgroundMode))
          merged.pipBackgroundMode = DEFAULT_SETTINGS.pipBackgroundMode;
        if (!VALID_LANGUAGES.includes(merged.language))
          merged.language = DEFAULT_SETTINGS.language;
        if (!VALID_TEXT_ALIGNS.includes(merged.textAlign))
          merged.textAlign = DEFAULT_SETTINGS.textAlign;
        if (!VALID_FONT_STYLES.includes(merged.fontStyle))
          merged.fontStyle = DEFAULT_SETTINGS.fontStyle;
      }

      return merged;
    }
  } catch (e) {
    console.error("[Lyrics] Failed to load settings:", e);
  }
  return getDefaultSettings();
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  try {
    await chrome.storage.local.set({
      [SETTINGS_KEY_VALUE]: settings,
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
      const rawValue = changes[SETTINGS_KEY_VALUE].newValue;
      const newValue = {
        ...DEFAULT_SETTINGS,
        ...(typeof rawValue === "object" && rawValue !== null ? rawValue : {}),
      } as Settings;
      callback(newValue);
    }
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
