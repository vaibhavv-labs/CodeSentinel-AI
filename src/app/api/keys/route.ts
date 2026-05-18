import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET all keys for the logged-in user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const keys = await prisma.apiKey.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(keys);
    } catch (error) {
        console.error("API_KEY_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST to create a new key
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        // Generate a secure, random string for the key
        const randomBytes = crypto.randomBytes(24).toString('hex');
        const rawKey = `ct_live_${randomBytes}`;

        const newKey = await prisma.apiKey.create({
            data: {
                name: name || "Production API Key",
                key: rawKey,
                userId: session.user.id
            }
        });

        return NextResponse.json(newKey);
    } catch (error) {
        console.error("API_KEY_POST_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}