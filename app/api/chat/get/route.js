// app/api/chat/get/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const authResult = await auth();
    console.log("GET /api/chat/get - Auth result:", authResult);
    const { userId } = authResult;
    
    if (!userId) {
      console.log("GET /api/chat/get - No userId found");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("GET /api/chat/get - userId:", userId);

    await connectDB();
    
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 });

    return NextResponse.json({ 
      success: true, 
      data: chats 
    }, { status: 200 });
    
  } catch (error) {
    console.error("GET /api/chat/get error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}