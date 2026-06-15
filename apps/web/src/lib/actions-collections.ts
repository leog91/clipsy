"use server";

import { getDb, eq, and, sql, isNull } from "@clipsy/db";
import { collections, collectionItems, items } from "@clipsy/db/schema";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function createCollection(name: string) {
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

export async function createAndAddCollectionToItem(itemId: string, collectionName: string) {
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
