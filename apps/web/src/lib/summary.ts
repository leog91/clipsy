import { getDb, and, eq, isNull, count, sql, type Database } from "@clipsy/db";
import {
  items,
  collections,
  subscriptions,
  channels,
  user,
} from "@clipsy/db/schema";

export async function readSummary(owner: string, db: Database = getDb()) {
  const [account] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, owner), isNull(user.deletedAt)))
    .limit(1);
  if (!account) return null;
  const [[videos], [groups], [following]] = await Promise.all([
    db
      .select({
        total: count(),
        toWatch: sql<number>`coalesce(sum(case when ${items.status} = 'to_watch' then 1 else 0 end), 0)`,
        watching: sql<number>`coalesce(sum(case when ${items.status} = 'watching' then 1 else 0 end), 0)`,
      })
      .from(items)
      .where(
        and(
          eq(items.userId, owner),
          eq(items.source, "youtube"),
          isNull(items.deletedAt),
        ),
      ),
    db
      .select({ total: count() })
      .from(collections)
      .where(and(eq(collections.userId, owner), isNull(collections.deletedAt))),
    db
      .select({ total: count() })
      .from(subscriptions)
      .innerJoin(channels, eq(subscriptions.channelId, channels.id))
      .where(
        and(
          eq(subscriptions.userId, owner),
          isNull(subscriptions.deletedAt),
          isNull(channels.deletedAt),
        ),
      ),
  ]);
  return {
    videos: videos.total,
    toWatch: Number(videos.toWatch),
    watching: Number(videos.watching),
    collections: groups.total,
    subscriptions: following.total,
  };
}
