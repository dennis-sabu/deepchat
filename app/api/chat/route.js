// app/api/chat/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Get all chats for a user
export async function GET(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const chats = await Chat.find({ userId })
      .select('_id name createdAt updatedAt')
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      chats
    });

  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}