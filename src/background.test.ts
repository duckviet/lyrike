import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock chrome extension API using vi.hoisted so it runs before imports are resolved
let mockStore: Record<string, any> = {};

vi.hoisted(() => {
  global.chrome = {
    storage: {
      local: {
        get: vi.fn(async (keys) => {
          if (typeof keys === "string") {
            return { [keys]: mockStore[keys] };
          }
          if (Array.isArray(keys)) {
            const res: Record<string, any> = {};
            for (const k of keys) {
              res[k] = mockStore[k];
            }
            return res;
          }
          return {};
        }),
        set: vi.fn(async (items) => {
          Object.assign(mockStore, items);
        }),
        remove: vi.fn(async (keys) => {
          if (typeof keys === "string") {
            delete mockStore[keys];
          } else if (Array.isArray(keys)) {
            for (const k of keys) {
              delete mockStore[k];
            }
          }
        }),
      },
    },
    runtime: {
      onMessage: {
        addListener: vi.fn(),
      },
    },
  } as any;
});

import {
  normalizeText,
  scoreResult,
  resolveCachedEntry,
  searchOnce,
  findLyrics,
  lyricsOffsetKey,
  SYNCED_LYRICS_BONUS,
} from "./background";
import { LyricsData } from "./content/shared/types";

describe("background helper functions", () => {
  beforeEach(() => {
    mockStore = {};
    vi.restoreAllMocks();
  });

  describe("normalizeText", () => {
    test("should normalize accents, punctuation, and spaces", () => {
      expect(normalizeText("Đường Về Nhà!")).toBe("đuong ve nha");
      expect(normalizeText("  Hello...   World  ")).toBe("hello world");
    });
  });

  describe("scoreResult", () => {
    const dummyResult: LyricsData = {
      id: 123,
      trackName: "Em",
      artistName: "Binz",
      albumName: "Gap Lai",
      instrumental: false,
      plainLyrics: "lyrics",
      syncedLyrics: "[00:10.00] lyrics",
    };

    test("should score synced lyrics higher", () => {
      const unsynced = { ...dummyResult, syncedLyrics: null };
      const scoreWithSync = scoreResult(dummyResult, "Em", "Binz", "Gap Lai");
      const scoreNoSync = scoreResult(unsynced, "Em", "Binz", "Gap Lai");

      expect(scoreWithSync).toBe(scoreNoSync + SYNCED_LYRICS_BONUS);
    });

    test("should award EXACT_MATCH_BONUS for equal track, artist, album", () => {
      const scoreExact = scoreResult(dummyResult, "Em", "Binz", "Gap Lai");
      // base is: synced(100) + exact track(10) + exact artist(10) + exact album(10) + partial track(4) + partial artist(4) + partial album(4) = 142
      expect(scoreExact).toBe(142);
    });

    test("should award PARTIAL_MATCH_BONUS for substring matches", () => {
      const scorePartial = scoreResult(dummyResult, "Em Moi", "Binz Poet", "Gap Lai Mini");
      // synced(100) + partial track(4) + partial artist(4) + partial album(4) = 112
      expect(scorePartial).toBe(112);
    });

    test("should award karaoke bonus if prioritizeKaraoke is enabled and result contains karaoke", () => {
      const karaokeResult = { ...dummyResult, trackName: "Em - Karaoke" };
      const scoreWithPrioritize = scoreResult(karaokeResult, "Em", "Binz", "Gap Lai", true);
      const scoreWithoutPrioritize = scoreResult(karaokeResult, "Em", "Binz", "Gap Lai", false);
      expect(scoreWithPrioritize).toBe(scoreWithoutPrioritize + 150);
    });
  });

  describe("resolveCachedEntry", () => {
    test("should return null if cache is empty", async () => {
      const result = await resolveCachedEntry("lyrics:binz:em", undefined);
      expect(result).toBeNull();
    });

    test("should parse simple numeric ID cache", async () => {
      const result = await resolveCachedEntry("lyrics:binz:em", 12345);
      expect(result).toEqual({ id: 12345, offsetMs: 0 });
    });

    test("should parse string ID#offset cache", async () => {
      const result = await resolveCachedEntry("lyrics:binz:em", "12345#500");
      expect(result).toEqual({ id: 12345, offsetMs: 500 });
    });

    test("should migrate legacy object cache to new ID#offset string format", async () => {
      const legacyObject = { id: 9876, trackName: "Em", plainLyrics: "..." };
      const result = await resolveCachedEntry("lyrics:binz:em", legacyObject);

      expect(result).toEqual({ id: 9876, offsetMs: 0 });
      // Should have saved the migration in chrome.storage
      expect(mockStore["lyrics:binz:em"]).toBe("9876#0");
      expect(mockStore[lyricsOffsetKey(9876)]).toBe(0);
    });
  });

  describe("searchOnce and findLyrics using API mocks", () => {
    const dummyAPIResult: LyricsData = {
      id: 555,
      trackName: "Em",
      artistName: "Binz",
      albumName: "Gap Lai",
      instrumental: false,
      plainLyrics: "plain...",
      syncedLyrics: "synced...",
    };

    test("searchOnce: should hit cache if present", async () => {
      // Setup cache
      mockStore["lyrics:binz:em:gap lai"] = "555#100";

      // Mock fetch
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => dummyAPIResult,
      } as any);

      const result = await searchOnce({
        trackName: "Em",
        artistName: "Binz",
        albumName: "Gap Lai",
      });

      expect(result).toEqual({ ...dummyAPIResult, offsetMs: 100 });
      expect(fetchSpy).toHaveBeenCalledWith("https://lrclib.net/api/get/555");
    });

    test("searchOnce: cache miss should perform query search and cache result", async () => {
      // Mock search query fetch
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => [dummyAPIResult],
      } as any);

      const result = await searchOnce({
        trackName: "Em",
        artistName: "Binz",
        albumName: "Gap Lai",
      });

      expect(result).toEqual(dummyAPIResult);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("https://lrclib.net/api/search?track_name=Em&artist_name=Binz&album_name=Gap+Lai")
      );
      // Cache should be set
      expect(mockStore["lyrics:binz:em:gap lai"]).toBe("555#0");
    });

    test("searchOnce: cache hit with stale ID (404) should clear cache and query search API", async () => {
      mockStore["lyrics:binz:em:gap lai"] = "555#0";

      // Mock fetch: first call 404 (ID), second call 200 (search query)
      const fetchSpy = vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          status: 404,
          ok: false,
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => [dummyAPIResult],
        } as any);

      const result = await searchOnce({
        trackName: "Em",
        artistName: "Binz",
        albumName: "Gap Lai",
      });

      expect(result).toEqual(dummyAPIResult);
      // Stale cache cleared
      expect(mockStore["lyrics:binz:em:gap lai"]).toBe("555#0");
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    test("findLyrics: should try candidates sequentially", async () => {
      // Mock searches: first returns empty, second returns lyrics
      const fetchSpy = vi.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => [dummyAPIResult],
        } as any);

      const payload = {
        trackName: "Em",
        artistName: "Binz",
        channelName: "Binz Da Poet",
        originalTitle: "Binz - Em",
        albumName: "Gap Lai",
      };

      const result = await findLyrics(payload);
      expect(result).toEqual(dummyAPIResult);
      // Should have run search twice (candidate 1: with album, candidate 2: without album)
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
