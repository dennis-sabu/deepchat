// Using Google Generative AI (Gemini)
export const maxDuration = 60;

import connectDB from "@/config/db";
import Chat from "@/models/Chat";
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

    const { chatId, prompt } = await req.json();
    if (!chatId || !prompt) {
      return NextResponse.json({ success: false, message: "Missing chatId or prompt" });
    }

    // Connect to DB
    await connectDB();

    const data = await Chat.findOne({ userId, _id: chatId });
    if (!data) {
      return NextResponse.json({ success: false, message: "Chat not found" });
    }

    // Add user prompt
    const userPrompt = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };
    data.messages.push(userPrompt);

    console.log("Sending request to Google Gemini API with messages:", data.messages.length);

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Build chat history for Gemini
    const chatHistory = data.messages.slice(0, -1).map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Get AI response
    const result = await chat.sendMessage(prompt);
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
