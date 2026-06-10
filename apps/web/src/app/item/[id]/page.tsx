import { getItemById, updateItem, deleteItem } from "@/lib/actions";
import { addTagToItem, removeTagFromItem, listTags, createAndAddTagToItem } from "@/lib/actions-tags";
import {
  addItemToCollection,
  removeItemFromCollection,
  listCollections,
  createAndAddCollectionToItem,
} from "@/lib/actions-collections";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { DeleteButton } from "@/components/delete-button";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  const allTags = await listTags();
  const allCollections = await listCollections();

  const itemTagIds = new Set(item.tags.map((t: any) => t.id));
  const itemCollectionIds = new Set(item.collections.map((c: any) => c.id));

  async function handleStatusChange(formData: FormData) {
    "use server";
    const status = formData.get("status") as "to_watch" | "watching";
    await updateItem(id, { status });
    revalidatePath(`/item/${id}`);
    revalidatePath("/");
  }

  async function handleAddTag(formData: FormData) {
    "use server";
    const tagId = formData.get("tagId") as string;
    if (tagId) {
      await addTagToItem(id, tagId);
      revalidatePath(`/item/${id}`);
    }
  }

  async function handleRemoveTag(formData: FormData) {
    "use server";
    const tagId = formData.get("tagId") as string;
    await removeTagFromItem(id, tagId);
    revalidatePath(`/item/${id}`);
  }

  async function handleAddCollection(formData: FormData) {
    "use server";
    const collectionId = formData.get("collectionId") as string;
    if (collectionId) {
      await addItemToCollection(id, collectionId);
      revalidatePath(`/item/${id}`);
    }
  }

  async function handleRemoveCollection(formData: FormData) {
    "use server";
    const collectionId = formData.get("collectionId") as string;
    await removeItemFromCollection(id, collectionId);
    revalidatePath(`/item/${id}`);
  }

  async function handleCreateAndAddTag(formData: FormData) {
    "use server";
    const tagName = formData.get("tagName") as string;
    if (tagName && tagName.trim()) {
      await createAndAddTagToItem(id, tagName.trim());
      revalidatePath(`/item/${id}`);
    }
  }

  async function handleCreateAndAddCollection(formData: FormData) {
    "use server";
    const collectionName = formData.get("collectionName") as string;
    if (collectionName && collectionName.trim()) {
      await createAndAddCollectionToItem(id, collectionName.trim());
      revalidatePath(`/item/${id}`);
    }
  }

  async function handleDeleteItem() {
    "use server";
    await deleteItem(id);
    redirect("/");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 inline-block">
          ← Back
        </Link>

        <div className="mb-8">
          {item.thumbnail && (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full max-w-2xl rounded-lg mb-4"
            />
          )}
          <h1 className="text-3xl font-bold mb-2 text-gray-100">{item.title}</h1>
          {item.channel && (
            <p className="text-lg text-gray-400 mb-2">{item.channel}</p>
          )}
          {item.description && (
            <p className="text-gray-300 mb-4">{item.description}</p>
          )}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Open on YouTube
          </a>
          <DeleteButton action={handleDeleteItem} message="Are you sure you want to delete this item?">
            <button
              type="submit"
              className="ml-4 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Delete
            </button>
          </DeleteButton>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-100">Status</h2>
          <form action={handleStatusChange}>
            <select
              name="status"
              defaultValue={item.status}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
            >
              <option value="to_watch">To Watch</option>
              <option value="watching">Watching</option>
            </select>
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update
            </button>
          </form>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-100">Tags</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {item.tags.map((tag: any) => (
              <div key={tag.id} className="flex items-center gap-1">
                <Link
                  href={`/?tag=${tag.id}`}
                  className="text-sm px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  {tag.name}
                </Link>
                <form action={handleRemoveTag}>
                  <input type="hidden" name="tagId" value={tag.id} />
                  <button
                    type="submit"
                    className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-red-900"
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
          <form action={handleAddTag} className="flex gap-2">
            <select name="tagId" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100">
              <option value="">Select tag...</option>
              {allTags
                .filter((t) => !itemTagIds.has(t.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Tag
            </button>
          </form>
          <form action={handleCreateAndAddTag} className="flex gap-2 mt-2">
            <input
              type="text"
              name="tagName"
              placeholder="Create new tag..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create & Add
            </button>
          </form>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-100">Collections</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {item.collections.map((collection) => (
              <div key={collection.id} className="flex items-center gap-1">
                <Link
                  href={`/?collection=${collection.id}`}
                  className="text-sm px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  {collection.name}
                </Link>
                <form action={handleRemoveCollection}>
                  <input type="hidden" name="collectionId" value={collection.id} />
                  <button
                    type="submit"
                    className="text-sm px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-red-900"
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
          <form action={handleAddCollection} className="flex gap-2">
            <select name="collectionId" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100">
              <option value="">Select collection...</option>
              {allCollections
                .filter((c) => !itemCollectionIds.has(c.id))
                .map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add to Collection
            </button>
          </form>
          <form action={handleCreateAndAddCollection} className="flex gap-2 mt-2">
            <input
              type="text"
              name="collectionName"
              placeholder="Create new collection..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create & Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
