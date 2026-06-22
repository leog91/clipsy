"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionWithChannel, ChannelCategory } from "@clipsy/shared";
import {
  markSubscriptionSeen,
  unsubscribe,
  updateSubscriptionCategory,
} from "@/lib/actions-subscriptions";

interface SubscriptionCardProps {
  subscription: SubscriptionWithChannel;
  categories: ChannelCategory[];
}

export function SubscriptionCard({ subscription, categories }: SubscriptionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { channel, hasNew } = subscription;

  const handleCategoryChange = (categoryId: string) => {
    startTransition(async () => {
      await updateSubscriptionCategory(subscription.id, categoryId || null);
      router.refresh();
    });
  };

  const handleMarkSeen = () => {
    startTransition(async () => {
      await markSubscriptionSeen(subscription.id);
      router.refresh();
    });
  };

  const handleUnsubscribe = () => {
    if (!confirm("Are you sure you want to unsubscribe?")) return;
    startTransition(async () => {
      await unsubscribe(subscription.id);
      router.refresh();
    });
  };

  return (
    <div className={`bg-gray-800 border rounded-xl p-4 ${isPending ? "opacity-60" : "border-gray-700"}`}>
      <div className="flex gap-4">
        {channel.thumbnail && (
          <img
            src={channel.thumbnail}
            alt={channel.name}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-gray-100 hover:text-blue-400"
              >
                {channel.name}
              </a>
              {hasNew && (
                <span className="ml-2 px-2 py-0.5 bg-green-900 text-green-200 text-xs rounded-full">
                  New
                </span>
              )}
            </div>
            <button
              onClick={handleUnsubscribe}
              disabled={isPending}
              className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
            >
              Unsubscribe
            </button>
          </div>

          {channel.lastVideoTitle ? (
            <div className="mt-2">
              <p className="text-sm text-gray-400">Latest video</p>
              <a
                href={`https://www.youtube.com/watch?v=${channel.lastVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-200 hover:text-blue-400 line-clamp-1"
              >
                {channel.lastVideoTitle}
              </a>
              {channel.lastVideoPublishedAt && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatRelativeDate(channel.lastVideoPublishedAt)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No recent videos found</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={subscription.categoryId ?? ""}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={isPending}
              className="text-xs px-2 py-1 bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none disabled:opacity-50"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {hasNew && (
              <button
                onClick={handleMarkSeen}
                disabled={isPending}
                className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                Mark seen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
