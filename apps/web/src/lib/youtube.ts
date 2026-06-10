import type { YouTubeMetadata } from "@clipsy/shared";

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      console.error("YouTube oEmbed failed:", response.status);
      return null;
    }

    const data = await response.json();

    return {
      sourceId: videoId,
      title: data.title || "Untitled",
      description: data.description || undefined,
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      channel: data.author_name || undefined,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube metadata:", error);
    return {
      sourceId: videoId,
      title: "Untitled",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }
}
