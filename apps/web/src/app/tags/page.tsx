import { listTags, deleteTag, isTagUsed } from "@/lib/actions-tags";
import { getDb } from "@clipsy/db";
import { itemTags } from "@clipsy/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { DeleteButton } from "@/components/delete-button";

export default async function TagsPage() {
  const tagsList = await listTags();
  const db = getDb();

  const tagsWithCounts = await Promise.all(
    tagsList.map(async (tag) => {
      const count = await db
        .select()
        .from(itemTags)
        .where(eq(itemTags.tagId, tag.id));

      return {
        ...tag,
        itemCount: count.length,
      };
    })
  );

  async function handleDeleteTag(formData: FormData) {
    "use server";
    const tagId = formData.get("tagId") as string;
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
                  <DeleteButton action={handleDeleteTag} message="Are you sure you want to delete this tag?">
                    <input type="hidden" name="tagId" value={tag.id} />
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
