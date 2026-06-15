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

export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function parseYouTubeTimestamp(url: string): number | undefined {
  try {
    const parsed = new URL(url);
    const timeParam = parsed.searchParams.get("t") || parsed.searchParams.get("start");
    if (!timeParam) return undefined;

    // Plain integer seconds (e.g. t=123)
    const numeric = Number(timeParam);
    if (!Number.isNaN(numeric) && numeric >= 0) {
      return numeric;
    }

    // YouTube-style duration (e.g. t=1h2m3s, t=2m3s, t=123s)
    const match = String(timeParam).match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
    if (!match) return undefined;

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);

    const total = hours * 3600 + minutes * 60 + seconds;
    return total > 0 ? total : undefined;
  } catch {
    return undefined;
  }
}

export async function fetchYouTubeMetadata(url: string): Promise<YouTubeMetadata | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const startAtSeconds = parseYouTubeTimestamp(url);

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
      startAtSeconds,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube metadata:", error);
    return {
      sourceId: videoId,
      title: "Untitled",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      startAtSeconds,
    };
  }
}
