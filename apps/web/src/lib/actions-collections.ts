"use server";

import { getDb, eq, and, sql, isNull } from "@clipsy/db";
import { collections, collectionItems, items, tags, itemTags } from "@clipsy/db/schema";
import { auth } from "./auth";
import { headers } from "next/headers";
import { unstable_cache, revalidateTag } from "next/cache";

function getShareCacheTag(collectionId: string) {
  return `share-collection-${collectionId}`;
}

export async function createCollection(name: string, isPublic = false) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const collectionId = crypto.randomUUID();

  await db.insert(collections).values({
    id: collectionId,
    userId: session.user.id,
    name,
    isPublic,
  });

  return { id: collectionId };
}

export async function listCollections() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const result = await db
    .select()
    .from(collections)
    .where(and(eq(collections.userId, session.user.id), isNull(collections.deletedAt)));

  return result;
}

export async function addItemToCollection(itemId: string, collectionId: string) {
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
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id), isNull(items.deletedAt)))
    .limit(1);

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, session.user.id), isNull(collections.deletedAt)))
    .limit(1);

  if (!item || !collection) {
    throw new Error("Unauthorized");
  }

  const id = crypto.randomUUID();

  await db.insert(collectionItems).values({
    id,
    collectionId,
    itemId,
  });

  revalidateTag(getShareCacheTag(collectionId), "default");
}

export async function removeItemFromCollection(itemId: string, collectionId: string) {
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
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id), isNull(items.deletedAt)))
    .limit(1);

  if (!item) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.itemId, itemId),
        eq(collectionItems.collectionId, collectionId)
      )
    );

  revalidateTag(getShareCacheTag(collectionId), "default");
}

export async function listCollectionsWithCounts() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const collectionsList = await db
    .select()
    .from(collections)
    .where(and(eq(collections.userId, session.user.id), isNull(collections.deletedAt)));

  const collectionsWithCounts = await Promise.all(
    collectionsList.map(async (collection) => {
      const count = await db
        .select()
        .from(collectionItems)
        .where(and(eq(collectionItems.collectionId, collection.id), isNull(collectionItems.deletedAt)));

      return {
        ...collection,
        itemCount: count.length,
      };
    })
  );

  return collectionsWithCounts;
}

export async function createAndAddCollectionToItem(itemId: string, collectionName: string, isPublic = false) {
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
    .where(and(eq(items.id, itemId), eq(items.userId, session.user.id), isNull(items.deletedAt)))
    .limit(1);

  if (!item) {
    throw new Error("Unauthorized");
  }

  const [existingCollection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.userId, session.user.id), eq(collections.name, collectionName), isNull(collections.deletedAt)))
    .limit(1);

  let collectionId: string;

  if (!existingCollection) {
    collectionId = crypto.randomUUID();
    await db.insert(collections).values({
      id: collectionId,
      userId: session.user.id,
      name: collectionName,
      isPublic,
    });
  } else {
    collectionId = existingCollection.id;
  }

  const id = crypto.randomUUID();
  await db.insert(collectionItems).values({
    id,
    collectionId,
    itemId,
  });

  revalidateTag(getShareCacheTag(collectionId), "default");
}

export async function deleteCollection(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, session.user.id), isNull(collections.deletedAt)))
    .limit(1);

  if (!collection) {
    throw new Error("Unauthorized");
  }

  const [usageCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(collectionItems)
    .where(and(eq(collectionItems.collectionId, id), isNull(collectionItems.deletedAt)));

  if (usageCount && usageCount.count > 0) {
    throw new Error("Cannot delete collection that is being used");
  }

  await db.delete(collections).where(eq(collections.id, id));

  revalidateTag(getShareCacheTag(id), "default");
}

export async function isCollectionUsed(id: string): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, session.user.id), isNull(collections.deletedAt)))
    .limit(1);

  if (!collection) {
    throw new Error("Unauthorized");
  }

  const [usageCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(collectionItems)
    .where(and(eq(collectionItems.collectionId, id), isNull(collectionItems.deletedAt)));

  return usageCount ? usageCount.count > 0 : false;
}

export async function updateCollectionVisibility(id: string, isPublic: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, session.user.id), isNull(collections.deletedAt)))
    .limit(1);

  if (!collection) {
    throw new Error("Unauthorized");
  }

  await db
    .update(collections)
    .set({ isPublic })
    .where(eq(collections.id, id));

  revalidateTag(getShareCacheTag(id), "default");
}

export interface PublicCollectionWithItems {
  id: string;
  name: string;
  isPublic: boolean;
  items: {
    id: string;
    sourceId: string;
    url: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    channel: string | null;
    duration: number | null;
    startAtSeconds: number | null;
    tags: {
      id: string;
      name: string;
    }[];
  }[];
}

const fetchPublicCollection = async (id: string): Promise<PublicCollectionWithItems | null> => {
  const db = getDb();

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.isPublic, true), isNull(collections.deletedAt)))
    .limit(1);

  if (!collection) {
    return null;
  }

  const collectionItemsList = await db
    .select({ item: items })
    .from(collectionItems)
    .innerJoin(items, eq(collectionItems.itemId, items.id))
    .where(
      and(
        eq(collectionItems.collectionId, id),
        isNull(collectionItems.deletedAt),
        isNull(items.deletedAt)
      )
    )
    .orderBy(sql`${items.createdAt} desc`);

  const itemsWithTags = await Promise.all(
    collectionItemsList.map(async ({ item }) => {
      const itemTagsList = await db
        .select({ id: tags.id, name: tags.name })
        .from(itemTags)
        .innerJoin(tags, eq(itemTags.tagId, tags.id))
        .where(and(eq(itemTags.itemId, item.id), isNull(itemTags.deletedAt)));

      return {
        id: item.id,
        sourceId: item.sourceId,
        url: item.url,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        channel: item.channel,
        duration: item.duration,
        startAtSeconds: item.startAtSeconds,
        tags: itemTagsList,
      };
    })
  );

  return {
    id: collection.id,
    name: collection.name,
    isPublic: collection.isPublic,
    items: itemsWithTags,
  };
};

export async function getPublicCollectionById(id: string): Promise<PublicCollectionWithItems | null> {
  const cachedFetch = unstable_cache(
    () => fetchPublicCollection(id),
    [`public-collection-${id}`],
    {
      tags: [getShareCacheTag(id)],
      revalidate: 60,
    }
  );

  return cachedFetch();
}