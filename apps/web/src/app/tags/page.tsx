import { listTagsWithCounts, deleteTag } from "@/lib/actions-tags";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { DeleteButton } from "@/components/delete-button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function TagsPage(): Promise<JSX.Element> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const tagsWithCounts = await listTagsWithCounts();

  async function handleDeleteTag(tagId: string) {
    "use server";
    await deleteTag(tagId);
    revalidatePath("/tags");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-gray-100">Tags</h1>

        <div className="space-y-4">
          {tagsWithCounts.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No tags yet. Create one from an item's detail page.
            </p>
          ) : (
            tagsWithCounts.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between border border-gray-700 rounded-lg p-4 bg-gray-800"
              >
                <Link
                  href={`/?tag=${tag.id}`}
                  className="flex-1 hover:bg-gray-700 -m-4 p-4 rounded-lg"
                >
                  <h2 className="text-xl font-semibold text-gray-100">{tag.name}</h2>
                  <p className="text-gray-400">
                    {tag.itemCount} {tag.itemCount === 1 ? "item" : "items"}
                  </p>
                </Link>
                {tag.itemCount === 0 && (
                  <DeleteButton
                    action={handleDeleteTag.bind(null, tag.id)}
                    title="Delete tag?"
                    description={`This will permanently delete “${tag.name}”.`}
                    successMessage="Tag deleted"
                    errorMessage="Failed to delete tag"
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
