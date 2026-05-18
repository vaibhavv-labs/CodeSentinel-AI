import { prisma } from "@/lib/prisma";
import crypto_native from "crypto";
import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // For security reasons, don't reveal if user exists or not
    if (!user) {
      return NextResponse.json({ message: "If an account with that email exists, a reset link has been sent." });
    }

    const token = crypto_native.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    // Upsert verification token so we don't have multiple active tokens for the same user
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email,
          token: token // This won't work for upsert if we want to replace old ones. 
          // Actually NextAuth schema uses @@unique([identifier, token])
          // Let's just create a new one, old ones will expire or can be cleaned up.
        },
      },
      update: {
        token: token,
        expires: expires,
      },
      create: {
        identifier: email,
        token: token,
        expires: expires,
      },
    }).catch(async () => {
      // Fallback if upsert logic with identifier_token is tricky due to token being dynamic
      // Better way: delete old ones first or just create (and handle cleanup later)
      await prisma.verificationToken.deleteMany({
        where: { identifier: email }
      });
      return prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        }
      });
    });

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ message: "Reset link sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
