import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth() as { userId?: string };
    const { chatId } = await request.json() as { chatId?: string };
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }
    await connectDB();
    await (Chat as any).deleteOne({ _id: chatId, userId: userId });
    return NextResponse.json({ success: true, message: "Chat deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
