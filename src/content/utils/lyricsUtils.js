export function parseSyncedLyrics(lrcText = "") {
  return lrcText
    .split("\n")
    .flatMap((rawLine) => {
      const matches = [
        ...rawLine.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g),
      ];
      const text = rawLine.replace(/\[[^\]]+\]/g, "").trim();

      return matches.map((match) => {
        const minute = Number(match[1] || 0);
        const second = Number(match[2] || 0);
        const fractionRaw = match[3] || "0";
        const fraction =
          fractionRaw.length === 3
            ? Number(fractionRaw) / 1000
            : Number(fractionRaw) / 100;

        return { time: minute * 60 + second + fraction, text };
      });
    })
    .sort((a, b) => a.time - b.time);
}

export function getActiveLineIndex(lines, currentTime) {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (currentTime >= lines[i].time) return i;
  }
  return -1;
}

export function getVisibleLines(lines, activeIndex, visibleCount) {
  if (!lines.length) return [];
  if (activeIndex < 0) return lines.slice(0, visibleCount);

  const half = Math.floor(visibleCount / 2);
  const start = Math.max(0, activeIndex - half);
  const end = Math.min(lines.length, start + visibleCount);

  return lines.slice(start, end);
}
