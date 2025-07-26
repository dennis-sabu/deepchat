import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = await getAuth(request); // ✅ await here
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 } // ✅ set proper status
      );
    }

    await connectDB();
    const data = await Chat.find({ userId });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("GET /api/chat/get error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
