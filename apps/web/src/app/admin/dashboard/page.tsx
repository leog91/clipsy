import { getAdminDashboardStats } from "@/lib/actions-admin-dashboard";
import Link from "next/link";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
      <div className="text-3xl font-bold text-gray-100">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:border-blue-500 transition-colors">
        {content}
      </Link>
    );
  }

  return content;
}

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total users" value={stats.totalUsers} href="/admin" />
        <StatCard label="Total clips" value={stats.totalItems} />
        <StatCard label="Clips today" value={stats.itemsToday} />
        <StatCard label="Clips this week" value={stats.itemsThisWeek} />
        <StatCard label="Active users (30d)" value={stats.activeUsers} />
        <StatCard
          label="Public collections"
          value={stats.publicCollections}
          href="/admin/collections"
        />
        <StatCard label="Total collections" value={stats.totalCollections} />
        <StatCard label="Total tags" value={stats.totalTags} />
        <StatCard label="Deleted users" value={stats.deletedUsers} href="/admin/trash" />
        <StatCard label="New signups (30d)" value={stats.recentSignups} />
      </div>
    </div>
  );
}
