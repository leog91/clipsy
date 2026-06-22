"use server";

import { getDb, eq, and, isNull, desc, sql } from "@clipsy/db";
import { channelCategories, subscriptions } from "@clipsy/db/schema";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function createCategory(name: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const categoryId = crypto.randomUUID();
  const now = new Date();

  await db.insert(channelCategories).values({
    id: categoryId,
    userId: session.user.id,
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
  });

  return { id: categoryId };
}

export async function listCategories() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  return db
    .select()
    .from(channelCategories)
    .where(and(eq(channelCategories.userId, session.user.id), isNull(channelCategories.deletedAt)))
    .orderBy(desc(channelCategories.createdAt));
}

export async function deleteCategory(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [category] = await db
    .select()
    .from(channelCategories)
    .where(and(eq(channelCategories.id, id), eq(channelCategories.userId, session.user.id), isNull(channelCategories.deletedAt)))
    .limit(1);

  if (!category) {
    throw new Error("Category not found");
  }

  const [usageCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(and(eq(subscriptions.categoryId, id), eq(subscriptions.userId, session.user.id), isNull(subscriptions.deletedAt)));

  if (usageCount && usageCount.count > 0) {
    throw new Error("Cannot delete category that is being used");
  }

  await db.delete(channelCategories).where(eq(channelCategories.id, id));
}
