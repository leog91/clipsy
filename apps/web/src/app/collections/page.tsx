import { listCollectionsWithCounts, deleteCollection } from "@/lib/actions-collections";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { DeleteButton } from "@/components/delete-button";
import { CollectionPublicToggle } from "@/components/collection-public-toggle";
import { CopyShareLink } from "@/components/copy-share-link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CollectionsPage(): Promise<JSX.Element> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const collectionsWithCounts = await listCollectionsWithCounts();

  async function handleDeleteCollection(collectionId: string) {
    "use server";
    await deleteCollection(collectionId);
    revalidatePath("/collections");
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-gray-100">Collections</h1>

        <div className="space-y-4">
          {collectionsWithCounts.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No collections yet. Create one from an item&apos;s detail page.
            </p>
          ) : (
            collectionsWithCounts.map((collection) => (
              <div
                key={collection.id}
                className="flex flex-col rounded-lg border border-gray-700 bg-gray-800 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
              >
                <Link
                  href={collection.isPublic ? `/share/${collection.id}` : `/?collection=${collection.id}`}
                  className="-m-2 w-full min-w-0 rounded-lg p-2 hover:bg-gray-700 sm:-m-4 sm:flex-1 sm:p-4"
                >
                  <h2 className="break-words text-lg font-semibold text-gray-100 sm:text-xl">{collection.name}</h2>
                  <p className="text-gray-400">
                    {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                  </p>
                </Link>
                <div className="mt-3 ml-0 flex w-full flex-wrap items-center gap-2 sm:mt-0 sm:ml-4 sm:w-auto sm:gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {collection.isPublic ? "Public" : "Private"}
                    </span>
                    <CollectionPublicToggle
                      collectionId={collection.id}
                      isPublic={collection.isPublic}
                    />
                  </div>
                  {collection.isPublic && <CopyShareLink collectionId={collection.id} />}
                  {collection.itemCount === 0 && (
                    <DeleteButton
                      action={handleDeleteCollection.bind(null, collection.id)}
                      title="Delete collection?"
                      description={`This will permanently delete “${collection.name}”.`}
                      successMessage="Collection deleted"
                      errorMessage="Failed to delete collection"
                    >
                      <button
                        type="button"
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </DeleteButton>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
