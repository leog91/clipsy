"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateItem } from "@/lib/actions";

interface ItemStatusSelectProps {
  itemId: string;
  status: "to_watch" | "watching";
}

export function ItemStatusSelect({ itemId, status }: ItemStatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: "to_watch" | "watching") => {
    startTransition(async () => {
      await updateItem(itemId, { status: value });
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <select
        defaultValue={status}
        onChange={(e) => handleChange(e.target.value as "to_watch" | "watching")}
        disabled={isPending}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="to_watch">To Watch</option>
        <option value="watching">Watching</option>
      </select>
      {isPending && (
        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-gray-400">Saving...</span>
      )}
    </div>
  );
}
