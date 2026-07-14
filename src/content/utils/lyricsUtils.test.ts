import { describe, test, expect } from "vitest";
import { parseSyncedLyrics } from "./lyricsUtils";

describe("parseSyncedLyrics", () => {
  const karaokeLrc = [
    "[ar:KAZE]",
    "[ti:Tu Olvido]",
    "[00:19.73]<00:19.85>Y <00:20.05>es <00:20.31>que <00:20.47>tu <00:20.69>olvido <00:21.10>me <00:21.73>visita <00:22.19>más <00:22.47>que <00:22.80>tú",
    "[00:24.50]<00:24.67>Y <00:24.95>yo <00:25.13>le <00:25.41>canto <00:25.60>bajito",
  ].join("\n");

  test("should parse karaoke lyrics correctly when prioritizeKaraoke is true", () => {
    const lines = parseSyncedLyrics(karaokeLrc, true);
    expect(lines.length).toBe(2);

    // Line 1
    expect(lines[0].time).toBe(19.73);
    expect(lines[0].text).toBe("Y es que tu olvido me visita más que tú");
    expect(lines[0].isKaraoke).toBe(true);
    expect(lines[0].words).toBeDefined();
    expect(lines[0].words?.length).toBe(10);
    expect(lines[0].words?.[0]).toEqual({ time: 19.85, text: "Y " });
    expect(lines[0].words?.[1]).toEqual({ time: 20.05, text: "es " });

    // Line 2
    expect(lines[1].time).toBe(24.50);
    expect(lines[1].text).toBe("Y yo le canto bajito");
    expect(lines[1].isKaraoke).toBe(true);
    expect(lines[1].words).toBeDefined();
  });

  test("should strip karaoke tags and parse as normal synced lyrics when prioritizeKaraoke is false", () => {
    const lines = parseSyncedLyrics(karaokeLrc, false);
    expect(lines.length).toBe(2);

    // Line 1
    expect(lines[0].time).toBe(19.73);
    expect(lines[0].text).toBe("Y es que tu olvido me visita más que tú");
    expect(lines[0].isKaraoke).toBe(false);
    expect(lines[0].words).toBeUndefined();

    // Line 2
    expect(lines[1].time).toBe(24.50);
    expect(lines[1].text).toBe("Y yo le canto bajito");
    expect(lines[1].isKaraoke).toBe(false);
    expect(lines[1].words).toBeUndefined();
  });

  test("should handle non-karaoke lyrics when prioritizeKaraoke is true", () => {
    const normalLrc = "[00:19.73]Y es que tu olvido me visita";
    const lines = parseSyncedLyrics(normalLrc, true);
    expect(lines.length).toBe(1);
    expect(lines[0].time).toBe(19.73);
    expect(lines[0].text).toBe("Y es que tu olvido me visita");
    expect(lines[0].isKaraoke).toBe(false);
    expect(lines[0].words).toBeUndefined();
  });

  test("should default to prioritizing karaoke when parameter is omitted", () => {
    const lines = parseSyncedLyrics(karaokeLrc);
    expect(lines[0].isKaraoke).toBe(true);
    expect(lines[0].words).toBeDefined();
  });
});
