"use client";

import type { ItemWithRelations } from "@clipsy/shared";
import Link from "next/link";
import { deleteItem } from "@/lib/actions";
import { formatTimestamp } from "@/lib/youtube";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface ItemCardProps {
  item: ItemWithRelations;
}

export function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 transition-shadow hover:shadow-md sm:p-4">
      <div className="flex gap-3 sm:gap-4">
        <Link href={`/item/${item.id}`} className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          {item.thumbnail && (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-16 w-24 flex-shrink-0 rounded object-cover sm:h-24 sm:w-40"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 truncate text-sm font-semibold text-gray-100 sm:text-lg">
              {item.title}
            </h3>
            {item.channel && (
              <p className="mb-2 truncate text-xs text-gray-400 sm:text-sm">{item.channel}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  item.status === "to_watch"
                    ? "bg-blue-900 text-blue-200"
                    : "bg-green-900 text-green-200"
                }`}
              >
                {item.status === "to_watch" ? "To Watch" : "Watching"}
              </span>
              {item.startAtSeconds !== null && item.startAtSeconds > 0 && (
                <span className="text-xs px-2 py-1 rounded bg-teal-900 text-teal-200">
                  Starts at {formatTimestamp(item.startAtSeconds)}
                </span>
              )}
            </div>
          </div>
        </Link>
        <ConfirmDialog
          trigger={
            <button
              type="button"
              aria-label={`Delete ${item.title}`}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center self-start rounded bg-red-600 text-white hover:bg-red-700 sm:h-auto sm:w-auto sm:px-3 sm:py-1 sm:text-sm"
            >
              <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12m-9 0V5h6v2m-7 0 1 12h6l1-12M10 11v5m4-5v5" />
              </svg>
              <span className="hidden sm:inline">Delete</span>
            </button>
          }
          title="Delete clip?"
          description={`This will permanently delete “${item.title}”.`}
          action={() => deleteItem(item.id)}
          successMessage="Clip deleted"
          errorMessage="Failed to delete clip"
          onSuccess={() => router.refresh()}
        />
      </div>

      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
          {item.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/?tag=${tag.id}`}
              className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
