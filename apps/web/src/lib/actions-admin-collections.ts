"use server";

import { getDb, eq, and, count, desc, like, isNull, or } from "@clipsy/db";
import { collections, collectionItems, user } from "@clipsy/db/schema";
import { requireAdmin } from "@/lib/admin";
import { logAdminAction } from "./actions-admin-audit";
import { revalidateTag } from "next/cache";

function getShareCacheTag(collectionId: string) {
  return `share-collection-${collectionId}`;
}

export async function listPublicCollections({
  page = 1,
  search = "",
}: {
  page?: number;
  search?: string;
} = {}) {
  await requireAdmin();

  const db = getDb();
  const limit = 50;
  const offset = (page - 1) * limit;

  const searchCond = search
    ? or(
        like(collections.name, `%${search}%`),
        like(user.name, `%${search}%`),
        like(user.email, `%${search}%`),
      )
    : undefined;

  const publicCond = and(
    eq(collections.isPublic, true),
    isNull(collections.deletedAt),
  );

  const where =
    searchCond && publicCond ? and(searchCond, publicCond) : searchCond || publicCond;

  const baseQuery = db
    .select({
      id: collections.id,
      name: collections.name,
      isPublic: collections.isPublic,
      ownerName: user.name,
      ownerEmail: user.email,
      ownerId: user.id,
    })
    .from(collections)
    .innerJoin(user, eq(collections.userId, user.id));

  const baseCount = db
    .select({ count: count() })
    .from(collections)
    .innerJoin(user, eq(collections.userId, user.id));

  const query = where ? baseQuery.where(where) : baseQuery;
  const countQuery = where ? baseCount.where(where) : baseCount;

  const [collectionsList, totalResult] = await Promise.all([
    query.orderBy(desc(collections.name)).limit(limit).offset(offset),
    countQuery,
  ]);

  const collectionsWithCounts = await Promise.all(
    collectionsList.map(async (collection) => {
      const itemCount = await db
        .select({ count: count() })
        .from(collectionItems)
        .where(
          and(
            eq(collectionItems.collectionId, collection.id),
            isNull(collectionItems.deletedAt),
          ),
        )
        .get();

      return {
        ...collection,
        itemCount: itemCount?.count ?? 0,
      };
    }),
  );

  const total = totalResult[0]?.count ?? 0;

  return {
    collections: collectionsWithCounts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function moderateMakeCollectionPrivate(id: string) {
  await requireAdmin();

  const db = getDb();

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), isNull(collections.deletedAt)))
    .limit(1);

  if (!collection) {
    throw new Error("Collection not found");
  }

  await db
    .update(collections)
    .set({ isPublic: false })
    .where(eq(collections.id, id));

  revalidateTag(getShareCacheTag(id), "default");

  await logAdminAction({
    action: "collection.make_private",
    targetType: "collection",
    targetId: id,
    details: `Made collection "${collection.name}" private (owner: ${collection.userId})`,
  });
}

export async function moderateDeleteCollection(id: string) {
  await requireAdmin();

  const db = getDb();

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), isNull(collections.deletedAt)))
    .limit(1);

  if (!collection) {
    throw new Error("Collection not found");
  }

  const now = new Date();

  await db
    .update(collections)
    .set({ deletedAt: now })
    .where(eq(collections.id, id));

  revalidateTag(getShareCacheTag(id), "default");

  await logAdminAction({
    action: "collection.delete",
    targetType: "collection",
    targetId: id,
    details: `Soft-deleted collection "${collection.name}" (owner: ${collection.userId})`,
  });
}
