// app/api/chat/create/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const newChat = new Chat({
      userId,
      name: "New Chat",
      messages: [],
    });

    await newChat.save();

    return NextResponse.json({
      success: true,
      data: newChat,
      message: "Chat created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/chat/create error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}