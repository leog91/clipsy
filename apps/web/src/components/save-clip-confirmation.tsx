import { createItemFromUrl } from "@/lib/actions";
import { fetchYouTubeMetadata } from "@/lib/youtube";
import { redirect } from "next/navigation";

interface SaveClipConfirmationProps {
  url: string;
}

export async function SaveClipConfirmation({ url }: SaveClipConfirmationProps) {
  const metadata = await fetchYouTubeMetadata(url);

  async function handleSaveClip() {
    "use server";
    await createItemFromUrl(url);
    redirect("/");
  }

  return (
    <div className="mb-8 p-6 bg-gray-800 border border-gray-700 rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">Save this clip?</h2>

      <div className="flex gap-4 mb-6">
        {metadata?.thumbnail && (
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-40 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-100">
            {metadata?.title || "YouTube video"}
          </h3>
          {metadata?.channel && (
            <p className="text-sm text-gray-400 mt-1">{metadata.channel}</p>
          )}
          <p className="text-xs text-gray-500 mt-2 break-all">{url}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <form action={handleSaveClip}>
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Save to Clipsy
          </button>
        </form>
        <a
          href="/"
          className="px-6 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 inline-flex items-center"
        >
          Cancel
        </a>
      </div>
    </div>
  );
}
