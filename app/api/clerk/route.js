import { webhooks} from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";

export async function POST(req){
  const wh = new webhooks.Webhook(process.env.CLERK_SECRET_KEY)
  const headerPayload = await headers()
  const svixHeaders = {
    "svix-id": headerPayload.get("svix-id"),
    "svix-signature": headerPayload.get("svix-signature")
  };

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const {data, type} = wh.verify(body, svixHeaders)
  


  //Prepare the data to store in the database

  const userData = {
    _id: data.id,
    email: data.email_address[0].email_address,
    name: `${data.first_name} ${data.last_name}`,
    image: data.image_url
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
  return NextResponse.json({message: "Webhook received successfully"}, {status: 200});


}