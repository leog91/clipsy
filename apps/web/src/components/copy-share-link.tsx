"use client";

import { useState } from "react";

interface CopyShareLinkProps {
  collectionId: string;
}

export function CopyShareLink({ collectionId }: CopyShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/share/${collectionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
    >
      {copied ? "Copied!" : "Copy share link"}
    </button>
  );
}