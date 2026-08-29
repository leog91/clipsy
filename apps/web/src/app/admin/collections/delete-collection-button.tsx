"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface DeleteCollectionButtonProps {
  action: (formData: FormData) => Promise<void>;
  collectionId: string;
}

export function DeleteCollectionButton({ action, collectionId }: DeleteCollectionButtonProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
      }
      title="Delete collection?"
      description="This collection will be permanently deleted."
      action={() => {
        const formData = new FormData();
        formData.set("collectionId", collectionId);
        return action(formData);
      }}
      successMessage="Collection deleted"
      errorMessage="Failed to delete collection"
      onSuccess={() => router.refresh()}
    />
  );
}
