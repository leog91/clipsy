import { createAuthClient } from "better-auth/react";

const isLoopbackHost = (host: string) =>
  host === "localhost" || host === "127.0.0.1" || host === "::1";

const getAppUrl = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return undefined;

  try {
    const configuredUrl = new URL(appUrl);
    const currentHost =
      typeof window === "undefined" ? undefined : window.location.hostname;

    if (
      currentHost &&
      !isLoopbackHost(currentHost) &&
      isLoopbackHost(configuredUrl.hostname)
    ) {
      return undefined;
    }

    return configuredUrl.origin;
  } catch {
    return undefined;
  }
};

const appUrl = getAppUrl();

export const authClient = createAuthClient({
  ...(appUrl ? { baseURL: appUrl } : {}),
}) as any;

export const { signIn, signUp, signOut, useSession } = authClient;
