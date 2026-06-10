"use server";

import { getDb, eq, and, sql } from "@clipsy/db";
import { tags, itemTags } from "@clipsy/db/schema";
import { auth } from "./auth";
import { headers } from "next/headers";

export async function createTag(name: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const tagId = crypto.randomUUID();

  await db.insert(tags).values({
    id: tagId,
    userId: session.user.id,
    name,
  });

  return { id: tagId };
}

export async function listTags() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const result = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, session.user.id));

  return result;
}

export async function addTagToItem(itemId: string, tagId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const id = crypto.randomUUID();

  await db.insert(itemTags).values({
    id,
    itemId,
    tagId,
  });
}

export async function listTagsWithCounts() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const tagsList = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, session.user.id));

  const tagsWithCounts = await Promise.all(
    tagsList.map(async (tag) => {
      const count = await db
        .select()
        .from(itemTags)
        .where(eq(itemTags.tagId, tag.id));

      return {
        ...tag,
        itemCount: count.length,
      };
    })
  );

  return tagsWithCounts;
}

export async function createAndAddTagToItem(itemId: string, tagName: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [existingTag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, session.user.id), eq(tags.name, tagName)))
    .limit(1);

  let tagId: string;

  if (!existingTag) {
    tagId = crypto.randomUUID();
    await db.insert(tags).values({
      id: tagId,
      userId: session.user.id,
      name: tagName,
    });
  } else {
    tagId = existingTag.id;
  }

  const id = crypto.randomUUID();
  await db.insert(itemTags).values({
    id,
    itemId,
    tagId,
  });
}

export async function removeTagFromItem(itemId: string, tagId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  await db
    .delete(itemTags)
    .where(and(eq(itemTags.itemId, itemId), eq(itemTags.tagId, tagId)));
}

export async function deleteTag(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [usageCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(itemTags)
    .where(eq(itemTags.tagId, id));

  if (usageCount && usageCount.count > 0) {
    throw new Error("Cannot delete tag that is being used");
  }

  await db.delete(tags).where(and(eq(tags.id, id), eq(tags.userId, session.user.id)));
}

export async function isTagUsed(id: string): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [usageCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(itemTags)
    .where(eq(itemTags.tagId, id));

  return usageCount ? usageCount.count > 0 : false;
}
