import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    return NextResponse.json({
      userId,
      clerkUser: {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        fullName: clerkUser.fullName,
        username: clerkUser.username,
        emailAddresses: clerkUser.emailAddresses,
        primaryEmailAddressId: clerkUser.primaryEmailAddressId,
        primaryEmailAddress: clerkUser.primaryEmailAddress,
        publicMetadata: clerkUser.publicMetadata,
        unsafeMetadata: clerkUser.unsafeMetadata,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
