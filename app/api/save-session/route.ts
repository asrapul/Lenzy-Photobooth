import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { dataUrlToBuffer, getExtensionFromDataUrl } from "@/lib/sessionManager";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      saveDir,
      photos,
      framedPhoto,
      gif,
    }: {
      sessionId: string;
      saveDir: string;
      photos: string[];
      framedPhoto: string;
      gif: string;
    } = body;

    if (!sessionId || !saveDir) {
      return NextResponse.json({ error: "Missing sessionId or saveDir" }, { status: 400 });
    }

    // Create session directory: saveDir/CS-1/
    const sessionDir = path.join(saveDir, sessionId);
    const photosDir = path.join(sessionDir, "originals");

    await fs.mkdir(photosDir, { recursive: true });

    // Save individual photos
    const photoPromises = photos.map(async (photoDataUrl, i) => {
      const ext = getExtensionFromDataUrl(photoDataUrl);
      const filename = `photo_${String(i + 1).padStart(2, "0")}.${ext}`;
      const buf = dataUrlToBuffer(photoDataUrl);
      await fs.writeFile(path.join(photosDir, filename), buf);
    });
    await Promise.all(photoPromises);

    // Save framed result
    if (framedPhoto) {
      const ext = getExtensionFromDataUrl(framedPhoto);
      const buf = dataUrlToBuffer(framedPhoto);
      await fs.writeFile(path.join(sessionDir, `framed.${ext}`), buf);
    }

    // Save GIF
    if (gif) {
      const buf = dataUrlToBuffer(gif);
      await fs.writeFile(path.join(sessionDir, "animation.gif"), buf);
    }

    // ── SUPABASE UPLOAD ──────────────────────────────────────────────────
    // We upload asynchronously so it doesn't block the UI for too long, but wait,
    // we should wait for it so the QR code shows up only when upload is done?
    // Actually Vercel deployment needs the files to be there. 
    // Let's await them so we are sure the files are in Supabase.
    
    const uploadPromises: Promise<any>[] = [];

    // Upload originals
    photos.forEach((photoDataUrl, i) => {
      const ext = getExtensionFromDataUrl(photoDataUrl);
      const filename = `${sessionId}/originals/photo_${String(i + 1).padStart(2, "0")}.${ext}`;
      const buf = dataUrlToBuffer(photoDataUrl);
      uploadPromises.push(
        supabase.storage.from("sessions").upload(filename, buf, {
          contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
          upsert: true,
        })
      );
    });

    // Upload framed
    if (framedPhoto) {
      const ext = getExtensionFromDataUrl(framedPhoto);
      const buf = dataUrlToBuffer(framedPhoto);
      uploadPromises.push(
        supabase.storage.from("sessions").upload(`${sessionId}/framed.${ext}`, buf, {
          contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
          upsert: true,
        })
      );
    }

    // Upload GIF
    if (gif) {
      const buf = dataUrlToBuffer(gif);
      uploadPromises.push(
        supabase.storage.from("sessions").upload(`${sessionId}/animation.gif`, buf, {
          contentType: "image/gif",
          upsert: true,
        })
      );
    }

    await Promise.all(uploadPromises);

    return NextResponse.json({ success: true, path: sessionDir });
  } catch (err: unknown) {
    console.error("[save-session] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
