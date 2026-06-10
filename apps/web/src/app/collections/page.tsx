import { listCollectionsWithCounts, deleteCollection } from "@/lib/actions-collections";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { DeleteButton } from "@/components/delete-button";

export default async function CollectionsPage(): Promise<JSX.Element> {
  const collectionsWithCounts = await listCollectionsWithCounts();

  async function handleDeleteCollection(formData: FormData) {
    "use server";
    const collectionId = formData.get("collectionId") as string;
    await deleteCollection(collectionId);
    revalidatePath("/collections");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-gray-100">Collections</h1>

        <div className="space-y-4">
          {collectionsWithCounts.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No collections yet. Create one from an item's detail page.
            </p>
          ) : (
            collectionsWithCounts.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between border border-gray-700 rounded-lg p-4 bg-gray-800"
              >
                <Link
                  href={`/?collection=${collection.id}`}
                  className="flex-1 hover:bg-gray-700 -m-4 p-4 rounded-lg"
                >
                  <h2 className="text-xl font-semibold text-gray-100">{collection.name}</h2>
                  <p className="text-gray-400">
                    {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                  </p>
                </Link>
                {collection.itemCount === 0 && (
                  <DeleteButton action={handleDeleteCollection} message="Are you sure you want to delete this collection?">
                    <input type="hidden" name="collectionId" value={collection.id} />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </DeleteButton>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
