import { auth } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin-emails";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !isAdminUser(session.user)) {
    redirect("/");
  }

  return session;
}

export async function getAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !isAdminUser(session.user)) {
    return null;
  }

  return session;
}
