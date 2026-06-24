import { listAuditLogs } from "@/lib/actions-admin-audit";
import Link from "next/link";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const result = await listAuditLogs({ page, search });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">
          Audit log
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
            placeholder="Search by action, target, or details..."
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
              href="/admin/audit"
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
              <th className="py-3 px-4 text-gray-400 font-medium">Time</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Admin</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Action</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Target</th>
              <th className="py-3 px-4 text-gray-400 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {result.logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No audit logs found
                </td>
              </tr>
            ) : (
              result.logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                    {log.createdAt?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-100">{log.adminName}</div>
                    <div className="text-gray-500 text-xs">{log.adminEmail}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {log.targetType}:{" "}
                    <span className="font-mono text-xs">{log.targetId}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{log.details || "—"}</td>
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
              href={`/admin/audit?page=${page - 1}${search ? `&search=${search}` : ""}`}
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
              href={`/admin/audit?page=${page + 1}${search ? `&search=${search}` : ""}`}
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
