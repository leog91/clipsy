"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCollectionVisibility } from "@/lib/actions-collections";

interface CollectionPublicToggleProps {
  collectionId: string;
  isPublic: boolean;
}

export function CollectionPublicToggle({ collectionId, isPublic }: CollectionPublicToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticIsPublic, setOptimisticIsPublic] = useState(isPublic);

  const handleToggle = () => {
    const next = !optimisticIsPublic;
    setOptimisticIsPublic(next);
    startTransition(async () => {
      await updateCollectionVisibility(collectionId, next);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 ${
        optimisticIsPublic ? "bg-blue-600" : "bg-gray-600"
      }`}
      aria-label={optimisticIsPublic ? "Make private" : "Make public"}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          optimisticIsPublic ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}