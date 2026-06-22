export interface ChannelRssVideo {
  sourceId: string;
  title: string;
  thumbnail: string;
  publishedAt: Date;
}

export interface ResolvedChannel {
  sourceId: string;
  name: string;
  thumbnail: string | null;
  url: string;
  latestVideo: ChannelRssVideo | null;
}

const CHANNEL_ID_PATTERN = /UC[\w-]{22}/;

export function extractChannelIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/\/channel\/(UC[\w-]{22})/);
    if (pathMatch) return pathMatch[1];
    return null;
  } catch {
    return null;
  }
}

export async function resolveChannelIdFromPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch channel page:", response.status);
      return null;
    }

    const html = await response.text();

    // Try canonical link first (most reliable)
    const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/i);
    if (canonicalMatch) return canonicalMatch[1];

    // Try og:url meta tag
    const ogUrlMatch = html.match(/<meta[^>]*property="og:url"[^>]*content="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/i);
    if (ogUrlMatch) return ogUrlMatch[1];

    // Try externalId in ytInitialData
    const externalIdMatch = html.match(/"externalId"\s*:\s*"(UC[\w-]{22})"/);
    if (externalIdMatch) return externalIdMatch[1];

    // Try meta channelId
    const metaMatch = html.match(/<meta[^>]*itemprop="channelId"[^>]*content="(UC[\w-]{22})"/i);
    if (metaMatch) return metaMatch[1];

    // Fallback: any channel id in the page (least reliable)
    const anyMatch = html.match(CHANNEL_ID_PATTERN);
    if (anyMatch) return anyMatch[0];

    return null;
  } catch (error) {
    console.error("Failed to resolve channel ID from page:", error);
    return null;
  }
}

export async function resolveChannelId(url: string): Promise<string | null> {
  const directId = extractChannelIdFromUrl(url);
  if (directId) return directId;
  return resolveChannelIdFromPage(url);
}

function parseRssEntry(entryXml: string): ChannelRssVideo | null {
  const videoIdMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
  const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);
  const thumbnailMatch = entryXml.match(/<media:thumbnail[^>]*url="([^"]+)"/);

  if (!videoIdMatch || !titleMatch || !publishedMatch) {
    return null;
  }

  const publishedDate = new Date(publishedMatch[1]);
  if (Number.isNaN(publishedDate.getTime())) {
    return null;
  }

  return {
    sourceId: videoIdMatch[1],
    title: titleMatch[1].trim(),
    thumbnail: thumbnailMatch?.[1] ?? `https://i.ytimg.com/vi/${videoIdMatch[1]}/hqdefault.jpg`,
    publishedAt: publishedDate,
  };
}

function parseChannelNameFromRss(rssXml: string): string | null {
  const authorMatch = rssXml.match(/<author>\s*<name>([^<]+)<\/name>/);
  const titleMatch = rssXml.match(/<title>([^<]+)<\/title>/);
  return authorMatch?.[1].trim() ?? titleMatch?.[1].trim() ?? null;
}

export async function fetchChannelRss(channelId: string): Promise<{
  name: string | null;
  latestVideo: ChannelRssVideo | null;
}> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const response = await fetch(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch channel RSS:", response.status);
      return { name: null, latestVideo: null };
    }

    const xml = await response.text();
    const name = parseChannelNameFromRss(xml);

    const entries = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/g) ?? [];
    const latestVideo = entries
      .map(parseRssEntry)
      .filter((entry): entry is ChannelRssVideo => entry !== null)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())[0] ?? null;

    return { name, latestVideo };
  } catch (error) {
    console.error("Failed to fetch channel RSS:", error);
    return { name: null, latestVideo: null };
  }
}

export async function resolveChannel(url: string): Promise<ResolvedChannel | null> {
  const sourceId = await resolveChannelId(url);
  if (!sourceId) {
    return null;
  }

  const rss = await fetchChannelRss(sourceId);
  if (!rss.name && !rss.latestVideo) {
    // We got an ID but couldn't fetch RSS — still return basic info so the user can retry later
    return {
      sourceId,
      name: "Unknown channel",
      thumbnail: null,
      url: `https://www.youtube.com/channel/${sourceId}`,
      latestVideo: null,
    };
  }

  return {
    sourceId,
    name: rss.name ?? "Unknown channel",
    thumbnail: rss.latestVideo?.thumbnail ?? null,
    url: `https://www.youtube.com/channel/${sourceId}`,
    latestVideo: rss.latestVideo,
  };
}
