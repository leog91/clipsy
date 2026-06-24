"use server";

import { getDb, eq, and, count, gte, isNull, isNotNull, sql } from "@clipsy/db";
import { user, items, collections, tags } from "@clipsy/db/schema";
import { requireAdmin } from "@/lib/admin";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminDashboardStats() {
  await requireAdmin();

  const db = getDb();
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalItems,
    itemsToday,
    itemsThisWeek,
    activeUsers,
    publicCollections,
    totalCollections,
    totalTags,
    deletedUsers,
    recentSignups,
  ] = await Promise.all([
    db.select({ count: count() }).from(user).where(isNull(user.deletedAt)).get(),
    db.select({ count: count() }).from(items).where(isNull(items.deletedAt)).get(),
    db
      .select({ count: count() })
      .from(items)
      .where(and(isNull(items.deletedAt), gte(items.createdAt, todayStart)))
      .get(),
    db
      .select({ count: count() })
      .from(items)
      .where(and(isNull(items.deletedAt), gte(items.createdAt, weekStart)))
      .get(),
    db
      .select({ count: sql<number>`count(distinct ${items.userId})` })
      .from(items)
      .where(and(isNull(items.deletedAt), gte(items.createdAt, thirtyDaysAgo)))
      .get(),
    db
      .select({ count: count() })
      .from(collections)
      .where(and(isNull(collections.deletedAt), eq(collections.isPublic, true)))
      .get(),
    db.select({ count: count() }).from(collections).where(isNull(collections.deletedAt)).get(),
    db.select({ count: count() }).from(tags).where(isNull(tags.deletedAt)).get(),
    db.select({ count: count() }).from(user).where(isNotNull(user.deletedAt)).get(),
    db
      .select({ count: count() })
      .from(user)
      .where(and(isNull(user.deletedAt), gte(user.createdAt, thirtyDaysAgo)))
      .get(),
  ]);

  return {
    totalUsers: totalUsers?.count ?? 0,
    totalItems: totalItems?.count ?? 0,
    itemsToday: itemsToday?.count ?? 0,
    itemsThisWeek: itemsThisWeek?.count ?? 0,
    activeUsers: activeUsers?.count ?? 0,
    publicCollections: publicCollections?.count ?? 0,
    totalCollections: totalCollections?.count ?? 0,
    totalTags: totalTags?.count ?? 0,
    deletedUsers: deletedUsers?.count ?? 0,
    recentSignups: recentSignups?.count ?? 0,
  };
}
