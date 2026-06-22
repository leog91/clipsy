"use server";

import { getDb, eq, and, isNull, desc } from "@clipsy/db";
import { channels, subscriptions, channelCategories } from "@clipsy/db/schema";
import type { SubscriptionWithChannel } from "@clipsy/shared";
import { resolveChannel, fetchChannelRss } from "./youtube-channels";
import { auth } from "./auth";
import { headers } from "next/headers";

const CHECK_COOLDOWN_MINUTES = 30;

export async function createChannelAndSubscribe(url: string, categoryId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const resolved = await resolveChannel(url);
  if (!resolved) {
    throw new Error("Could not resolve channel from URL. Try a direct /channel/UC... link.");
  }

  const db = getDb();
  const now = new Date();

  // Upsert channel
  const [existingChannel] = await db
    .select()
    .from(channels)
    .where(eq(channels.sourceId, resolved.sourceId))
    .limit(1);

  let channelId: string;

  if (existingChannel) {
    channelId = existingChannel.id;
    await db
      .update(channels)
      .set({
        name: resolved.name,
        thumbnail: resolved.thumbnail,
        url: resolved.url,
        lastVideoId: resolved.latestVideo?.sourceId ?? existingChannel.lastVideoId,
        lastVideoTitle: resolved.latestVideo?.title ?? existingChannel.lastVideoTitle,
        lastVideoThumbnail: resolved.latestVideo?.thumbnail ?? existingChannel.lastVideoThumbnail,
        lastVideoPublishedAt: resolved.latestVideo?.publishedAt ?? existingChannel.lastVideoPublishedAt,
        lastCheckedAt: now,
        updatedAt: now,
      })
      .where(eq(channels.id, channelId));
  } else {
    channelId = crypto.randomUUID();
    await db.insert(channels).values({
      id: channelId,
      source: "youtube",
      sourceId: resolved.sourceId,
      name: resolved.name,
      thumbnail: resolved.thumbnail,
      url: resolved.url,
      lastVideoId: resolved.latestVideo?.sourceId ?? null,
      lastVideoTitle: resolved.latestVideo?.title ?? null,
      lastVideoThumbnail: resolved.latestVideo?.thumbnail ?? null,
      lastVideoPublishedAt: resolved.latestVideo?.publishedAt ?? null,
      lastCheckedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Validate category belongs to user if provided
  if (categoryId) {
    const [category] = await db
      .select()
      .from(channelCategories)
      .where(
        and(
          eq(channelCategories.id, categoryId),
          eq(channelCategories.userId, session.user.id),
          isNull(channelCategories.deletedAt)
        )
      )
      .limit(1);

    if (!category) {
      throw new Error("Invalid category");
    }
  }

  // Upsert subscription
  const [existingSubscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.channelId, channelId),
        isNull(subscriptions.deletedAt)
      )
    )
    .limit(1);

  if (existingSubscription) {
    await db
      .update(subscriptions)
      .set({
        categoryId: categoryId ?? existingSubscription.categoryId,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existingSubscription.id));

    return { id: existingSubscription.id, channelId };
  }

  const subscriptionId = crypto.randomUUID();
  await db.insert(subscriptions).values({
    id: subscriptionId,
    userId: session.user.id,
    channelId,
    categoryId: categoryId ?? null,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { id: subscriptionId, channelId };
}

export async function listSubscriptions(categoryId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const conditions = [
    eq(subscriptions.userId, session.user.id),
    isNull(subscriptions.deletedAt),
  ];

  if (categoryId) {
    conditions.push(eq(subscriptions.categoryId, categoryId));
  }

  const result = await db
    .select({
      subscription: subscriptions,
      channel: channels,
      category: channelCategories,
    })
    .from(subscriptions)
    .innerJoin(channels, eq(subscriptions.channelId, channels.id))
    .leftJoin(channelCategories, eq(subscriptions.categoryId, channelCategories.id))
    .where(and(...conditions))
    .orderBy(desc(channels.lastVideoPublishedAt));

  return result.map(({ subscription, channel, category }) => {
    const hasNew =
      channel.lastVideoPublishedAt !== null &&
      (subscription.lastSeenAt === null ||
        channel.lastVideoPublishedAt.getTime() > subscription.lastSeenAt.getTime());

    return {
      ...subscription,
      channel,
      category,
      hasNew,
    } as SubscriptionWithChannel;
  });
}

export async function checkForNewVideos() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const now = new Date();
  const cooldownMs = CHECK_COOLDOWN_MINUTES * 60 * 1000;

  const subscribedChannels = await db
    .select({ channel: channels, subscription: subscriptions })
    .from(subscriptions)
    .innerJoin(channels, eq(subscriptions.channelId, channels.id))
    .where(and(eq(subscriptions.userId, session.user.id), isNull(subscriptions.deletedAt)));

  const refreshResults = await Promise.allSettled(
    subscribedChannels.map(async ({ channel }) => {
      const lastChecked = channel.lastCheckedAt?.getTime() ?? 0;
      if (now.getTime() - lastChecked < cooldownMs) {
        return { channelId: channel.id, refreshed: false };
      }

      const rss = await fetchChannelRss(channel.sourceId);

      await db
        .update(channels)
        .set({
          name: rss.name ?? channel.name,
          thumbnail: rss.latestVideo?.thumbnail ?? channel.thumbnail,
          lastVideoId: rss.latestVideo?.sourceId ?? channel.lastVideoId,
          lastVideoTitle: rss.latestVideo?.title ?? channel.lastVideoTitle,
          lastVideoThumbnail: rss.latestVideo?.thumbnail ?? channel.lastVideoThumbnail,
          lastVideoPublishedAt: rss.latestVideo?.publishedAt ?? channel.lastVideoPublishedAt,
          lastCheckedAt: now,
          updatedAt: now,
        })
        .where(eq(channels.id, channel.id));

      return { channelId: channel.id, refreshed: true };
    })
  );

  const refreshedCount = refreshResults.filter(
    (r): r is PromiseFulfilledResult<{ channelId: string; refreshed: boolean }> =>
      r.status === "fulfilled" && r.value.refreshed
  ).length;

  const subscriptionsList = await listSubscriptions();

  return { refreshedCount, subscriptions: subscriptionsList };
}

export async function markSubscriptionSeen(subscriptionId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, session.user.id),
        isNull(subscriptions.deletedAt)
      )
    )
    .limit(1);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  const [channel] = await db
    .select()
    .from(channels)
    .where(eq(channels.id, subscription.channelId))
    .limit(1);

  await db
    .update(subscriptions)
    .set({
      lastSeenAt: channel?.lastVideoPublishedAt ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function unsubscribe(subscriptionId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  await db
    .delete(subscriptions)
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, session.user.id)
      )
    );
}

export async function updateSubscriptionCategory(subscriptionId: string, categoryId: string | null) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  if (categoryId) {
    const [category] = await db
      .select()
      .from(channelCategories)
      .where(
        and(
          eq(channelCategories.id, categoryId),
          eq(channelCategories.userId, session.user.id),
          isNull(channelCategories.deletedAt)
        )
      )
      .limit(1);

    if (!category) {
      throw new Error("Invalid category");
    }
  }

  await db
    .update(subscriptions)
    .set({
      categoryId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.userId, session.user.id),
        isNull(subscriptions.deletedAt)
      )
    );
}
