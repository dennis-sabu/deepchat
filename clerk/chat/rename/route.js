import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/dist/types/server";
import { NextResponse } from "next/server";


export async function POST(request) {
  try{
    const {userId} = getAuth(request);
    if(!userId){
      return NextResponse.json({success: false, message: "Unauthorized"});
    }
    const { chatId, name } = await request.json();
    await connectDB();
    await Chat.findOneAndUpdate(
      { _id: chatId, UserId: userId },
      { name },
      { new: true }
    );

    return NextResponse.json({success: true, message: "Chat renamed successfully"});

  }catch (error) {
    return NextResponse.json({success: false, message: "Internal Server Error"});
  }
}