import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

// ── Increase the body size limit for this route ─────────────────────────
// Next.js App Router uses the Web Request API which doesn't have a
// built-in size limit like the Pages Router. However, Next.js 16
// enforces a default ~1MB limit on request.json(). We read the raw
// body ourselves and parse manually to handle large payloads.

interface EmailBody {
  to: string;
  sessionId: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    password: string;
    fromName: string;
  };
  saveDir?: string;
}

export async function POST(req: NextRequest) {
  try {
    // ── Parse body with explicit large payload handling ───────────
    let body: EmailBody;
    try {
      const rawText = await req.text();
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Invalid or oversized JSON payload. Ensure the request body is valid JSON." },
        { status: 400 }
      );
    }

    const { to, sessionId, smtpConfig, saveDir } = body;

    if (!to || !sessionId) {
      return NextResponse.json(
        { error: "Missing 'to' or 'sessionId' field" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Use provided SMTP config or fall back to env vars
    const host = smtpConfig?.host || process.env.SMTP_HOST || "";
    const port = smtpConfig?.port || parseInt(process.env.SMTP_PORT || "587");
    const user = smtpConfig?.user || process.env.SMTP_USER || "";
    const pass = smtpConfig?.password || process.env.SMTP_PASS || "";
    const fromName = smtpConfig?.fromName || process.env.SMTP_FROM_NAME || "Lenzy Photo";

    if (!host || !user || !pass) {
      return NextResponse.json(
        { error: "SMTP not configured. Please set up SMTP credentials in Admin settings." },
        { status: 500 }
      );
    }

    // ── Create transporter with explicit timeout and TLS settings ──
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000, // 10s connection timeout
      greetingTimeout: 10000,
      socketTimeout: 30000, // 30s for sending attachments
      tls: {
        // Allow self-signed certs in development
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });

    // ── Build attachments from saved files on disk ───────────────
    const attachments: nodemailer.SendMailOptions["attachments"] = [];

    if (saveDir) {
      const sessionDir = path.join(saveDir, sessionId);
      try {
        const framedPath = path.join(sessionDir, "framed.png");
        const gifPath = path.join(sessionDir, "animation.gif");

        const framedExists = await fs.access(framedPath).then(() => true).catch(() => false);
        const gifExists = await fs.access(gifPath).then(() => true).catch(() => false);

        if (framedExists) {
          attachments.push({
            filename: `${sessionId}_framed.png`,
            path: framedPath,
            contentType: "image/png",
          });
        }
        if (gifExists) {
          attachments.push({
            filename: `${sessionId}_animation.gif`,
            path: gifPath,
            contentType: "image/gif",
          });
        }

        // Attach original individual photos from the 'originals' folder
        const originalsDir = path.join(sessionDir, "originals");
        const originalsExists = await fs.access(originalsDir).then(() => true).catch(() => false);
        if (originalsExists) {
          const files = await fs.readdir(originalsDir);
          for (const file of files) {
            const filePath = path.join(originalsDir, file);
            const ext = path.extname(file).toLowerCase();
            attachments.push({
              filename: `${sessionId}_${file}`,
              path: filePath,
              contentType: ext === ".png" ? "image/png" : "image/jpeg",
            });
          }
        }
      } catch (fsErr) {
        console.warn("[send-email] Could not read session files from disk:", fsErr);
        // Continue without attachments rather than failing completely
      }
    }

    if (attachments.length === 0) {
      return NextResponse.json(
        { error: "No photos found to attach. Please ensure the session was saved first." },
        { status: 400 }
      );
    }

    // ── Send email ──────────────────────────────────────────────
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject: `📸 Foto kamu dari Lenzy Photo — ${sessionId}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #3d2a1f;">
          <div style="background: #5a3e31; padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: #f9f6f0; font-size: 2rem; font-weight: 400; margin: 0;">Lenzy Photo</h1>
            <p style="color: rgba(249,246,240,0.7); font-family: sans-serif; font-size: 0.85rem; margin-top: 8px; letter-spacing: 0.15em; text-transform: uppercase;">
              Sesi ${sessionId}
            </p>
          </div>
          <div style="background: #f9f6f0; padding: 36px; border-radius: 0 0 16px 16px;">
            <p style="font-size: 1.1rem; margin-bottom: 16px;">Hei! 👋</p>
            <p style="color: #5a3e31; margin-bottom: 24px;">
              Foto booth kamu sudah siap! Temukan foto dan GIF animasi kamu terlampir di email ini.
            </p>
            <p style="font-size: 0.85rem; color: rgba(90,62,49,0.6); font-family: sans-serif;">
              Terima kasih telah menggunakan Lenzy Photo. ✨
            </p>
          </div>
        </div>
      `,
      attachments,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[send-email] Error:", err);

    // Provide more helpful error messages
    const message = err instanceof Error ? err.message : "Email send failed";
    let userMessage = message;

    if (message.includes("EAUTH") || message.includes("Invalid login")) {
      userMessage = "Autentikasi SMTP gagal. Periksa username dan password di Admin settings. Jika menggunakan Gmail, gunakan App Password.";
    } else if (message.includes("ECONNREFUSED")) {
      userMessage = "Tidak bisa terhubung ke SMTP server. Periksa host dan port.";
    } else if (message.includes("ETIMEDOUT")) {
      userMessage = "Koneksi ke SMTP server timeout. Periksa koneksi internet dan firewall.";
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}
