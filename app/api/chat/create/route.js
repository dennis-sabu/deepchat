// app/api/chat/create/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { auth, clerkClient } from "@clerk/nextjs/server";
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
    let user = await User.findById(userId);
    
    if (!user) {
      // Fetch user data directly from Clerk
      let userName = 'User';
      let userEmail = undefined;
      
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        userName = clerkUser?.fullName || 
                   `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() ||
                   clerkUser?.firstName ||
                   'User';
        
        userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || 
                    clerkUser?.primaryEmailAddress?.emailAddress ||
                    undefined;
      } catch (error) {
        console.error('Error fetching Clerk user:', error);
      }
      
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