import { LANGS } from "./lang";

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildLabelRegex(labels: string[]): RegExp {
  const pattern = labels.map((l) => escapeRegex(l)).join("|");
  return new RegExp(`^(?:${pattern})\\s*:\\s*([^\\n]{1,150})$`, "im");
}

export const ARTIST_RE = buildLabelRegex(LANGS.flatMap((l) => l.artistLabels));
export const TRACK_RE = buildLabelRegex(LANGS.flatMap((l) => l.trackLabels));
export const ALBUM_RE = buildLabelRegex(LANGS.flatMap((l) => l.albumLabels));
