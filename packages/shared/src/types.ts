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

export interface YouTubeMetadata {
  sourceId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channel?: string;
  duration?: number;
}
