import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createItemFromUrl, listItems } from "@/lib/actions";

export async function GET() {
  try {
    const itemsList = await listItems();
    return NextResponse.json(itemsList);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
