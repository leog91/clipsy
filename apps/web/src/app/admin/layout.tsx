import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold text-gray-100">
              Admin Panel
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-400 hover:text-gray-100"
              >
                Dashboard
              </Link>
              <Link
                href="/admin"
                className="text-sm text-gray-400 hover:text-gray-100"
              >
                Users
              </Link>
              <Link
                href="/admin/collections"
                className="text-sm text-gray-400 hover:text-gray-100"
              >
                Collections
              </Link>
              <Link
                href="/admin/audit"
                className="text-sm text-gray-400 hover:text-gray-100"
              >
                Audit
              </Link>
              <Link
                href="/admin/trash"
                className="text-sm text-gray-400 hover:text-gray-100"
              >
                Trash
              </Link>
            </nav>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-100">
            Back to App
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
