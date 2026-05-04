const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const BASE_URL = import.meta.env.VITE_YOUTUBE_LEAP_BASE_URL;

export function canFetchVideoDetails(): boolean {
  return Boolean(API_KEY && BASE_URL);
}

export interface VideoDetails {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  viewCount: string;
  publishedAt: string;
  description: string;
}

export const fetchVideoDetails = async (
  videoId: string,
): Promise<VideoDetails> => {
  if (!canFetchVideoDetails()) {
    throw new Error("Video details API is not configured");
  }

  const response = await fetch(
    `${BASE_URL}/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`,
  );

  if (!response.ok) {
    throw new Error(`Video details request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items?.[0]) {
    throw new Error("Video not found");
  }

  const video = data.items[0];
  return {
    id: video.id,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails.high.url,
    channelTitle: video.snippet.channelTitle,
    viewCount: video.statistics.viewCount,
    publishedAt: video.snippet.publishedAt,
    description: video.snippet.description,
  };
};
