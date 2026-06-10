import { listUsers } from "@/lib/actions-admin";
import Link from "next/link";
import { RestoreButton } from "./restore-button";
import { HardDeleteButton } from "./hard-delete-button";

export default async function TrashPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const result = await listUsers({ page, search, deletedOnly: true });
  const trashedUsers = result.users;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">
          Trash
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({result.total} deleted users)
          </span>
        </h2>
      </div>

      <form className="mb-6">
        <div className="flex gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name or email..."
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
              href="/admin/trash"
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
              <th className="py-3 px-4 text-gray-400 font-medium">User</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Role</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Items</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Deleted</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trashedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Trash is empty
                </td>
              </tr>
            ) : (
              trashedUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <img
                          src={u.image}
                          alt=""
                          className="w-8 h-8 rounded-full opacity-50"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-gray-400">{u.name}</div>
                        <div className="text-gray-600 text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-500">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{u.itemsCount}</td>
                  <td className="py-3 px-4 text-gray-500">
                    {u.deletedAt?.toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/trash/${u.id}`}
                        className="px-3 py-1 text-xs bg-gray-700 text-gray-400 rounded hover:bg-gray-600"
                      >
                        View
                      </Link>
                      <RestoreButton userId={u.id} />
                      <HardDeleteButton userId={u.id} userName={u.name} />
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
              href={`/admin/trash?page=${page - 1}${search ? `&search=${search}` : ""}`}
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
              href={`/admin/trash?page=${page + 1}${search ? `&search=${search}` : ""}`}
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
