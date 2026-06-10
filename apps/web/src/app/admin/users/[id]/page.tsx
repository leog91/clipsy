import { getUserWithStats } from "@/lib/actions-admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let userData;
  try {
    userData = await getUserWithStats(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-blue-400 hover:underline mb-4 inline-block"
      >
        &larr; Back to users
      </Link>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          {userData.image ? (
            <img
              src={userData.image}
              alt=""
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl text-gray-400">
              {userData.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-100">
              {userData.name}
            </h2>
            <p className="text-gray-400">{userData.email}</p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                userData.role === "admin"
                  ? "bg-purple-900 text-purple-300"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {userData.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-100">
              {userData.itemsCount}
            </div>
            <div className="text-sm text-gray-500">Items</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-100">
              {userData.tagsCount}
            </div>
            <div className="text-sm text-gray-500">Tags</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-100">
              {userData.collectionsCount}
            </div>
            <div className="text-sm text-gray-500">Collections</div>
          </div>
        </div>

        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500">Email verified</dt>
            <dd className="text-gray-300">
              {userData.emailVerified ? "Yes" : "No"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Joined</dt>
            <dd className="text-gray-300">
              {userData.createdAt?.toLocaleDateString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Last updated</dt>
            <dd className="text-gray-300">
              {userData.updatedAt?.toLocaleDateString()}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <Link
            href={`/admin/users/${id}/edit`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit User
          </Link>
        </div>
      </div>
    </div>
  );
}
