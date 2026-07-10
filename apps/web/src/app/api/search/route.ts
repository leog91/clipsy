import { NextRequest, NextResponse } from "next/server";
import { searchItems } from "@/lib/actions";
import { apiErrorResponse } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query) {
      return NextResponse.json([]);
    }

    const results = await searchItems(query);
    return NextResponse.json(results);
  } catch (error) {
    return apiErrorResponse(error, "Search failed");
  }
}
