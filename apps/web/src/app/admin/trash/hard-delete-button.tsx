"use client";

import { hardDeleteUser } from "@/lib/actions-admin";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function HardDeleteButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          className="px-3 py-1 text-xs bg-red-900 text-red-300 rounded hover:bg-red-800"
        >
          Delete Forever
        </button>
      }
      title="Permanently delete user?"
      description={
        <>
          This will permanently delete <strong className="text-gray-200">{userName}</strong> and all
          of their data, including items, tags, collections, sessions, and accounts. This action
          cannot be undone.
        </>
      }
      action={() => hardDeleteUser(userId)}
      confirmLabel="Permanently Delete"
      successMessage="User permanently deleted"
      errorMessage="Failed to permanently delete user"
      confirmationPhrase="DELETE"
      onSuccess={() => router.refresh()}
    />
  );
}
