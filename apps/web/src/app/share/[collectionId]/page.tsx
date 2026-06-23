import { getPublicCollectionById } from "@/lib/actions-collections";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatTimestamp } from "@/lib/youtube";
import type { Metadata } from "next";

export const revalidate = 60;

interface SharePageProps {
  params: Promise<{ collectionId: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { collectionId } = await params;
  const collection = await getPublicCollectionById(collectionId);

  if (!collection) {
    return {
      title: "Not Found - Clipsy",
    };
  }

  return {
    title: `${collection.name} - Clipsy`,
    description: `A curated collection of ${collection.items.length} clip${collection.items.length === 1 ? "" : "s"} on Clipsy`,
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { collectionId } = await params;
  const collection = await getPublicCollectionById(collectionId);

  if (!collection) {
    notFound();
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-blue-400 hover:underline mb-4 inline-block text-sm"
        >
          ← Clipsy
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">{collection.name}</h1>
          <p className="text-gray-400 mt-2">
            {collection.items.length} {collection.items.length === 1 ? "clip" : "clips"}
          </p>
        </div>

        <div className="space-y-4">
          {collection.items.length === 0 ? (
            <p className="text-center text-gray-500 py-8">This collection is empty.</p>
          ) : (
            collection.items.map((item) => {
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

              return (
                <a
                  key={item.id}
                  href={youtubeUrl.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-800"
                >
                  <div className="flex gap-4">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-40 h-24 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 text-gray-100 truncate">
                        {item.title}
                      </h3>
                      {item.channel && (
                        <p className="text-sm text-gray-400 mb-2">{item.channel}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {item.duration !== null && item.duration > 0 && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                            {formatTimestamp(item.duration)}
                          </span>
                        )}
                        {item.startAtSeconds !== null && item.startAtSeconds > 0 && (
                          <span className="text-xs px-2 py-1 rounded bg-teal-900 text-teal-200">
                            Starts at {formatTimestamp(item.startAtSeconds)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.tags.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {item.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}