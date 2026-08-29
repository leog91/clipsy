"use client";

import { softDeleteUser } from "@/lib/actions-admin";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function SoftDeleteButton({ userId }: { userId: string }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          className="px-3 py-1 text-xs bg-red-900 text-red-300 rounded hover:bg-red-800"
        >
          Delete
        </button>
      }
      title="Move to trash?"
      description="This user and all their data (items, tags, collections) will be hidden from the app. You can restore or permanently delete them from the trash."
      action={() => softDeleteUser(userId)}
      confirmLabel="Move to Trash"
      pendingLabel="Moving..."
      successMessage="User moved to trash"
      errorMessage="Failed to move user to trash"
      onSuccess={() => router.refresh()}
    />
  );
}
