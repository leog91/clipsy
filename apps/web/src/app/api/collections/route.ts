import { NextResponse } from "next/server";
import { listCollections, createCollection } from "@/lib/actions-collections";
import { apiErrorResponse } from "@/lib/api-errors";

export async function GET() {
  try {
    const collectionsList = await listCollections();
    return NextResponse.json(collectionsList);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch collections");
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
  } catch (error) {
    return apiErrorResponse(error, "Failed to create collection");
  }
}
