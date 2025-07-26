// Please install OpenAI SDK first: `npm install openai`
export const maxDuration = 60;

import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Setup OpenRouter OpenAI client
const openai = new OpenAI({
  baseURL: 'https://chat.deepseek.com/',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
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

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: data.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const message = completion.choices[0].message;
    message.timestamp = Date.now();

    // Save AI response
    data.messages.push(message);
    await data.save();

    return NextResponse.json({
      success: true,
      data: message,
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
