// app/api/chat/create/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
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

    // Ensure user exists in database with proper info
    const authResult = await auth();
    let user = await User.findById(userId);
    
    if (!user) {
      // Create user with info from Clerk
      const userName = authResult.sessionClaims?.name || 
                       authResult.sessionClaims?.firstName || 
                       authResult.sessionClaims?.fullName ||
                       authResult.sessionClaims?.username ||
                       'User';
      const userEmail = authResult.sessionClaims?.email || 
                        authResult.sessionClaims?.emailAddress ||
                        authResult.sessionClaims?.primaryEmailAddress?.emailAddress ||
                        undefined;
      
      user = await User.create({
        _id: userId,
        name: userName,
        email: userEmail,
        limitResetTime: new Date(),
        warnings: 0,
        bannedUntil: null
      });
    }

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