import { LyricLine } from "../shared/types";

// shortcut: line-based reader for the LRCLIB lyricsfile dump (lines[].words[]),
// not a general YAML parser. Upgrade to a YAML lib if the format grows
// (block scalars / anchors inside `lines`).

function scalar(raw: string): string {
  const v = raw.trim();
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    try {
      return JSON.parse(v);
    } catch {
      return v.slice(1, -1);
    }
  }
  return v;
}

/**
 * Parses a LRCLIB `lyricsfile` into timed lines with per-word timings.
 * Returns null when it has no `lines` section or no line carries words.
 */
export function parseLyricsfile(yaml: string): LyricLine[] | null {
  if (!yaml) return null;

  const out: LyricLine[] = [];
  let inLines = false;
  let line: LyricLine | null = null;
  let word: { text: string; time?: number } | null = null;

  const flushWord = () => {
    if (line && word && typeof word.time === "number") {
      (line.words ??= []).push({ text: word.text, time: word.time });
    }
    word = null;
  };
  const flushLine = () => {
    flushWord();
    if (line) out.push(line);
    line = null;
  };

  for (const raw of yaml.split(/\r?\n/)) {
    if (!inLines) {
      if (/^lines:\s*$/.test(raw)) inLines = true;
      continue;
    }
    // Next top-level key (e.g. `plain:`) ends the section.
    if (/^[A-Za-z_]/.test(raw)) break;

    let m: RegExpMatchArray | null;
    if ((m = raw.match(/^- text:(.*)$/))) {
      flushLine();
      line = { time: NaN, text: scalar(m[1]) };
    } else if (!line) {
      continue;
    } else if ((m = raw.match(/^  - text:(.*)$/))) {
      flushWord();
      word = { text: scalar(m[1]) };
    } else if (word && (m = raw.match(/^    start_ms:\s*(\d+)\s*$/))) {
      word.time = Number(m[1]) / 1000;
    } else if ((m = raw.match(/^  start_ms:\s*(\d+)\s*$/))) {
      line.time = Number(m[1]) / 1000;
    }
  }
  flushLine();

  const lines = out
    .filter((l) => Number.isFinite(l.time))
    .map((l) => ({ ...l, isKaraoke: !!l.words?.length }))
    .sort((a, b) => a.time - b.time);

  return lines.some((l) => l.isKaraoke) ? lines : null;
}
