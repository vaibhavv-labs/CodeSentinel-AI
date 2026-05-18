import { NextResponse } from "next/server";
import { auth } from "@/auth"; 
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
        // 1. Verify the user is securely logged in
        const session = await auth();
        
        // Using the user ID is safer than email, in case they change their email address!
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Get the new data from the frontend request
        const body = await req.json();
        const { name, email, bio } = body;

        // 3. Update the user in the database
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { name, email, bio }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("PROFILE_UPDATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}