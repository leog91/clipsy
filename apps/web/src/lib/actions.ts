"use server";

import { getDb, eq, and, desc, isNull } from "@clipsy/db";
import { items, tags, itemTags, collections, collectionItems } from "@clipsy/db/schema";
import type { ItemWithRelations, UpdateItemInput, CreateItemResult } from "@clipsy/shared";
import { fetchYouTubeMetadata } from "./youtube";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function createItemFromUrl(url: string): Promise<CreateItemResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const metadata = await fetchYouTubeMetadata(url);
  if (!metadata) {
    throw new Error("Failed to fetch video metadata");
  }

  const db = getDb();
  const now = new Date();

  const [existingItem] = await db
    .select()
    .from(items)
    .where(and(eq(items.userId, session.user.id), eq(items.source, "youtube"), eq(items.sourceId, metadata.sourceId)))
    .limit(1);

  if (existingItem) {
    const startAtSeconds = metadata.startAtSeconds ?? existingItem.startAtSeconds;
    const lastPositionSeconds = metadata.startAtSeconds ?? existingItem.lastPositionSeconds;

    await db
      .update(items)
      .set({
        url,
        title: metadata.title,
        description: metadata.description || null,
        thumbnail: metadata.thumbnail || null,
        channel: metadata.channel || null,
        duration: metadata.duration || null,
        startAtSeconds,
        lastPositionSeconds,
        deletedAt: null,
        updatedAt: now,
      })
      .where(eq(items.id, existingItem.id));

    return { id: existingItem.id, updated: true };
  }

  const itemId = crypto.randomUUID();

  await db.insert(items).values({
    id: itemId,
    userId: session.user.id,
    source: "youtube",
    sourceId: metadata.sourceId,
    url,
    title: metadata.title,
    description: metadata.description || null,
    thumbnail: metadata.thumbnail || null,
    channel: metadata.channel || null,
    duration: metadata.duration || null,
    startAtSeconds: metadata.startAtSeconds ?? null,
    lastPositionSeconds: metadata.startAtSeconds ?? null,
    status: "to_watch",
    createdAt: now,
    updatedAt: now,
  });

  return { id: itemId, updated: false };
}

export async function findExistingItemIdBySourceId(sourceId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const db = getDb();

  const [item] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.userId, session.user.id), eq(items.sourceId, sourceId), isNull(items.deletedAt)))
    .limit(1);

  return item?.id ?? null;
}

export async function listItems(status?: "to_watch" | "watching") {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const conditions = [eq(items.userId, session.user.id), isNull(items.deletedAt)];
  if (status) {
    conditions.push(eq(items.status, status));
  }

  const result = await db
    .select()
    .from(items)
    .where(and(...conditions))
    .orderBy(desc(items.createdAt));

  const itemsWithRelations: ItemWithRelations[] = await Promise.all(
    result.map(async (item) => {
      const [itemTagsList, itemCollections] = await Promise.all([
        db
          .select({ tag: tags })
          .from(itemTags)
          .innerJoin(tags, eq(itemTags.tagId, tags.id))
          .where(eq(itemTags.itemId, item.id)),
        db
          .select({ collection: collections })
          .from(collectionItems)
          .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
          .where(eq(collectionItems.itemId, item.id)),
      ]);

      return {
        ...item,
        tags: itemTagsList.map((t) => t.tag),
        collections: itemCollections.map((c) => c.collection),
      };
    })
  );

  return itemsWithRelations;
}

export async function getItemById(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.userId, session.user.id), isNull(items.deletedAt)));

  if (!item) {
    return null;
  }

  const [itemTagsList, itemCollections] = await Promise.all([
    db
      .select({ tag: tags })
      .from(itemTags)
      .innerJoin(tags, eq(itemTags.tagId, tags.id))
      .where(eq(itemTags.itemId, item.id)),
    db
      .select({ collection: collections })
      .from(collectionItems)
      .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
      .where(eq(collectionItems.itemId, item.id)),
  ]);

  return {
    ...item,
    tags: itemTagsList.map((t) => t.tag),
    collections: itemCollections.map((c) => c.collection),
  };
}

export async function updateItem(id: string, data: UpdateItemInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  await db
    .update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(items.id, id), eq(items.userId, session.user.id)));
}

export async function searchItems(query: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const allItems = await db
    .select()
    .from(items)
    .where(and(eq(items.userId, session.user.id), isNull(items.deletedAt)))
    .orderBy(desc(items.createdAt));

  const searchLower = query.toLowerCase();

  const filtered = allItems.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(searchLower);
    const channelMatch = item.channel?.toLowerCase().includes(searchLower);
    return titleMatch || channelMatch;
  });

  const itemsWithRelations: ItemWithRelations[] = await Promise.all(
    filtered.map(async (item) => {
      const [itemTagsList, itemCollections] = await Promise.all([
        db
          .select({ tag: tags })
          .from(itemTags)
          .innerJoin(tags, eq(itemTags.tagId, tags.id))
          .where(eq(itemTags.itemId, item.id)),
        db
          .select({ collection: collections })
          .from(collectionItems)
          .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
          .where(eq(collectionItems.itemId, item.id)),
      ]);

      return {
        ...item,
        tags: itemTagsList.map((t) => t.tag),
        collections: itemCollections.map((c) => c.collection),
      };
    })
  );

  return itemsWithRelations;
}

export async function listItemsByTag(tagId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const taggedItems = await db
    .select({ item: items })
    .from(itemTags)
    .innerJoin(items, eq(itemTags.itemId, items.id))
    .where(and(eq(itemTags.tagId, tagId), eq(items.userId, session.user.id), isNull(items.deletedAt)))
    .orderBy(desc(items.createdAt));

  const itemsWithRelations: ItemWithRelations[] = await Promise.all(
    taggedItems.map(async ({ item }) => {
      const [itemTagsList, itemCollections] = await Promise.all([
        db
          .select({ tag: tags })
          .from(itemTags)
          .innerJoin(tags, eq(itemTags.tagId, tags.id))
          .where(eq(itemTags.itemId, item.id)),
        db
          .select({ collection: collections })
          .from(collectionItems)
          .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
          .where(eq(collectionItems.itemId, item.id)),
      ]);

      return {
        ...item,
        tags: itemTagsList.map((t) => t.tag),
        collections: itemCollections.map((c) => c.collection),
      };
    })
  );

  return itemsWithRelations;
}

export async function listItemsByCollection(collectionId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const collectionItemsList = await db
    .select({ item: items })
    .from(collectionItems)
    .innerJoin(items, eq(collectionItems.itemId, items.id))
    .where(and(eq(collectionItems.collectionId, collectionId), eq(items.userId, session.user.id), isNull(items.deletedAt)))
    .orderBy(desc(items.createdAt));

  const itemsWithRelations: ItemWithRelations[] = await Promise.all(
    collectionItemsList.map(async ({ item }) => {
      const [itemTagsList, itemCollections] = await Promise.all([
        db
          .select({ tag: tags })
          .from(itemTags)
          .innerJoin(tags, eq(itemTags.tagId, tags.id))
          .where(eq(itemTags.itemId, item.id)),
        db
          .select({ collection: collections })
          .from(collectionItems)
          .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
          .where(eq(collectionItems.itemId, item.id)),
      ]);

      return {
        ...item,
        tags: itemTagsList.map((t) => t.tag),
        collections: itemCollections.map((c) => c.collection),
      };
    })
  );

  return itemsWithRelations;
}

export async function deleteItem(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  await db.delete(itemTags).where(eq(itemTags.itemId, id));
  await db.delete(collectionItems).where(eq(collectionItems.itemId, id));
  await db.delete(items).where(and(eq(items.id, id), eq(items.userId, session.user.id)));
}
