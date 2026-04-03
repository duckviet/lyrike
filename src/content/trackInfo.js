function pickText(selectors) {
  for (const selector of selectors) {
    const value = document.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return "";
}

function cleanTitle(value = "") {
  return value
    .replace(
      /\[(official.*?|lyrics?|mv|music video|audio|visualizer|hd|4k)\]/gi,
      "",
    )
    .replace(
      /\((official.*?|lyrics?|mv|music video|audio|visualizer|hd|4k)\)/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function inferSongInfo(title, channelName) {
  const cleaned = cleanTitle(title);
  const separators = [" - ", " – ", " — ", " | "];

  for (const separator of separators) {
    if (!cleaned.includes(separator)) continue;

    const [left, ...right] = cleaned.split(separator);
    if (left && right.length) {
      return {
        artistName: left.trim(),
        trackName: right.join(separator).trim(),
      };
    }
  }

  return { artistName: channelName || "", trackName: cleaned };
}

export function getWatchInfo() {
  if (!location.pathname.startsWith("/watch")) return null;

  const videoId = new URLSearchParams(location.search).get("v");
  if (!videoId) return null;

  const title = pickText([
    "ytd-watch-metadata h1 yt-formatted-string",
    "h1.title yt-formatted-string",
    "h1.style-scope.ytd-watch-metadata",
  ]);

  const channelName = pickText([
    "ytd-watch-metadata ytd-channel-name a",
    "#channel-name a",
    "#owner #channel-name a",
  ]);

  console.log("[Lyrics] Inferred track info:", { title, channelName });
  const { artistName, trackName } = inferSongInfo(title, channelName);
  return { videoId, title, channelName, artistName, trackName };
}
