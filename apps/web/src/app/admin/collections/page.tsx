import {
  listPublicCollections,
  moderateMakeCollectionPrivate,
  moderateDeleteCollection,
} from "@/lib/actions-admin-collections";
import { DeleteCollectionButton } from "./delete-collection-button";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const result = await listPublicCollections({ page, search });

  async function handleMakePrivate(formData: FormData) {
    "use server";
    const id = formData.get("collectionId") as string;
    await moderateMakeCollectionPrivate(id);
    revalidatePath("/admin/collections");
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("collectionId") as string;
    await moderateDeleteCollection(id);
    revalidatePath("/admin/collections");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">
          Public collections
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({result.total} total)
          </span>
        </h2>
      </div>

      <form className="mb-6">
        <div className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name or owner..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
          {search && (
            <Link
              href="/admin/collections"
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-left">
              <th className="py-3 px-4 text-gray-400 font-medium">Collection</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Owner</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Items</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.collections.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No public collections found
                </td>
              </tr>
            ) : (
              result.collections.map((collection) => (
                <tr key={collection.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="text-gray-100 font-medium">{collection.name}</div>
                    <Link
                      href={`/share/${collection.id}`}
                      target="_blank"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      View public page
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-100">{collection.ownerName}</div>
                    <div className="text-gray-500 text-xs">{collection.ownerEmail}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{collection.itemCount}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <form action={handleMakePrivate}>
                        <input type="hidden" name="collectionId" value={collection.id} />
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                        >
                          Make private
                        </button>
                      </form>
                      <DeleteCollectionButton action={handleDelete} collectionId={collection.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/admin/collections?page=${page - 1}${search ? `&search=${search}` : ""}`}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
            >
              Previous
            </Link>
          )}
          <span className="text-gray-500 text-sm">
            Page {page} of {result.totalPages}
          </span>
          {page < result.totalPages && (
            <Link
              href={`/admin/collections?page=${page + 1}${search ? `&search=${search}` : ""}`}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
