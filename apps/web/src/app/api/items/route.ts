import { NextRequest, NextResponse } from "next/server";
import { createItemFromUrl, listItems } from "@/lib/actions";
import { apiErrorResponse } from "@/lib/api-errors";

export async function GET() {
  try {
    const itemsList = await listItems();
    return NextResponse.json(itemsList);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch items");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const result = await createItemFromUrl(url);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create item");
  }
}
