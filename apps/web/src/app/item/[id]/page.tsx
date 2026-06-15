import { getItemById, deleteItem } from "@/lib/actions";
import { listTags } from "@/lib/actions-tags";
import { listCollections } from "@/lib/actions-collections";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { formatTimestamp } from "@/lib/youtube";
import { ItemStatusSelect } from "@/components/item-status-select";
import { ItemStartTimeInput } from "@/components/item-start-time-input";
import { ItemTagEditor } from "@/components/item-tag-editor";
import { ItemCollectionEditor } from "@/components/item-collection-editor";

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  const allTags = await listTags();
  const allCollections = await listCollections();

  async function handleDeleteItem() {
    "use server";
    await deleteItem(id);
    redirect("/");
  }

  const youtubeUrl = (() => {
    try {
      return new URL(item.url);
    } catch {
      return new URL(`https://www.youtube.com/watch?v=${item.sourceId}`);
    }
  })();
  if (item.startAtSeconds !== null && item.startAtSeconds > 0) {
    youtubeUrl.searchParams.set("t", `${item.startAtSeconds}s`);
  }

  const embedUrl = `https://www.youtube.com/embed/${item.sourceId}?start=${item.startAtSeconds ?? 0}&rel=0`;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-blue-400 hover:underline mb-4 inline-block text-sm"
        >
          ← Back to clips
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
              <iframe
                key={item.startAtSeconds ?? 0}
                src={embedUrl}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-100 mb-2">
                {item.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
                {item.channel && <span>{item.channel}</span>}
                {item.duration !== null && item.duration > 0 && (
                  <span>• {formatTimestamp(item.duration)}</span>
                )}
                {item.startAtSeconds !== null && item.startAtSeconds > 0 && (
                  <span className="text-teal-400">
                    • Starts at {formatTimestamp(item.startAtSeconds)}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              )}

              <a
                href={youtubeUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-red-400 hover:text-red-300"
              >
                Open on YouTube
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Status
              </h2>
              <ItemStatusSelect itemId={item.id} status={item.status} />
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Start Time
              </h2>
              <ItemStartTimeInput
                itemId={item.id}
                startAtSeconds={item.startAtSeconds}
              />
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Tags
              </h2>
              <ItemTagEditor itemId={item.id} tags={item.tags} availableTags={allTags} />
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Collections
              </h2>
              <ItemCollectionEditor
                itemId={item.id}
                collections={item.collections}
                availableCollections={allCollections}
              />
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Danger Zone
              </h2>
              <DeleteButton
                action={handleDeleteItem}
                message="Are you sure you want to delete this item?"
              >
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete clip
                </button>
              </DeleteButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
