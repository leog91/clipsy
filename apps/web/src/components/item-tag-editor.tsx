"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTagToItem, removeTagFromItem, createAndAddTagToItem } from "@/lib/actions-tags";
import type { Tag } from "@clipsy/shared";

interface ItemTagEditorProps {
  itemId: string;
  tags: Tag[];
  availableTags: Tag[];
}

export function ItemTagEditor({ itemId, tags, availableTags }: ItemTagEditorProps) {
  const router = useRouter();
  const [selectedTagId, setSelectedTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddExisting = () => {
    if (!selectedTagId) return;
    startTransition(async () => {
      await addTagToItem(itemId, selectedTagId);
      setSelectedTagId("");
      router.refresh();
    });
  };

  const handleCreateAndAdd = () => {
    const name = newTagName.trim();
    if (!name) return;
    startTransition(async () => {
      await createAndAddTagToItem(itemId, name);
      setNewTagName("");
      router.refresh();
    });
  };

  const handleRemove = (tagId: string) => {
    startTransition(async () => {
      await removeTagFromItem(itemId, tagId);
      router.refresh();
    });
  };

  const unusedTags = availableTags.filter((t) => !tags.some((tag) => tag.id === t.id));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-700 text-gray-200"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemove(tag.id)}
              disabled={isPending}
              className="text-gray-400 hover:text-red-400 disabled:opacity-50"
              aria-label={`Remove tag ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-sm text-gray-500">No tags</span>}
      </div>

      <div className="flex gap-2">
        <select
          value={selectedTagId}
          onChange={(e) => setSelectedTagId(e.target.value)}
          disabled={isPending || unusedTags.length === 0}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">Add existing tag...</option>
          {unusedTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddExisting}
          disabled={isPending || !selectedTagId}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
          placeholder="New tag..."
          disabled={isPending}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleCreateAndAdd}
          disabled={isPending || !newTagName.trim()}
          className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  );
}
