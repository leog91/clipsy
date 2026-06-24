import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const socialProviders = auth.options.socialProviders ?? {};
  const providers = Object.entries(socialProviders)
    .filter(([key]) => key !== "accountLinking")
    .map(([key, value]) => ({
      id: key,
      name: key,
      enabled: Boolean(value && typeof value === "object" && "clientId" in value),
    }));

  return NextResponse.json({ providers });
}
