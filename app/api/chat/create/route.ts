import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth() as { userId?: string };

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    let user = await (User as any).findById(userId);

    if (!user) {
      let userName = 'User';
      let userEmail: string | undefined = undefined;

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

      user = await (User as any).create({
        _id: userId,
        name: userName,
        email: userEmail,
        limitResetTime: new Date(),
        warnings: 0,
        bannedUntil: null
      });
    }

    const newChat = new (Chat as any)({
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

  } catch (error: any) {
    console.error("POST /api/chat/create error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
