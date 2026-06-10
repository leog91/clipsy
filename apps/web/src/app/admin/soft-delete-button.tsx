"use client";

import { softDeleteUser } from "@/lib/actions-admin";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SoftDeleteButton({ userId }: { userId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1 text-xs bg-red-900 text-red-300 rounded hover:bg-red-800"
      >
        Delete
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              Move to trash?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              This user and all their data (items, tags, collections) will be
              hidden from the app. You can restore or permanently delete from
              the trash.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100"
              >
                Cancel
              </button>
              <form
                action={async () => {
                  await softDeleteUser(userId);
                  setShowConfirm(false);
                  router.refresh();
                }}
              >
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Move to Trash
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
