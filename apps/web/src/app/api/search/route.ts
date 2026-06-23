import { NextRequest, NextResponse } from "next/server";
import { searchItems } from "@/lib/actions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query) {
      return NextResponse.json([]);
    }

    const results = await searchItems(query);
    return NextResponse.json(results);
  } catch (_error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
