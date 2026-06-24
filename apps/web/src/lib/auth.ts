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

const isLoopbackUrl = (url: string | undefined) => {
  if (!url) return false;

  try {
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
    );
  } catch {
    return false;
  }
};

const getProductionSafeOrigin = (url: string | undefined) => {
  if (process.env.VERCEL && isLoopbackUrl(url)) return undefined;
  return getOrigin(url);
};

const authUrl = getProductionSafeOrigin(process.env.BETTER_AUTH_URL);
const appUrl = getProductionSafeOrigin(process.env.NEXT_PUBLIC_APP_URL);
const vercelProjectUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;
const vercelDeploymentUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;
const authHost = getHost(authUrl);
const appHost = getHost(appUrl);
const fallbackUrl =
  authUrl || appUrl || vercelDeploymentUrl || vercelProjectUrl;

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required");
}

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
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
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
      },
      deletedAt: {
        type: "date",
        required: false,
      },
    },
  },
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
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
      requireLocalEmailVerified: false,
    },
  },
});
