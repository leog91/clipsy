"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addItemToCollection,
  removeItemFromCollection,
  createAndAddCollectionToItem,
} from "@/lib/actions-collections";
import type { Collection } from "@clipsy/shared";

interface ItemCollectionEditorProps {
  itemId: string;
  collections: Collection[];
  availableCollections: Collection[];
}

export function ItemCollectionEditor({ itemId, collections, availableCollections }: ItemCollectionEditorProps) {
  const router = useRouter();
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddExisting = () => {
    if (!selectedCollectionId) return;
    startTransition(async () => {
      await addItemToCollection(itemId, selectedCollectionId);
      setSelectedCollectionId("");
      router.refresh();
    });
  };

  const handleCreateAndAdd = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    startTransition(async () => {
      await createAndAddCollectionToItem(itemId, name);
      setNewCollectionName("");
      router.refresh();
    });
  };

  const handleRemove = (collectionId: string) => {
    startTransition(async () => {
      await removeItemFromCollection(itemId, collectionId);
      router.refresh();
    });
  };

  const unusedCollections = availableCollections.filter(
    (c) => !collections.some((collection) => collection.id === c.id)
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {collections.map((collection) => (
          <span
            key={collection.id}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-700 text-gray-200"
          >
            {collection.name}
            <button
              type="button"
              onClick={() => handleRemove(collection.id)}
              disabled={isPending}
              className="text-gray-400 hover:text-red-400 disabled:opacity-50"
              aria-label={`Remove collection ${collection.name}`}
            >
              ×
            </button>
          </span>
        ))}
        {collections.length === 0 && <span className="text-sm text-gray-500">No collections</span>}
      </div>

      <div className="flex gap-2">
        <select
          value={selectedCollectionId}
          onChange={(e) => setSelectedCollectionId(e.target.value)}
          disabled={isPending || unusedCollections.length === 0}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">Add existing collection...</option>
          {unusedCollections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddExisting}
          disabled={isPending || !selectedCollectionId}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
          placeholder="New collection..."
          disabled={isPending}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleCreateAndAdd}
          disabled={isPending || !newCollectionName.trim()}
          className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  );
}
