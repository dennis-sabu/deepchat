import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function PUT(request: Request) {
  try {
    const { userId } = await auth() as { userId?: string };
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const { chatId, name } = await request.json() as { chatId?: string; name?: string };

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
    }

    await connectDB();
    const updatedChat = await (Chat as any).findOneAndUpdate(
      { _id: chatId, userId: userId },
      { name: name.trim() },
      { new: true }
    );

    if (!updatedChat) {
      return NextResponse.json({ success: false, message: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Chat renamed successfully", data: updatedChat });

  } catch (error: any) {
    console.error("Rename chat error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
