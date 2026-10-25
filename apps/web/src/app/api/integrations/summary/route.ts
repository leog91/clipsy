import { getDb } from "@clipsy/db";
import { ShelfyGrants } from "@/lib/shelfy-grants";
import { readSummary } from "@/lib/summary";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Authorization",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  try {
    const owner = await new ShelfyGrants(getDb()).owner(
      request.headers.get("authorization"),
    );
    if (!owner) return json({ error: "Unauthorized" }, 401);
    const summary = await readSummary(owner);
    return summary ? json(summary) : json({ error: "Unauthorized" }, 401);
  } catch {
    return json({ error: "Summary unavailable" }, 503);
  }
}
