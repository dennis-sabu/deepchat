import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  const secret = process.env.CLERK_SECRET_KEY;

  if (!secret) {
    return NextResponse.json({ error: "CLERK_SECRET_KEY not set" }, { status: 500 });
  }

  const headerPayload = headers();

  const svixHeaders = {
    "svix-id": headerPayload.get("svix-id"),
    "svix-signature": headerPayload.get("svix-signature"),
    "svix-timestamp": headerPayload.get("svix-timestamp"),
  };

  if (!svixHeaders["svix-id"] || !svixHeaders["svix-signature"] || !svixHeaders["svix-timestamp"]) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(body, svixHeaders);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const { data, type } = evt;

  const userData = {
    _id: data.id,
    email: data.email_addresses?.[0]?.email_address || "",
    name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
    image: data.image_url,
  };

  await connectDB();

  switch (type) {
    case "user.created":
      await User.create(userData);
      break;
    case "user.updated":
      await User.findByIdAndUpdate(data.id, userData);
      break;
    case "user.deleted":
      await User.findByIdAndDelete(data.id);
      break;
    default:
      break;
  }

  return NextResponse.json({ message: "Event received successfully" });
}
