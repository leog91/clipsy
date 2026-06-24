export interface Item {
  id: string;
  userId: string;
  source: string;
  sourceId: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  channel: string | null;
  duration: number | null;
  status: "to_watch" | "watching";
  lastPositionSeconds: number | null;
  startAtSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  isPublic: boolean;
}

export interface ItemWithTags extends Item {
  tags: Tag[];
}

export interface ItemWithCollections extends Item {
  collections: Collection[];
}

export interface ItemWithRelations extends Item {
  tags: Tag[];
  collections: Collection[];
}

export interface SearchResult {
  items: ItemWithRelations[];
  total: number;
}

export interface CreateItemResult {
  id: string;
  updated: boolean;
}

export interface YouTubeMetadata {
  sourceId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channel?: string;
  duration?: number;
  startAtSeconds?: number;
}

export interface ChannelCategory {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  source: string;
  sourceId: string;
  name: string;
  thumbnail: string | null;
  url: string;
  lastVideoId: string | null;
  lastVideoTitle: string | null;
  lastVideoThumbnail: string | null;
  lastVideoPublishedAt: Date | null;
  lastCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  channelId: string;
  categoryId: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionWithChannel extends Subscription {
  channel: Channel;
  category: ChannelCategory | null;
  hasNew: boolean;
}
