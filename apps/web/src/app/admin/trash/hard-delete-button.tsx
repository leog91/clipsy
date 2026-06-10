"use client";

import { hardDeleteUser } from "@/lib/actions-admin";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HardDeleteButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1 text-xs bg-red-900 text-red-300 rounded hover:bg-red-800"
      >
        Delete Forever
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Permanently delete user?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              This will permanently delete <strong>{userName}</strong> and{" "}
              <strong>all</strong> of their data (items, tags, collections,
              sessions, accounts). This action cannot be undone.
            </p>
            <p className="text-gray-500 text-sm mb-2">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100"
              >
                Cancel
              </button>
              <form
                action={async () => {
                  if (confirmText !== "DELETE") return;
                  setPending(true);
                  await hardDeleteUser(userId);
                  setShowConfirm(false);
                  router.refresh();
                }}
              >
                <button
                  type="submit"
                  disabled={confirmText !== "DELETE" || pending}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pending ? "Deleting..." : "Permanently Delete"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
