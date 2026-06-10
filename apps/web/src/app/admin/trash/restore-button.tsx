"use client";

import { restoreUser } from "@/lib/actions-admin";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RestoreButton({ userId }: { userId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  return (
    <form
      action={async () => {
        setPending(true);
        await restoreUser(userId);
        router.refresh();
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1 text-xs bg-green-900 text-green-300 rounded hover:bg-green-800 disabled:opacity-50"
      >
        {pending ? "..." : "Restore"}
      </button>
    </form>
  );
}
