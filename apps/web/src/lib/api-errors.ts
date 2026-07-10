import { NextResponse } from "next/server";

export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
