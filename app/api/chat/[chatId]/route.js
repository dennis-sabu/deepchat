// app/api/chat/[chatId]/route.js
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
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
    const { message, image } = await request.json();

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

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: message.trim(),
      image: image || null,
      timestamp: new Date()
    };
    
    chat.messages.push(userMessage);

    // Build conversation history for Gemini
    const contents = chat.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

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
            temperature: 0.7,
            maxOutputTokens: 2000,
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