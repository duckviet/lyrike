
// @ts-ignore
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
// @ts-ignore
const BASE_URL = import.meta.env.VITE_YOUTUBE_LEAP_BASE_URL;

export interface VideoDetails {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  viewCount: string;
  publishedAt: string;
  description: string;
}

export const fetchVideoDetails = async (videoId: string): Promise<VideoDetails> => {
  const response = await fetch(
    `${BASE_URL}/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`
  );
  const data = await response.json();
  
  if (!data.items?.[0]) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  return {
    id: video.id,
    title: video.snippet.title,
    thumbnail: video.snippet.thumbnails.high.url,
    channelTitle: video.snippet.channelTitle,
    viewCount: video.statistics.viewCount,
    publishedAt: video.snippet.publishedAt,
    description: video.snippet.description
  };
};