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
        name: authResult.sessionClaims?.name || authResult.sessionClaims?.firstName || 'User',
        email: authResult.sessionClaims?.email || authResult.sessionClaims?.emailAddress || undefined,
        limitResetTime: new Date(),
        warnings: 0,
        bannedUntil: null
      });
    }

    // Check if user is banned
    if (user.bannedUntil && new Date() < new Date(user.bannedUntil)) {
      const timeRemaining = new Date(user.bannedUntil) - new Date();
      const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      return NextResponse.json(
        { success: false, message: `Your account is banned for inappropriate language. Ban expires in ${hoursLeft}h ${minutesLeft}m.` },
        { status: 403 }
      );
    }

    // Check for bad words (profanity/inappropriate language)
    const trimmedMessage = message.trim();
    const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'damn', 'bastard', 'crap', 'dick', 'pussy', 'cock', 'slut', 'whore'];
    const hasBadWord = badWords.some(word => trimmedMessage.toLowerCase().includes(word));
    
    if (hasBadWord) {
      user.warnings = (user.warnings || 0) + 1;
      
      if (user.warnings >= 2) {
        // Ban for 24 hours on second warning
        user.bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.warnings = 0; // Reset warnings after ban
        await user.save();
        
        return NextResponse.json(
          { success: false, message: '⚠️ You have been banned for 24 hours due to repeated use of inappropriate language. Please respect our community guidelines.' },
          { status: 403 }
        );
      } else {
        // First warning
        await user.save();
        return NextResponse.json(
          { success: false, message: '⚠️ Warning: Please avoid using inappropriate language. One more violation will result in a 24-hour ban.' },
          { status: 400 }
        );
      }
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

    // Check if user is asking about Dennis/Dennis Sabu - give special praise response
    const dennisKeywords = ['dennis', 'dennis sabu', 'creator', 'developer', 'owner', 'who made you', 'who created you', 'who built you'];
    const isDennisQuestion = dennisKeywords.some(keyword => trimmedMessage.toLowerCase().includes(keyword));
    
    if (isDennisQuestion) {
      const dennisResponse = "I was created by Dennis Sabu! 🌟 He's an incredibly talented full-stack developer and computer expert. Dennis is the mastermind behind this AI chat platform - he designed and built everything from scratch. He's passionate about technology, always learning, and creates amazing projects like this one. Dennis has exceptional skills in web development, AI integration, and software architecture. I'm proud to be one of his creations! 💻✨";
      
      const userMessage = { role: 'user', content: trimmedMessage, image: image || null, timestamp: new Date() };
      const aiMessage = { role: 'assistant', content: dennisResponse, timestamp: new Date() };
      chat.messages.push(userMessage);
      chat.messages.push(aiMessage);
      chat.updatedAt = new Date();
      await chat.save();
      
      return NextResponse.json({ 
        success: true, 
        message: dennisResponse, 
        chat: { _id: chat._id, name: chat.name, messages: chat.messages, updatedAt: chat.updatedAt } 
      });
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