"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface CopyShareLinkProps {
  collectionId: string;
}

export function CopyShareLink({ collectionId }: CopyShareLinkProps) {
  const [fallbackUrl, setFallbackUrl] = useState("");

  const handleCopy = async () => {
    const url = `${window.location.origin}/share/${collectionId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      setFallbackUrl(url);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
      >
        Copy share link
      </button>

      <AlertDialog.Root open={Boolean(fallbackUrl)} onOpenChange={(open) => !open && setFallbackUrl("")}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl focus:outline-none">
            <AlertDialog.Title className="text-lg font-semibold text-gray-100">
              Copy share link
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-gray-400">
              Automatic copying is unavailable. Select and copy the link below.
            </AlertDialog.Description>
            <input
              value={fallbackUrl}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              aria-label="Share link"
              className="mt-4 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
            />
            <div className="mt-6 flex justify-end">
              <AlertDialog.Action asChild>
                <button
                  type="button"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Close
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
