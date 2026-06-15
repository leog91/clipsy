export function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;

  return getAdminEmails().has(email.toLowerCase());
}

export function isAdminUser(user: {
  email?: string | null;
  role?: string | null;
}) {
  return user.role === "admin" || isAdminEmail(user.email);
}
