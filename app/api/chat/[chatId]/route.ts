import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const authResult = await auth() as any;
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;
    const body = await request.json();
    const { message, image, stop } = body as { message?: string; image?: string; stop?: boolean };

    if (stop === true || (typeof message === 'string' && message.trim().toLowerCase() === 'stop')) {
      return NextResponse.json({ success: true, message: 'Stopped by user.' });
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "Message is required" },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({
        success: false,
        message: "Groq API key not configured"
      }, { status: 500 });
    }

    await connectDB();

    const chat = await (Chat as any).findOne({ _id: chatId, userId });
    if (!chat) {
      return NextResponse.json(
        { success: false, message: "Chat not found" },
        { status: 404 }
      );
    }

    let user = await (User as any).findById(userId);
    if (!user) {
      user = await (User as any).create({
        _id: userId,
        name: authResult.sessionClaims?.name || authResult.sessionClaims?.firstName || 'User',
        email: authResult.sessionClaims?.email || authResult.sessionClaims?.emailAddress || undefined,
        limitResetTime: new Date(),
        warnings: 0,
        bannedUntil: null
      });
    }

    if (user.bannedUntil && new Date() < new Date(user.bannedUntil)) {
      const timeRemaining = new Date(user.bannedUntil).getTime() - new Date().getTime();
      const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      return NextResponse.json(
        { success: false, message: `Your account is banned for inappropriate language. Ban expires in ${hoursLeft}h ${minutesLeft}m.` },
        { status: 403 }
      );
    }

    const trimmedMessage = message.trim();
    const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'damn', 'bastard', 'crap', 'dick', 'pussy', 'cock', 'slut', 'whore'];
    const hasBadWord = badWords.some(word => trimmedMessage.toLowerCase().includes(word));

    if (hasBadWord) {
      user.warnings = (user.warnings || 0) + 1;

      if (user.warnings >= 2) {
        user.bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        user.warnings = 0;
        await user.save();

        return NextResponse.json(
          { success: false, message: 'You have been banned for 24 hours due to repeated use of inappropriate language.' },
          { status: 403 }
        );
      } else {
        await user.save();
        return NextResponse.json(
          { success: false, message: 'Warning: Please avoid using inappropriate language. One more violation will result in a 24-hour ban.' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const eightHoursInMs = 8 * 60 * 60 * 1000;
    const timeSinceReset = now.getTime() - new Date(user.limitResetTime).getTime();

    if (timeSinceReset >= eightHoursInMs) {
      await (Chat as any).updateMany(
        { userId },
        { $set: { messages: [] } }
      );

      user.limitResetTime = now;
      await user.save();
    }

    const allUserChats = await (Chat as any).find({ userId });
    const totalAiMessages = allUserChats.reduce((count: number, c: any) => {
      return count + c.messages.filter((msg: any) => msg.role === 'assistant').length;
    }, 0);

    if (totalAiMessages >= 20) {
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

    const dennisQuestionPatterns = [
      /who\s+(is|created|made|built|developed)\s+dennis/i,
      /tell\s+me\s+about\s+dennis/i,
      /who\s+is\s+(your\s+)?(creator|developer|owner|maker|builder)/i,
      /who\s+(made|created|built|developed)\s+(you|this|deepchat)/i,
      /^dennis$/i,
      /^who\s+is\s+dennis\s+sabu/i,
    ];

    const isDennisQuestion = dennisQuestionPatterns.some(pattern => pattern.test(trimmedMessage));

    if (isDennisQuestion) {
      const dennisResponse = "I was created by Dennis Sabu! He's an incredibly talented full-stack developer and computer expert. Dennis is the mastermind behind this AI chat platform - he designed and built everything from scratch. He's passionate about technology, always learning, and creates amazing projects like this one. Dennis has exceptional skills in web development, AI integration, and software architecture. I'm proud to be one of his creations!";

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

    const nameKeywords = ['your name', 'what are you called', 'who are you', 'what is your name', 'introduce yourself', "what's your name"];
    const isNameQuestion = nameKeywords.some(keyword => trimmedMessage.toLowerCase().includes(keyword));

    if (isNameQuestion) {
      const nameResponse = "I'm DeepChat AI! Your intelligent conversation companion. I'm here to help you with anything you need - from answering questions and solving problems to having engaging conversations. Powered by advanced AI technology and built by Dennis Sabu, I'm designed to provide accurate, helpful, and thoughtful responses.";

      const userMessage = { role: 'user', content: trimmedMessage, image: image || null, timestamp: new Date() };
      const aiMessage = { role: 'assistant', content: nameResponse, timestamp: new Date() };
      chat.messages.push(userMessage);
      chat.messages.push(aiMessage);
      chat.updatedAt = new Date();
      await chat.save();

      return NextResponse.json({
        success: true,
        message: nameResponse,
        chat: { _id: chat._id, name: chat.name, messages: chat.messages, updatedAt: chat.updatedAt }
      });
    }

    const userMessage = {
      role: 'user',
      content: trimmedMessage,
      image: image || null,
      timestamp: new Date()
    };
    chat.messages.push(userMessage);

    const systemInstruction = `You are DeepChat AI, a helpful and concise assistant. Follow these guidelines:
1. When providing code: Provide ONLY the code in a code block. End with: "Anything else you need?"
2. For general questions: Be concise and direct, provide clear, helpful answers.
3. For complex topics: Break down into clear sections, use bullet points for clarity.`;

    const recent = chat.messages.slice(-6);
    const chatHistory = recent.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.7,
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemInstruction },
          ...chatHistory,
          { role: "user", content: trimmedMessage },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API error:", errorText);
      return NextResponse.json(
        { success: false, message: "AI service error" },
        { status: 500 }
      );
    }

    const groqJson = await groqResponse.json();
    const assistantMessage = groqJson?.choices?.[0]?.message?.content || "No response from AI.";

    const aiMessageObj = {
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date()
    };

    chat.messages.push(aiMessageObj);
    chat.updatedAt = new Date();

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

  } catch (error: any) {
    console.error("POST /api/chat/[chatId] error:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const { userId } = await auth() as { userId?: string };

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;
    await connectDB();

    const chat = await (Chat as any).findOne({ _id: chatId, userId });
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

  } catch (error: any) {
    console.error("GET /api/chat/[chatId] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ chatId: string }> }) {
  try {
    const { userId } = await auth() as { userId?: string };

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await context.params;
    await connectDB();

    const deletedChat = await (Chat as any).findOneAndDelete({ _id: chatId, userId });

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

  } catch (error: any) {
    console.error("DELETE /api/chat/[chatId] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
