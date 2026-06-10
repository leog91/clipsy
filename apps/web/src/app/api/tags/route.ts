import { NextResponse } from "next/server";
import { listTags, createTag } from "@/lib/actions-tags";

export async function GET() {
  try {
    const tagsList = await listTags();
    return NextResponse.json(tagsList);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await createTag(name);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
