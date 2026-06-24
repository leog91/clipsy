"use server";

import {
  getDb,
  eq,
  ne,
  and,
  or,
  like,
  inArray,
  count,
  isNull,
  isNotNull,
  desc,
} from "@clipsy/db";
import {
  user,
  session,
  account,
  items,
  tags,
  collections,
  itemTags,
  collectionItems,
} from "@clipsy/db/schema";
import { requireAdmin } from "@/lib/admin";
import { isAdminEmail } from "@/lib/admin-emails";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAdminAction } from "./actions-admin-audit";
import { hashPassword } from "@better-auth/utils/password";

const updateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
});

export async function listUsers({
  page = 1,
  search = "",
  includeDeleted = false,
  deletedOnly = false,
}: {
  page?: number;
  search?: string;
  includeDeleted?: boolean;
  deletedOnly?: boolean;
} = {}) {
  await requireAdmin();

  const db = getDb();
  const limit = 50;
  const offset = (page - 1) * limit;

  const selectFields = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
    emailVerified: user.emailVerified,
    deletedAt: user.deletedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  const searchCond = search
    ? or(
        like(user.name, `%${search}%`),
        like(user.email, `%${search}%`),
      )
    : undefined;

  const activeCond = deletedOnly
    ? isNotNull(user.deletedAt)
    : includeDeleted
      ? undefined
      : isNull(user.deletedAt);

  const where =
    activeCond && searchCond
      ? and(activeCond, searchCond)
      : activeCond || searchCond;

  const baseQuery = db.select(selectFields).from(user);
  const baseCount = db.select({ count: count() }).from(user);

  const usersPromise = where ? baseQuery.where(where) : baseQuery;
  const countPromise = where ? baseCount.where(where) : baseCount;

  const [users, totalResult] = await Promise.all([
    usersPromise.limit(limit).offset(offset).orderBy(desc(user.createdAt)),
    countPromise,
  ]);

  const userIds = users.map((u) => u.id);
  const itemCounts =
    userIds.length > 0
      ? await db
          .select({ userId: items.userId, count: count() })
          .from(items)
          .where(inArray(items.userId, userIds))
          .groupBy(items.userId)
      : [];
  const itemCountByUserId = new Map(
    itemCounts.map((itemCount) => [itemCount.userId, itemCount.count]),
  );

  const total = totalResult[0]?.count ?? 0;

  return {
    users: users.map((listedUser) => ({
      ...listedUser,
      itemsCount: itemCountByUserId.get(listedUser.id) ?? 0,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserWithStats(id: string) {
  await requireAdmin();

  const db = getDb();

  const [userResult, itemCount, tagCount, collectionCount] = await Promise.all([
    db.select().from(user).where(eq(user.id, id)).get(),
    db
      .select({ count: count() })
      .from(items)
      .where(and(eq(items.userId, id), isNull(items.deletedAt)))
      .get(),
    db
      .select({ count: count() })
      .from(tags)
      .where(and(eq(tags.userId, id), isNull(tags.deletedAt)))
      .get(),
    db
      .select({ count: count() })
      .from(collections)
      .where(and(eq(collections.userId, id), isNull(collections.deletedAt)))
      .get(),
  ]);

  if (!userResult) {
    throw new Error("User not found");
  }

  return {
    ...userResult,
    itemsCount: itemCount?.count ?? 0,
    tagsCount: tagCount?.count ?? 0,
    collectionsCount: collectionCount?.count ?? 0,
  };
}

export async function getTrashUserWithItems(id: string) {
  await requireAdmin();

  const db = getDb();

  const [userResult, userItems] = await Promise.all([
    db.select().from(user).where(eq(user.id, id)).get(),
    db
      .select()
      .from(items)
      .where(and(eq(items.userId, id), isNotNull(items.deletedAt)))
      .orderBy(items.deletedAt),
  ]);

  if (!userResult) {
    throw new Error("User not found");
  }

  return {
    ...userResult,
    items: userItems,
  };
}

export async function updateUser(
  id: string,
  data: z.infer<typeof updateUserSchema>,
) {
  const adminSession = await requireAdmin();

  const parsed = updateUserSchema.parse(data);

  if (
    parsed.role !== "admin" &&
    (adminSession.user.id === id || isAdminEmail(parsed.email))
  ) {
    throw new Error("You cannot remove admin access from a configured admin");
  }

  const db = getDb();

  const existing = await db
    .select()
    .from(user)
    .where(and(eq(user.email, parsed.email), ne(user.id, id)))
    .get();

  if (existing) {
    throw new Error("Email already in use by another user");
  }

  await db
    .update(user)
    .set({
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, id));

  await logAdminAction({
    action: "user.update",
    targetType: "user",
    targetId: id,
    details: `Updated user to name="${parsed.name}", email="${parsed.email}", role="${parsed.role}"`,
  });

  revalidatePath("/admin");
}

export async function softDeleteUser(id: string) {
  const adminSession = await requireAdmin();

  if (adminSession.user.id === id) {
    throw new Error("You cannot delete your own admin account");
  }

  const db = getDb();
  const now = new Date();

  const targetUser = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, id))
    .get();

  if (isAdminEmail(targetUser?.email)) {
    throw new Error("You cannot delete a configured admin account");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(user.id, id));

    await tx.update(items).set({ deletedAt: now }).where(eq(items.userId, id));
    await tx.update(tags).set({ deletedAt: now }).where(eq(tags.userId, id));
    await tx
      .update(collections)
      .set({ deletedAt: now })
      .where(eq(collections.userId, id));

    const userItemIds = (
      await tx.select({ id: items.id }).from(items).where(eq(items.userId, id))
    ).map((i) => i.id);

    const userTagIds = (
      await tx.select({ id: tags.id }).from(tags).where(eq(tags.userId, id))
    ).map((t) => t.id);

    if (userItemIds.length > 0) {
      await tx
        .update(itemTags)
        .set({ deletedAt: now })
        .where(inArray(itemTags.itemId, userItemIds));
      await tx
        .update(collectionItems)
        .set({ deletedAt: now })
        .where(inArray(collectionItems.itemId, userItemIds));
    }

    if (userTagIds.length > 0) {
      await tx
        .update(itemTags)
        .set({ deletedAt: now })
        .where(inArray(itemTags.tagId, userTagIds));
    }
  });

  await logAdminAction({
    action: "user.soft_delete",
    targetType: "user",
    targetId: id,
    details: targetUser ? `Soft-deleted user ${targetUser.email}` : undefined,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/trash");
}

export async function restoreUser(id: string) {
  await requireAdmin();

  const db = getDb();

  const targetUser = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, id))
    .get();

  if (isAdminEmail(targetUser?.email)) {
    throw new Error("You cannot delete a configured admin account");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(user.id, id));

    await tx.update(items).set({ deletedAt: null }).where(eq(items.userId, id));
    await tx.update(tags).set({ deletedAt: null }).where(eq(tags.userId, id));
    await tx
      .update(collections)
      .set({ deletedAt: null })
      .where(eq(collections.userId, id));

    const userItemIds = (
      await tx.select({ id: items.id }).from(items).where(eq(items.userId, id))
    ).map((i) => i.id);

    const userTagIds = (
      await tx.select({ id: tags.id }).from(tags).where(eq(tags.userId, id))
    ).map((t) => t.id);

    if (userItemIds.length > 0) {
      await tx
        .update(itemTags)
        .set({ deletedAt: null })
        .where(inArray(itemTags.itemId, userItemIds));
      await tx
        .update(collectionItems)
        .set({ deletedAt: null })
        .where(inArray(collectionItems.itemId, userItemIds));
    }

    if (userTagIds.length > 0) {
      await tx
        .update(itemTags)
        .set({ deletedAt: null })
        .where(inArray(itemTags.tagId, userTagIds));
    }
  });

  await logAdminAction({
    action: "user.restore",
    targetType: "user",
    targetId: id,
    details: targetUser ? `Restored user ${targetUser.email}` : undefined,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/trash");
}

export async function hardDeleteUser(id: string) {
  const adminSession = await requireAdmin();

  if (adminSession.user.id === id) {
    throw new Error("You cannot delete your own admin account");
  }

  const db = getDb();

  const targetUser = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, id))
    .get();

  await db.transaction(async (tx) => {
    const userItemIds = (
      await tx.select({ id: items.id }).from(items).where(eq(items.userId, id))
    ).map((i) => i.id);

    const userTagIds = (
      await tx.select({ id: tags.id }).from(tags).where(eq(tags.userId, id))
    ).map((t) => t.id);

    if (userItemIds.length > 0) {
      await tx
        .delete(collectionItems)
        .where(inArray(collectionItems.itemId, userItemIds));
      await tx.delete(itemTags).where(inArray(itemTags.itemId, userItemIds));
    }

    if (userTagIds.length > 0) {
      await tx.delete(itemTags).where(inArray(itemTags.tagId, userTagIds));
    }

    await tx.delete(items).where(eq(items.userId, id));
    await tx.delete(collections).where(eq(collections.userId, id));
    await tx.delete(tags).where(eq(tags.userId, id));

    await tx.delete(session).where(eq(session.userId, id));
    await tx.delete(account).where(eq(account.userId, id));

    await tx.delete(user).where(eq(user.id, id));
  });

  await logAdminAction({
    action: "user.hard_delete",
    targetType: "user",
    targetId: id,
    details: targetUser ? `Permanently deleted user ${targetUser.email}` : undefined,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/trash");
}

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export async function resetUserPassword(id: string, newPassword: string) {
  await requireAdmin();

  const parsed = resetPasswordSchema.parse({ newPassword });

  const db = getDb();
  const now = new Date();

  const targetUser = await db.select().from(user).where(eq(user.id, id)).get();
  if (!targetUser) {
    throw new Error("User not found");
  }

  const hashedPassword = await hashPassword(parsed.newPassword);

  const [existingCredentialAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, id), eq(account.providerId, "credential")))
    .limit(1);

  if (existingCredentialAccount) {
    await db
      .update(account)
      .set({ password: hashedPassword, updatedAt: now })
      .where(eq(account.id, existingCredentialAccount.id));
  } else {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.update(user).set({ updatedAt: now }).where(eq(user.id, id));

  await logAdminAction({
    action: "user.reset_password",
    targetType: "user",
    targetId: id,
    details: `Admin reset password for user ${targetUser.email}`,
  });

  revalidatePath("/admin");
}
