import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await getAuth(request); 
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" }
       
      );
    }

    const ChatData = {
      userId,
      messages: [],
      name: "New Chat",
    };

    await connectDB();
    await Chat.create(ChatData);

    return NextResponse.json(
      { success: true, message: "Chat created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/chat/create error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
