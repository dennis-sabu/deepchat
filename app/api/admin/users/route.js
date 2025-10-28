import connectDB from "@/config/db";
import User from "@/models/User";
import Chat from "@/models/Chat";
import { NextResponse } from "next/server";

const ADMIN_SECRET = "dennis2005";

// Verify admin access
function verifyAdmin(request) {
  const adminCode = request.headers.get('x-admin-code');
  return adminCode === ADMIN_SECRET;
}

// GET - Fetch all users
export async function GET(request) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    
    // Get chat counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const chats = await Chat.find({ userId: user._id });
        const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
        const aiResponses = chats.reduce((sum, chat) => {
          return sum + chat.messages.filter(msg => msg.role === 'assistant').length;
        }, 0);
        
        return {
          ...user,
          totalChats: chats.length,
          totalMessages,
          aiResponses
        };
      })
    );

    return NextResponse.json({ success: true, users: usersWithStats });
  } catch (error) {
    console.error("Admin GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - Admin actions (delete, unblock, toggle unlimited, edit)
export async function POST(request) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, userData } = body;

    await connectDB();

    switch (action) {
      case 'delete':
        // Delete user and all their chats
        await User.findByIdAndDelete(userId);
        await Chat.deleteMany({ userId });
        return NextResponse.json({ success: true, message: "User deleted successfully" });

      case 'unblock':
        // Remove ban and reset warnings
        await User.findByIdAndUpdate(userId, {
          bannedUntil: null,
          warnings: 0
        });
        return NextResponse.json({ success: true, message: "User unblocked successfully" });

      case 'toggleUnlimited':
        // Toggle unlimited chat privilege
        const user = await User.findById(userId);
        await User.findByIdAndUpdate(userId, {
          hasUnlimitedChats: !user.hasUnlimitedChats
        });
        return NextResponse.json({ 
          success: true, 
          message: `Unlimited chats ${!user.hasUnlimitedChats ? 'enabled' : 'disabled'}`,
          hasUnlimitedChats: !user.hasUnlimitedChats
        });

      case 'resetLimit':
        // Reset the 8-hour limit
        await User.findByIdAndUpdate(userId, {
          limitResetTime: new Date()
        });
        await Chat.updateMany({ userId }, { $set: { messages: [] } });
        return NextResponse.json({ success: true, message: "Chat limit reset successfully" });

      case 'edit':
        // Update user details
        const allowedFields = ['name', 'email'];
        const updateData = {};
        allowedFields.forEach(field => {
          if (userData[field] !== undefined) {
            updateData[field] = userData[field];
          }
        });
        
        await User.findByIdAndUpdate(userId, updateData);
        return NextResponse.json({ success: true, message: "User updated successfully" });

      case 'ban':
        // Ban user for specified hours
        const banHours = userData?.banHours || 24;
        await User.findByIdAndUpdate(userId, {
          bannedUntil: new Date(Date.now() + banHours * 60 * 60 * 1000)
        });
        return NextResponse.json({ success: true, message: `User banned for ${banHours} hours` });

      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
