import { createAuthClient } from "better-auth/react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

export const authClient = createAuthClient({
  ...(appUrl ? { baseURL: appUrl } : {}),
}) as any;

export const { signIn, signUp, signOut, useSession } = authClient;
