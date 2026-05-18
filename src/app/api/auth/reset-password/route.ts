
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: "Missing token or password" },
                { status: 400 }
            );
        }

        // Find the token in the database
        const verificationToken = await prisma.verificationToken.findFirst({
            where: { token },
        });

        if (!verificationToken) {
            return NextResponse.json(
                { message: "Invalid or expired reset link" },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (new Date() > verificationToken.expires) {
            // Cleanup expired token using the composite key
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: verificationToken.identifier,
                        token: verificationToken.token,
                    },
                },
            }).catch(() => { });

            return NextResponse.json(
                { message: "Reset link has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Find the user associated with the token (identifier is the email)
        const user = await prisma.user.findUnique({
            where: { email: verificationToken.identifier },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Associated user account not found" },
                { status: 404 }
            );
        }

        // Hash the new password - using 10 rounds for consistency
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password and delete the token in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            }),
            prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: verificationToken.identifier,
                        token: verificationToken.token,
                    },
                },
            }),
        ]);

        return NextResponse.json({ message: "Your password has been reset successfully." });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { message: "An unexpected error occurred. Please try again later." },
            { status: 500 }
        );
    }
}
