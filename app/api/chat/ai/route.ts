// Using Google Generative AI (Gemini)
export const maxDuration = 60;

import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth() as { userId?: string };
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    const groqApiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!groqApiKey) {
      console.error("GROQ API key is not configured");
      return NextResponse.json({
        success: false,
        message: "API key not configured. Please set GROQ_API_KEY (or NEXT_PUBLIC_GROQ_API_KEY) in your environment variables."
      });
    }

    const body = await req.json();
    const { chatId, prompt, stop } = body as { chatId?: string; prompt?: string; stop?: boolean };
    if (stop === true || (typeof prompt === 'string' && prompt.trim().toLowerCase() === 'stop')) {
      return NextResponse.json({ success: true, message: 'Stopped by user.' });
    }
    if (!chatId || !prompt) {
      return NextResponse.json({ success: false, message: "Missing chatId or prompt" });
    }

    await connectDB();

    const data = await (Chat as any).findOne({ userId, _id: chatId });
    if (!data) {
      return NextResponse.json({ success: false, message: "Chat not found" });
    }

    let clerkUser: any;
    let userName = 'User';
    let userEmail: string | undefined = undefined;

    try {
      const client = await clerkClient();
      clerkUser = await client.users.getUser(userId);

      userName = clerkUser?.fullName ||
        `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() ||
        clerkUser?.firstName ||
        'User';

      userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ||
        clerkUser?.primaryEmailAddress?.emailAddress ||
        undefined;
    } catch (error: any) {
      console.error('Error fetching Clerk user:', error.message);
    }

    let user = await (User as any).findById(userId);
    if (!user) {
      user = await (User as any).create({
        _id: userId,
        name: userName,
        email: userEmail,
        limitResetTime: new Date(),
        warnings: 0,
        bannedUntil: null
      });
    } else {
      let needsUpdate = false;
      const updates: Record<string, string> = {};

      if (!user.name || user.name === 'User') {
        if (userName && userName !== 'User') {
          updates.name = userName;
          needsUpdate = true;
        }
      }

      if (!user.email && userEmail) {
        updates.email = userEmail;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await (User as any).findByIdAndUpdate(userId, updates);
        user = await (User as any).findById(userId);
      }
    }

    const isUnlimitedUser = user.hasUnlimitedChats === true;

    if (!isUnlimitedUser && user.bannedUntil && new Date() < new Date(user.bannedUntil)) {
      const timeRemaining = new Date(user.bannedUntil).getTime() - new Date().getTime();
      const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      return NextResponse.json(
        { success: false, message: `Your account is banned for inappropriate language. Ban expires in ${hoursLeft}h ${minutesLeft}m.` },
        { status: 403 }
      );
    }

    const trimmedPrompt = prompt.trim();

    if (!isUnlimitedUser) {
      const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'damn', 'bastard', 'crap', 'dick', 'pussy', 'cock', 'slut', 'whore'];
      const hasBadWord = badWords.some(word => trimmedPrompt.toLowerCase().includes(word));

      if (hasBadWord) {
        user.warnings = (user.warnings || 0) + 1;

        if (user.warnings >= 2) {
          user.bannedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
          user.warnings = 0;
          await user.save();
          return NextResponse.json(
            { success: false, message: 'Warning: You have been banned for 24 hours due to repeated use of inappropriate language. Please respect our community guidelines.' },
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
    }

    if (!isUnlimitedUser) {
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

      if (totalAiMessages >= 6) {
        const timeUntilReset = eightHoursInMs - timeSinceReset;
        const hoursRemaining = Math.floor(timeUntilReset / (60 * 60 * 1000));
        const minutesRemaining = Math.floor((timeUntilReset % (60 * 60 * 1000)) / (60 * 1000));

        return NextResponse.json({
          success: false,
          message: `Account limit reached. You've used all 6 AI responses. Resets in ${hoursRemaining}h ${minutesRemaining}m.`
        }, { status: 403 });
      }
    }

    const echoMatch = trimmedPrompt.match(/^(?:repeat|echo|say exactly)[:\s]+(.+)/i);
    if (echoMatch) {
      const echoed = echoMatch[1].trim();
      const userPromptObj = { role: 'user', content: trimmedPrompt, timestamp: Date.now() };
      const aiEcho = { role: 'assistant', content: echoed, timestamp: Date.now() };
      data.messages.push(userPromptObj);
      data.messages.push(aiEcho);
      await data.save();
      return NextResponse.json({ success: true, data: aiEcho });
    }

    const dennisKeywords = ['dennis', 'dennis sabu', 'creator', 'developer', 'owner', 'who made you', 'who created you', 'who built you'];
    const isDennisQuestion = dennisKeywords.some(keyword => trimmedPrompt.toLowerCase().includes(keyword));

    if (isDennisQuestion) {
      const dennisResponse = "I was created by Dennis Sabu! He's an incredibly talented full-stack developer and computer expert. Dennis is the mastermind behind this AI chat platform - he designed and built everything from scratch. He's passionate about technology, always learning, and creates amazing projects like this one. Dennis has exceptional skills in web development, AI integration, and software architecture. I'm proud to be one of his creations!";

      const userPromptObj = { role: 'user', content: trimmedPrompt, timestamp: Date.now() };
      const aiDennis = { role: 'assistant', content: dennisResponse, timestamp: Date.now() };
      data.messages.push(userPromptObj);
      data.messages.push(aiDennis);
      await data.save();
      return NextResponse.json({ success: true, data: aiDennis });
    }

    const nameKeywords = ['your name', 'what are you called', 'who are you', 'what is your name', 'introduce yourself', "what's your name"];
    const isNameQuestion = nameKeywords.some(keyword => trimmedPrompt.toLowerCase().includes(keyword));

    if (isNameQuestion) {
      const nameResponse = "I'm DeepChat AI! Your intelligent conversation companion. I'm here to help you with anything you need - from answering questions and solving problems to having engaging conversations. Powered by advanced AI technology and built by Dennis Sabu, I'm designed to provide accurate, helpful, and thoughtful responses.";

      const userPromptObj = { role: 'user', content: trimmedPrompt, timestamp: Date.now() };
      const aiName = { role: 'assistant', content: nameResponse, timestamp: Date.now() };
      data.messages.push(userPromptObj);
      data.messages.push(aiName);
      await data.save();
      return NextResponse.json({ success: true, data: aiName });
    }

    const userPrompt = {
      role: "user",
      content: trimmedPrompt,
      timestamp: Date.now(),
    };
    data.messages.push(userPrompt);

    const recent = data.messages.slice(-6);
    const chatHistory = recent.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

    const systemInstruction = `You are DeepChat AI, a helpful and concise assistant. Follow these guidelines:
1. When providing code: Provide ONLY the code in a code block. End with: "Anything else you need?"
2. For general questions: Be concise and direct, provide clear, helpful answers.
3. For complex topics: Break down into clear sections, use bullet points for clarity.`;

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
          { role: "user", content: trimmedPrompt },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API error ${groqResponse.status}: ${errorText}`);
    }

    const groqJson = await groqResponse.json();
    const aiText = groqJson?.choices?.[0]?.message?.content || "";

    if (!aiText) {
      throw new Error("Groq returned an empty response");
    }

    const aiMessage = {
      role: "assistant",
      content: aiText,
      timestamp: Date.now(),
    };

    data.messages.push(aiMessage);
    await data.save();

    return NextResponse.json({
      success: true,
      data: aiMessage,
    });

  } catch (error: any) {
    console.error("API Error:", error);

    if (error.message?.includes('401') || error.message?.toLowerCase().includes('unauthorized')) {
      return NextResponse.json({
        success: false,
        error: "Invalid API key. Please check your GROQ_API_KEY."
      });
    } else if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
      return NextResponse.json({
        success: false,
        error: "API rate limit or quota exceeded. Please check your Groq account limits."
      });
    } else if (error.message?.includes('fetch')) {
      return NextResponse.json({
        success: false,
        error: "Network error. Please check your internet connection."
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || "An unexpected error occurred"
    });
  }
}
