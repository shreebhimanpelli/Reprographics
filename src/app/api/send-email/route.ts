import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { toEmail, subject, htmlBody } = await request.json();
    const user = process.env.SMTP_EMAIL;
    const pass = process.env.SMTP_PASSWORD;

    if (!user || !pass) {
      return NextResponse.json({ ok: true, mocked: true });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"FLAME University Reprographics Center" <${user}>`,
      to: toEmail,
      subject,
      html: htmlBody,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Email send failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Email failed" },
      { status: 500 },
    );
  }
}
