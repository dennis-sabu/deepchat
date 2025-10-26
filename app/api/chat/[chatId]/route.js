// app/api/chat/[chatId]/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request, context) {
  try {
    const authResult = await auth();
    console.log("POST [chatId] - Auth result:", authResult);
    const { userId } = authResult;
    
    if (!userId) {
      console.log("POST [chatId] - No userId found");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;
    console.log("POST [chatId] - chatId:", chatId, "userId:", userId);
    const body = await request.json();
    const { message, image, stop } = body;

    // If frontend sends a stop flag (or user typed 'stop'), immediately stop and return
    if (stop === true || (typeof message === 'string' && message.trim().toLowerCase() === 'stop')) {
      return NextResponse.json({ success: true, message: 'Stopped by user.' });
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        message: "Google API key not configured" 
      }, { status: 500 });
    }

    await connectDB();

    // Find the chat and verify ownership
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      );
    }

    // Get or create user record to track limit reset time
    let user = await User.findById(userId);
    if (!user) {
      user = await User.create({
        _id: userId,
        name: authResult.sessionClaims?.name || 'User',
        email: authResult.sessionClaims?.email || '',
        limitResetTime: new Date()
      });
    }

    // Check if 8 hours have passed since last reset
    const now = new Date();
    const eightHoursInMs = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const timeSinceReset = now - new Date(user.limitResetTime);

    // If 8 hours have passed, reset by deleting all old messages and updating reset time
    if (timeSinceReset >= eightHoursInMs) {
      // Delete all messages from all user's chats (reset the count)
      await Chat.updateMany(
        { userId },
        { $set: { messages: [] } }
      );
      
      // Update the reset time
      user.limitResetTime = now;
      await user.save();
    }

    // Check if user has reached the 20 response limit in current 8-hour window
    const allUserChats = await Chat.find({ userId });
    const totalAiMessages = allUserChats.reduce((count, c) => {
      return count + c.messages.filter(msg => msg.role === 'assistant').length;
    }, 0);
    
    if (totalAiMessages >= 20) {
      // Calculate time remaining until reset
      const timeUntilReset = eightHoursInMs - timeSinceReset;
      const hoursRemaining = Math.floor(timeUntilReset / (60 * 60 * 1000));
      const minutesRemaining = Math.floor((timeUntilReset % (60 * 60 * 1000)) / (60 * 1000));
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Account limit reached. You've used all 20 AI responses. Resets in ${hoursRemaining}h ${minutesRemaining}m.` 
        },
        { status: 403 }
      );
    }

    // Detect simple echo/repeat commands: if user says "repeat X" or "echo X", just return X
    const trimmedMessage = message.trim();
    const echoMatch = trimmedMessage.match(/^(?:repeat|echo|say exactly)[:\s]+(.+)/i);
    if (echoMatch) {
      const echoed = echoMatch[1].trim();
      const userMessage = { role: 'user', content: trimmedMessage, image: image || null, timestamp: new Date() };
      const aiEcho = { role: 'assistant', content: echoed, timestamp: new Date() };
      chat.messages.push(userMessage);
      chat.messages.push(aiEcho);
      chat.updatedAt = new Date();
      await chat.save();
      return NextResponse.json({ success: true, message: echoed, chat: { _id: chat._id, name: chat.name, messages: chat.messages, updatedAt: chat.updatedAt } });
    }

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: trimmedMessage,
      image: image || null,
      timestamp: new Date()
    };
    chat.messages.push(userMessage);

    // Build a short conversation history (last 6 messages) for brevity
    const recent = chat.messages.slice(-6);
    const contents = recent.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));

    // Call Gemini API directly
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GOOGLE_API_KEY,
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            // Keep replies short by default. Increase only when user asks for more.
            temperature: 0.2,
            maxOutputTokens: 60,
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return NextResponse.json(
        { success: false, message: data.error?.message || "AI service error" },
        { status: 500 }
      );
    }

    // Extract AI response
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";

    // Add AI response to chat
    const aiMessageObj = {
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date()
    };
    
    chat.messages.push(aiMessageObj);
    chat.updatedAt = new Date();
    
    // Update chat name if it's the first message
    if (chat.messages.length === 2) {
      chat.name = message.trim().substring(0, 30) + (message.length > 30 ? '...' : '');
    }
    
    await chat.save();

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      chat: {
        _id: chat._id,
        name: chat.name,
        messages: chat.messages,
        updatedAt: chat.updatedAt
      }
    });

  } catch (error) {
    console.error("POST /api/chat/[chatId] error:", error);
    
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Get chat messages
export async function GET(request, context) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;
    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      chat: {
        _id: chat._id,
        name: chat.name,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });

  } catch (error) {
    console.error("GET /api/chat/[chatId] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Delete chat
export async function DELETE(request, context) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;
    await connectDB();

    const deletedChat = await Chat.findOneAndDelete({ _id: chatId, userId });

    if (!deletedChat) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully"
    });

  } catch (error) {
    console.error("DELETE /api/chat/[chatId] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}