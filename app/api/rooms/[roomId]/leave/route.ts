import { NextRequest, NextResponse } from "next/server";
import { leaveGameRoom } from "@/lib/multiplayer/room-engine";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params;
    let userId: string | undefined;

    const rawText = await request.text();
    if (rawText) {
      try {
        const body = JSON.parse(rawText);
        userId = body.userId;
      } catch {
        // Plain text or unparsed body
      }
    }

    if (!userId) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get("userId") || undefined;
    }

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: { code: "MISSING_PARAMS", message: "roomId and userId are required." } },
        { status: 400 }
      );
    }

    const result = await leaveGameRoom(roomId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Leave Room API Error:", error);
    return NextResponse.json(
      { error: { code: "LEAVE_FAILED", message: error?.message || "Failed to leave room." } },
      { status: 500 }
    );
  }
}
