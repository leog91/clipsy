import { getUserWithStats } from "@/lib/actions-admin";
import { notFound } from "next/navigation";
import { EditUserForm } from "./edit-user-form";

export default async function EditUserPage({
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
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Edit User</h2>
      <EditUserForm user={userData} />
    </div>
  );
}
