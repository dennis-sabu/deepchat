// Using Google Generative AI (Gemini)
export const maxDuration = 60;

import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Setup Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY is not configured");
      return NextResponse.json({ 
        success: false, 
        message: "API key not configured. Please set GOOGLE_API_KEY in your environment variables." 
      });
    }

    const body = await req.json();
    const { chatId, prompt, stop } = body;
    if (stop === true || (typeof prompt === 'string' && prompt.trim().toLowerCase() === 'stop')) {
      return NextResponse.json({ success: true, message: 'Stopped by user.' });
    }
    if (!chatId || !prompt) {
      return NextResponse.json({ success: false, message: "Missing chatId or prompt" });
    }

    // Connect to DB
    await connectDB();

    const data = await Chat.findOne({ userId, _id: chatId });
    if (!data) {
      return NextResponse.json({ success: false, message: "Chat not found" });
    }

    // Get or create user record to track limit reset time
    const authResult = await auth();
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

    // If user has unlimited chats, skip ALL restrictions (ban, bad words, limits)
    const isUnlimitedUser = user.hasUnlimitedChats === true;

    // Check if user is banned (skip for unlimited users)
    if (!isUnlimitedUser && user.bannedUntil && new Date() < new Date(user.bannedUntil)) {
      const timeRemaining = new Date(user.bannedUntil) - new Date();
      const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      return NextResponse.json(
        { success: false, message: `Your account is banned for inappropriate language. Ban expires in ${hoursLeft}h ${minutesLeft}m.` },
        { status: 403 }
      );
    }

    const trimmedPrompt = prompt.trim();

    // Check for bad words (skip for unlimited users)
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
            { success: false, message: '⚠️ You have been banned for 24 hours due to repeated use of inappropriate language. Please respect our community guidelines.' },
            { status: 403 }
          );
        } else {
          await user.save();
          return NextResponse.json(
            { success: false, message: '⚠️ Warning: Please avoid using inappropriate language. One more violation will result in a 24-hour ban.' },
            { status: 400 }
          );
        }
      }
    }

    // Check if 8 hours have passed since last reset (skip for unlimited users)
    if (!isUnlimitedUser) {
      const now = new Date();
      const eightHoursInMs = 8 * 60 * 60 * 1000;
      const timeSinceReset = now - new Date(user.limitResetTime);

      // If 8 hours have passed, reset by deleting all old messages and updating reset time
      if (timeSinceReset >= eightHoursInMs) {
        await Chat.updateMany(
          { userId },
          { $set: { messages: [] } }
        );
        
        user.limitResetTime = now;
        await user.save();
      }

      // Check if user has reached the 6 response limit
      const allUserChats = await Chat.find({ userId });
      const totalAiMessages = allUserChats.reduce((count, c) => {
        return count + c.messages.filter(msg => msg.role === 'assistant').length;
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

    // Detect simple echo/repeat command
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

    // Check if user is asking about Dennis/Dennis Sabu
    const dennisKeywords = ['dennis', 'dennis sabu', 'creator', 'developer', 'owner', 'who made you', 'who created you', 'who built you'];
    const isDennisQuestion = dennisKeywords.some(keyword => trimmedPrompt.toLowerCase().includes(keyword));
    
    if (isDennisQuestion) {
      const dennisResponse = "I was created by Dennis Sabu! 🌟 He's an incredibly talented full-stack developer and computer expert. Dennis is the mastermind behind this AI chat platform - he designed and built everything from scratch. He's passionate about technology, always learning, and creates amazing projects like this one. Dennis has exceptional skills in web development, AI integration, and software architecture. I'm proud to be one of his creations! 💻✨";
      
      const userPromptObj = { role: 'user', content: trimmedPrompt, timestamp: Date.now() };
      const aiDennis = { role: 'assistant', content: dennisResponse, timestamp: Date.now() };
      data.messages.push(userPromptObj);
      data.messages.push(aiDennis);
      await data.save();
      return NextResponse.json({ success: true, data: aiDennis });
    }

    // Check if user is asking about the AI's name
    const nameKeywords = ['your name', 'what are you called', 'who are you', 'what is your name', 'introduce yourself', "what's your name"];
    const isNameQuestion = nameKeywords.some(keyword => trimmedPrompt.toLowerCase().includes(keyword));
    
    if (isNameQuestion) {
      const nameResponse = "I'm DeepChat AI! 🚀\n\n✨ *Your intelligent conversation companion*\n\nI'm here to help you with anything you need - from answering questions and solving problems to having engaging conversations. Powered by advanced AI technology and built by Dennis Sabu, I'm designed to provide accurate, helpful, and thoughtful responses.\n\n💡 **What I can do:**\n- Answer questions on any topic\n- Help with coding and technical problems\n- Engage in creative conversations\n- Assist with learning and research\n- And much more!\n\nLet's chat! What can I help you with today? 😊";
      
      const userPromptObj = { role: 'user', content: trimmedPrompt, timestamp: Date.now() };
      const aiName = { role: 'assistant', content: nameResponse, timestamp: Date.now() };
      data.messages.push(userPromptObj);
      data.messages.push(aiName);
      await data.save();
      return NextResponse.json({ success: true, data: aiName });
    }

    // Add user prompt
    const userPrompt = {
      role: "user",
      content: trimmedPrompt,
      timestamp: Date.now(),
    };
    data.messages.push(userPrompt);

    console.log("Sending request to Google Gemini API with messages:", data.messages.length);

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Build a short chat history (send recent messages only) for concise replies
    const recent = data.messages.slice(-6);
    const chatHistory = recent.slice(0, -1).map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));

    // System instruction for concise, focused responses
    const systemInstruction = `You are DeepChat AI, a helpful and concise assistant. Follow these guidelines:

1. When providing code:
   - Start with: "Here's the code for [description]:"
   - Provide ONLY the code in a code block
   - End with: "Anything else you need?"
   - Do NOT explain the code unless explicitly asked
   - Do NOT provide compilation instructions unless asked
   - Do NOT add lengthy explanations or improvements

2. For general questions:
   - Be concise and direct
   - Provide clear, helpful answers
   - Use formatting for better readability
   - Keep responses focused and to the point

3. For complex topics:
   - Break down into clear sections
   - Use bullet points for clarity
   - Be thorough but concise

Remember: Be helpful, accurate, and respectful. Keep responses clean and professional.`;

    // Start chat with system instruction
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemInstruction,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    // Get AI response
    const result = await chat.sendMessage(trimmedPrompt);
    const response = await result.response;
    const aiMessage = {
      role: "assistant",
      content: response.text(),
      timestamp: Date.now(),
    };

    // Save AI response
    data.messages.push(aiMessage);
    await data.save();

    return NextResponse.json({
      success: true,
      data: aiMessage,
    });

  } catch (error) {
    console.error("API Error:", error);
    
    // Provide more specific error messages
    if (error.message?.includes('API_KEY_INVALID')) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid API key. Please check your GOOGLE_API_KEY." 
      });
    } else if (error.message?.includes('quota')) {
      return NextResponse.json({ 
        success: false, 
        error: "API quota exceeded. Please check your Google Cloud account." 
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
