"use client";

import { useState } from "react";
import { createItemFromUrl } from "@/lib/actions";
import { useRouter } from "next/navigation";

export function AddItemForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createItemFromUrl(url);
      setUrl("");
      router.refresh();
    } catch (err) {
      setError("Failed to add video. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="url"
        placeholder="Paste YouTube URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Adding..." : "Add"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
