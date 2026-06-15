"use client";

import type { ItemWithRelations } from "@clipsy/shared";
import Link from "next/link";
import { deleteItem } from "@/lib/actions";
import { formatTimestamp } from "@/lib/youtube";
import { useRouter } from "next/navigation";

interface ItemCardProps {
  item: ItemWithRelations;
}

export function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm("Are you sure you want to delete this item?")) {
      await deleteItem(item.id);
      router.refresh();
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-800">
      <div className="flex gap-4">
        <Link href={`/item/${item.id}`} className="flex gap-4 flex-1 min-w-0">
          {item.thumbnail && (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-40 h-24 object-cover rounded flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 text-gray-100 truncate">
              {item.title}
            </h3>
            {item.channel && (
              <p className="text-sm text-gray-400 mb-2">{item.channel}</p>
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
        <button
          onClick={handleDelete}
          className="self-start px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex-shrink-0"
        >
          Delete
        </button>
      </div>

      {item.tags.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
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
