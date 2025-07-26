import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try{
    const {userId} = getAuth(request);
    const { chatId } = await request.json();
    if(!userId){
      return NextResponse.json({success: false, message: "Unauthorized"});
    }
    // Connect to the database
    await connectDB();
    // Delete the chat
    await Chat.deleteOne({ _id: chatId, UserId: userId });
    return NextResponse.json({success: true, message: "Chat deleted successfully"});
  }catch (error) {
    return NextResponse.json({success: false, error: error.message});
  }
}