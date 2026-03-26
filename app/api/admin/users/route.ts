import connectDB from "@/config/db";
import User from "@/models/User";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";

const ADMIN_SECRET = "dennis2005";

function verifyAdmin(request: Request): boolean {
  const adminCode = request.headers.get('x-admin-code');
  return adminCode === ADMIN_SECRET;
}

export async function GET(request: Request) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const users = await (User as any).find({}).sort({ createdAt: -1 }).lean();

    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const chats = await (Chat as any).find({ userId: user._id }).sort({ updatedAt: -1 });
        const totalMessages = chats.reduce((sum: number, chat: any) => sum + chat.messages.length, 0);
        const aiResponses = chats.reduce((sum: number, chat: any) => {
          return sum + chat.messages.filter((msg: any) => msg.role === 'assistant').length;
        }, 0);

        let lastChatTime: Date | null = null;
        if (chats.length > 0) {
          const lastChat = chats[0];
          if (lastChat.messages && lastChat.messages.length > 0) {
            const lastMessage = lastChat.messages[lastChat.messages.length - 1];
            lastChatTime = lastMessage.timestamp || lastChat.updatedAt;
          }
        }

        return {
          ...user,
          totalChats: chats.length,
          totalMessages,
          aiResponses,
          lastChatTime
        };
      })
    );

    return NextResponse.json({ success: true, users: usersWithStats });
  } catch (error: any) {
    console.error("Admin GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, userData } = body as {
      action: string;
      userId: string;
      userData?: { banHours?: number; name?: string; email?: string };
    };

    await connectDB();

    switch (action) {
      case 'delete':
        await (User as any).findByIdAndDelete(userId);
        await (Chat as any).deleteMany({ userId });
        return NextResponse.json({ success: true, message: "User deleted successfully" });

      case 'unblock':
        await (User as any).findByIdAndUpdate(userId, {
          bannedUntil: null,
          warnings: 0
        });
        return NextResponse.json({ success: true, message: "User unblocked successfully" });

      case 'toggleUnlimited': {
        const user = await (User as any).findById(userId);
        await (User as any).findByIdAndUpdate(userId, {
          hasUnlimitedChats: !user.hasUnlimitedChats
        });
        return NextResponse.json({
          success: true,
          message: `Unlimited chats ${!user.hasUnlimitedChats ? 'enabled' : 'disabled'}`,
          hasUnlimitedChats: !user.hasUnlimitedChats
        });
      }

      case 'resetLimit':
        await (User as any).findByIdAndUpdate(userId, {
          limitResetTime: new Date()
        });
        await (Chat as any).updateMany({ userId }, { $set: { messages: [] } });
        return NextResponse.json({ success: true, message: "Chat limit reset successfully" });

      case 'edit': {
        const allowedFields = ['name', 'email'];
        const updateData: Record<string, string> = {};
        allowedFields.forEach(field => {
          if (userData && (userData as any)[field] !== undefined) {
            updateData[field] = (userData as any)[field];
          }
        });

        await (User as any).findByIdAndUpdate(userId, updateData);
        return NextResponse.json({ success: true, message: "User updated successfully" });
      }

      case 'ban': {
        const banHours = userData?.banHours || 24;
        await (User as any).findByIdAndUpdate(userId, {
          bannedUntil: new Date(Date.now() + banHours * 60 * 60 * 1000)
        });
        return NextResponse.json({ success: true, message: `User banned for ${banHours} hours` });
      }

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
