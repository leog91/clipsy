import { NextResponse } from "next/server";
import { updateCollectionVisibility } from "@/lib/actions-collections";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isPublic } = body;

    if (typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "isPublic boolean is required" }, { status: 400 });
    }

    await updateCollectionVisibility(id, isPublic);
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}