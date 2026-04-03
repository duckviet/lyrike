export const DEFAULT_SETTINGS = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  textSize: 15,
  activeTextSize: 16,
  visibleLineCount: 5,
  activeFontWeight: 600,
  inactiveOpacity: 0.44,
  lyricSlideDurationSec: 0.5,
  widgetWidth: 360,
  borderRadius: 20,
  backgroundOpacity: 88,
  autoScroll: true,
  hideFloatingWhenPiPOpen: false,
  usePiPDominantColorTheme: true,
  textAlign: "left",
};

export const SETTINGS_KEY = "lyrics_extension_settings";

export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}

export async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    if (result[SETTINGS_KEY]) {
      return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
    }
  } catch (e) {
    console.error("[Lyrics] Failed to load settings:", e);
  }
  return getDefaultSettings();
}

export async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({
      [SETTINGS_KEY]: { ...getDefaultSettings(), ...settings },
    });
    return true;
  } catch (e) {
    console.error("[Lyrics] Failed to save settings:", e);
    return false;
  }
}

export async function resetSettings() {
  try {
    await chrome.storage.local.remove(SETTINGS_KEY);
    return true;
  } catch (e) {
    console.error("[Lyrics] Failed to reset settings:", e);
    return false;
  }
}

export function subscribeSettingsChange(callback) {
  const handler = (changes, area) => {
    if (area === "local" && changes[SETTINGS_KEY]) {
      callback(changes[SETTINGS_KEY].newValue);
    }
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
