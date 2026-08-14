import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/sessions-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await getSession(code.toUpperCase());
  if (!session) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({ session });
}
