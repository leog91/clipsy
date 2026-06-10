import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@clipsy/db";
import * as schema from "@clipsy/db/schema";

const getOrigin = (url: string | undefined) => {
  if (!url) return undefined;

  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
};

const getHost = (url: string | undefined) => {
  if (!url) return undefined;

  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
};

const authUrl = getOrigin(process.env.BETTER_AUTH_URL);
const appUrl = getOrigin(process.env.NEXT_PUBLIC_APP_URL);
const vercelProjectUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;
const authHost = getHost(authUrl);
const appHost = getHost(appUrl);
const fallbackUrl = authUrl || appUrl || vercelProjectUrl;

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
  baseURL:
    process.env.VERCEL
      ? {
          allowedHosts: Array.from(
            new Set(
              [
                "localhost:3000",
                "127.0.0.1:3000",
                "*.vercel.app",
                authHost,
                appHost,
              ].filter((host): host is string => Boolean(host)),
            ),
          ),
          ...(fallbackUrl ? { fallback: fallbackUrl } : {}),
          protocol: "auto",
        }
      : authUrl || appUrl || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
});
