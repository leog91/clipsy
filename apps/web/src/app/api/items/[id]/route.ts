import { NextRequest, NextResponse } from "next/server";
import { getItemById, updateItem } from "@/lib/actions";
import { updateItemSchema } from "@clipsy/shared";
import { apiErrorResponse } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getItemById(id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    return apiErrorResponse(error, "Failed to fetch item");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateItemSchema.parse(body);

    await updateItem(id, validated);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update item");
  }
}
