import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const domain = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${domain}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"CodeTrust Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset your password",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px; background-color: #ffffff;">
        <h2 style="color: #111827; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
          We received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.
        </p>
        <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Sent by CodeTrust Dashboard.
        </p>
      </div>
    `,
    });
};
