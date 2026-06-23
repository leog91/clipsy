import { NextResponse } from "next/server";
import { listCollections, createCollection } from "@/lib/actions-collections";

export async function GET() {
  try {
    const collectionsList = await listCollections();
    return NextResponse.json(collectionsList);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, isPublic } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await createCollection(name, isPublic);
    return NextResponse.json(result, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
