import { getTrashUserWithItems } from "@/lib/actions-admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RestoreButton } from "../restore-button";
import { HardDeleteButton } from "../hard-delete-button";

export default async function TrashUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let userData;
  try {
    userData = await getTrashUserWithItems(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/trash"
        className="text-sm text-blue-400 hover:underline mb-4 inline-block"
      >
        &larr; Back to trash
      </Link>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {userData.image ? (
            <img
              src={userData.image}
              alt=""
              className="w-16 h-16 rounded-full opacity-50"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl text-gray-500">
              {userData.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-400">
              {userData.name}
            </h2>
            <p className="text-gray-600">{userData.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 bg-gray-700 text-gray-500">
              {userData.role}
            </span>
          </div>
        </div>

        <dl className="space-y-3 mb-6">
          <div className="flex justify-between">
            <dt className="text-gray-500">Deleted</dt>
            <dd className="text-gray-400">
              {userData.deletedAt?.toLocaleDateString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Joined</dt>
            <dd className="text-gray-400">
              {userData.createdAt?.toLocaleDateString()}
            </dd>
          </div>
        </dl>

        <div className="flex gap-3">
          <RestoreButton userId={userData.id} />
          <HardDeleteButton userId={userData.id} userName={userData.name} />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-100 mb-4">
        Items ({userData.items.length})
      </h3>

      {userData.items.length === 0 ? (
        <p className="text-gray-500 text-sm">No items.</p>
      ) : (
        <div className="space-y-3">
          {userData.items.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex gap-4"
            >
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-24 h-16 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-300 font-medium truncate">
                  {item.title}
                </h4>
                <p className="text-gray-500 text-xs mt-1 truncate">
                  {item.url}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">
                    Status: {item.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    Created: {item.createdAt?.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
