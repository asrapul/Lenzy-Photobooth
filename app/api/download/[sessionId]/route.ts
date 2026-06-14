import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as archiver from "archiver";
import { PassThrough } from "stream";

// The client passes saveDir as a query param so the server knows
// where the session folder lives on disk.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(req.url);
    const saveDir = searchParams.get("dir");

    if (!saveDir || !sessionId) {
      return NextResponse.json({ error: "Missing dir or sessionId" }, { status: 400 });
    }

    const sessionDir = path.join(saveDir, sessionId);

    // Check directory exists
    if (!fs.existsSync(sessionDir)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Accumulate zip archive in memory to avoid stream instability in Next.js Response
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      // Instantiating ZipArchive class directly to resolve CJS module ESM interop safely
      const archive = new archiver.ZipArchive({ zlib: { level: 6 } });
      const passThrough = new PassThrough();
      const chunks: Buffer[] = [];

      passThrough.on("data", (chunk: Buffer) => chunks.push(chunk));
      passThrough.on("end", () => resolve(Buffer.concat(chunks)));
      passThrough.on("error", (err: any) => reject(err));

      archive.on("error", (err: any) => reject(err));
      archive.pipe(passThrough);

      // Add all contents of the session directory into the zip directly (flat structure)
      archive.directory(sessionDir, false);
      archive.finalize();
    });

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${sessionId}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("[download-api] Error generating zip:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
