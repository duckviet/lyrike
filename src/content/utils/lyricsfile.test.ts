import { describe, expect, test } from "vitest";
import { parseLyricsfile } from "./lyricsfile";

const SAMPLE = `version: '1.0'
metadata:
  title: Price Tag
  duration_ms: 223000
lines:
- text: Okay, Coconut man
  start_ms: 3300
  end_ms: 7943
  words:
  - text: 'Okay, '
    start_ms: 3300
  - text: 'Coconut '
    start_ms: 3708
  - text: man
    start_ms: 4116
- text: You ready?
  start_ms: 10130
  end_ms: 10969
  words:
  - text: 'everybody''s '
    start_ms: 10130
  - text: "say \\"hi\\" "
    start_ms: 10500
- text: no words here
  start_ms: 12000
plain: |-
  - text: not a line
  start_ms: 1
`;

describe("parseLyricsfile", () => {
  test("parses lines with per-word timings in seconds", () => {
    const lines = parseLyricsfile(SAMPLE)!;
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual({
      time: 3.3,
      text: "Okay, Coconut man",
      isKaraoke: true,
      words: [
        { text: "Okay, ", time: 3.3 },
        { text: "Coconut ", time: 3.708 },
        { text: "man", time: 4.116 },
      ],
    });
  });

  test("decodes single-quote escapes and double-quoted strings", () => {
    const words = parseLyricsfile(SAMPLE)![1].words!;
    expect(words[0].text).toBe("everybody's ");
    expect(words[1].text).toBe('say "hi" ');
  });

  test("keeps lines without words as non-karaoke", () => {
    const last = parseLyricsfile(SAMPLE)![2];
    expect(last.isKaraoke).toBe(false);
    expect(last.words).toBeUndefined();
  });

  test("stops at the next top-level key", () => {
    expect(parseLyricsfile(SAMPLE)!.some((l) => l.text === "not a line")).toBe(
      false,
    );
  });

  test("returns null for empty input, no lines, or no word timings", () => {
    expect(parseLyricsfile("")).toBeNull();
    expect(parseLyricsfile("version: '1.0'\nplain: x\n")).toBeNull();
    expect(
      parseLyricsfile("lines:\n- text: hi\n  start_ms: 1000\n"),
    ).toBeNull();
  });
});
