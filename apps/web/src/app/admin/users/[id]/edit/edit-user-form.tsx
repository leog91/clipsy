"use client";

import { updateUser } from "@/lib/actions-admin";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function EditUserForm({
  user: userData,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
  };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="max-w-md">
      <form
        action={async (formData) => {
          setPending(true);
          setError("");

          try {
            await updateUser(userData.id, {
              name: String(formData.get("name")),
              email: String(formData.get("email")),
              role: String(formData.get("role")) as "user" | "admin",
            });
            router.push("/admin");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update user");
            setPending(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm text-gray-400 mb-1"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={userData.name}
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm text-gray-400 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={userData.email}
            required
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm text-gray-400 mb-1"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue={userData.role}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
