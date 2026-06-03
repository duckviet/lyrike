export { inferSongInfo } from "./infer";
export {
  normalizeForCmp,
  similarityScore,
  normalizeChannelToArtist,
  extractPrimaryArtist,
} from "./normalize";

export function pickText(selectors: string[]): string {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return "";
}

export function getVideoIdFromURL(): string | null {
  if (!location.pathname.startsWith("/watch")) return null;
  return new URLSearchParams(location.search).get("v");
}
