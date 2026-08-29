import { createItemFromUrl, findExistingItemIdBySourceId } from "@/lib/actions";
import { fetchYouTubeMetadata } from "@/lib/youtube";
import { redirect } from "next/navigation";

interface SaveClipConfirmationProps {
  url: string;
}

export async function SaveClipConfirmation({ url }: SaveClipConfirmationProps) {
  const metadata = await fetchYouTubeMetadata(url);
  const existingId = metadata ? await findExistingItemIdBySourceId(metadata.sourceId) : null;
  const isUpdate = Boolean(existingId);

  async function handleSaveClip() {
    "use server";
    const result = await createItemFromUrl(url);
    redirect(`/item/${result.id}`);
  }

  return (
    <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">
        {isUpdate ? "Update this clip?" : "Save this clip?"}
      </h2>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
        {metadata?.thumbnail && (
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="aspect-video w-full rounded object-cover sm:h-24 sm:w-40 sm:shrink-0 sm:aspect-auto"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg text-gray-100">
            {metadata?.title || "YouTube video"}
          </h3>
          {metadata?.channel && (
            <p className="text-sm text-gray-400 mt-1">{metadata.channel}</p>
          )}
          <p className="text-xs text-gray-500 mt-2 break-all">{url}</p>
          {isUpdate && (
            <p className="text-xs text-yellow-500 mt-2">
              This clip is already saved. Updating will refresh its metadata and timestamp.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <form action={handleSaveClip} className="w-full sm:w-auto">
          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700 sm:w-auto"
          >
            {isUpdate ? "Update clip" : "Save to Clipsy"}
          </button>
        </form>
        <a
          href="/"
          className="inline-flex w-full items-center justify-center rounded-lg bg-gray-700 px-6 py-2 text-gray-200 hover:bg-gray-600 sm:w-auto"
        >
          Cancel
        </a>
      </div>
    </div>
  );
}
