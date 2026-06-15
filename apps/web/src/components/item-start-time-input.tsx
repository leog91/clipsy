"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateItem } from "@/lib/actions";
import { formatTimestamp } from "@/lib/youtube";

interface ItemStartTimeInputProps {
  itemId: string;
  startAtSeconds: number | null;
}

export function ItemStartTimeInput({ itemId, startAtSeconds }: ItemStartTimeInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(startAtSeconds ?? "");
  const [savedValue, setSavedValue] = useState(startAtSeconds);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const numeric = value === "" ? null : Math.max(0, Math.floor(Number(value)));
    if (Number.isNaN(numeric)) return;
    if (numeric === savedValue) return;

    startTransition(async () => {
      await updateItem(itemId, { startAtSeconds: numeric ?? undefined });
      setSavedValue(numeric);
      router.refresh();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={save}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          placeholder="Seconds"
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <span className="text-sm text-gray-400">
          {savedValue !== null && savedValue >= 0 ? formatTimestamp(savedValue) : "From start"}
        </span>
        {isPending && <span className="text-xs text-gray-500">Saving...</span>}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Press Enter or click outside to save. Saved clips under 10s get no timestamp.
      </p>
    </div>
  );
}
