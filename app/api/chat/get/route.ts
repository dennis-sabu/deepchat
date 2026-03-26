import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth() as { userId?: string };

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const chats = await (Chat as any).find({ userId })
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      data: chats
    }, { status: 200 });

  } catch (error: any) {
    console.error("GET /api/chat/get error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
