"use client";

import { useEffect, useRef, useState } from "react";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import EmailForm from "@/components/EmailForm";

export default function ExportShare() {
  const { session, adminConfig, finishSession } = usePhotoboothStore();
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  /* ── QR download URL ─────────────────────────────────────────────────── */
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || "https://lenzy-photobooth-delta.vercel.app";
    setDownloadUrl(`${baseUrl}/gallery/${session.sessionId}`);
  }, [session.sessionId]);

  /* ── Print ────────────────────────────────────────────────────────────── */
  const handlePrint = () => {
    const imageUrl = session.framedPhotoDataUrl;
    if (!imageUrl) return;

    if (printIframeRef.current) document.body.removeChild(printIframeRef.current);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top      = "-10000px";
    iframe.style.left     = "-10000px";
    iframe.style.width    = "1px";
    iframe.style.height   = "1px";
    iframe.style.border   = "none";
    document.body.appendChild(iframe);
    printIframeRef.current = iframe;

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html><html>
      <head><title>Print Photo — ${session.sessionId}</title>
      <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; align-items: center; justify-content: center;
               width: 100vw; height: 100vh; background: #fff; }
        img { max-width: 100%; max-height: 100%; object-fit: contain; }
      </style></head>
      <body><img src="${imageUrl}" alt="Lenzy Photo" onload="window.print();" /></body>
    </html>`);
    iframeDoc.close();
  };

  const handleFinish = () => { setIsSaving(true); finishSession(); };

  const gifReady = !!session.gifBlobUrl;

  return (
    <div
      id="export-share"
      className="h-full w-full flex flex-col"
      style={{ background: "linear-gradient(160deg, #3d2a1f 0%, #5a3e31 100%)" }}
    >
      {/* ══ TOP BAR ═══════════════════════════════════════════════════════ */}
      <div
        className="flex items-center justify-center px-8 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(230,224,212,0.1)" }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="font-sans text-xs font-medium tracking-widest uppercase"
            style={{ color: "rgba(230,224,212,0.4)" }}
          >
            Langkah 4 dari 4
          </span>
          <h1
            className="font-serif text-center"
            style={{
              color: "#f9f6f0",
              fontSize: "clamp(1.4rem, 2.8vw, 2rem)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          >
            Kirim &amp; Selesai
          </h1>
          <p
            className="font-sans text-xs"
            style={{ color: "rgba(230,224,212,0.4)" }}
          >
            Download, cetak, atau kirim foto kamu
          </p>
        </div>
      </div>

      {/* ══ PROGRESS BAR ══════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex gap-1.5 px-8 pt-3 pb-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="flex-1 rounded-full"
            style={{
              height: 3,
              background: "#e6e0d4",
              opacity: 1,
            }}
          />
        ))}
      </div>

      {/* ══ MAIN CONTENT ══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex gap-5 px-8 py-5">

        {/* ── Column 1: GIF Preview ──────────────────────────────────── */}
        <div
          className="flex-1 flex flex-col rounded-2xl p-5 gap-4"
          style={{
            background: "rgba(20,10,5,0.5)",
            border: "1px solid rgba(230,224,212,0.1)",
          }}
        >
          {/* Label */}
          <div>
            <p
              className="font-sans text-sm font-semibold"
              style={{ color: "rgba(230,224,212,0.85)" }}
            >
              GIF Animasi
            </p>
            <p
              className="font-sans text-xs mt-0.5"
              style={{ color: "rgba(230,224,212,0.4)" }}
            >
              Preview animasi foto kamu
            </p>
          </div>

          {/* GIF preview — fills remaining space */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            {gifReady ? (
              <div
                className="rounded-xl overflow-hidden w-full h-full flex items-center justify-center"
                style={{
                  border: "1px solid rgba(230,224,212,0.12)",
                  boxShadow: "0 12px 36px rgba(0,0,0,0.45)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={session.gifBlobUrl!}
                  alt="GIF animasi foto"
                  className="object-contain"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              </div>
            ) : (
              <div
                className="rounded-xl flex flex-col items-center justify-center gap-3 w-full h-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px dashed rgba(230,224,212,0.12)",
                  minHeight: 120,
                }}
              >
                <svg
                  className="animate-spin"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(230,224,212,0.35)"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                </svg>
                <p
                  className="font-sans text-xs"
                  style={{ color: "rgba(230,224,212,0.3)" }}
                >
                  GIF sedang disiapkan…
                </p>
              </div>
            )}
          </div>

          {/* Print button */}
          <button
            id="print-btn"
            onClick={handlePrint}
            disabled={!session.framedPhotoDataUrl}
            className="w-full rounded-xl py-3 font-sans text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              background: "rgba(230,224,212,0.08)",
              color: "rgba(230,224,212,0.75)",
              border: "1px solid rgba(230,224,212,0.18)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
            Print Foto
          </button>
        </div>

        {/* ── Column 2: QR Code ──────────────────────────────────────── */}
        <div
          className="flex flex-col items-center rounded-2xl p-5 gap-4"
          style={{
            width: 224,
            background: "rgba(20,10,5,0.5)",
            border: "1px solid rgba(230,224,212,0.1)",
          }}
        >
          {/* Label */}
          <div className="w-full">
            <p
              className="font-sans text-sm font-semibold"
              style={{ color: "rgba(230,224,212,0.85)" }}
            >
              Download via QR
            </p>
            <p
              className="font-sans text-xs mt-0.5"
              style={{ color: "rgba(230,224,212,0.4)" }}
            >
              Scan dengan kamera HP
            </p>
          </div>

          {/* White QR card — centered and anchored */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className="rounded-xl p-4 flex flex-col items-center gap-2"
              style={{
                background: "#ffffff",
                boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
              }}
            >
              <QRCodeDisplay
                value={downloadUrl || "loading..."}
                size={140}
                label=""
              />
            </div>
          </div>

          {/* Instruction */}
          <p
            className="font-sans text-xs text-center leading-relaxed w-full"
            style={{ color: "rgba(230,224,212,0.4)" }}
          >
            Sambungkan HP ke WiFi yang sama lalu scan untuk download
          </p>
        </div>

        {/* ── Column 3: Email ────────────────────────────────────────── */}
        <div
          className="flex flex-col rounded-2xl p-5 gap-4"
          style={{
            width: 288,
            background: "rgba(20,10,5,0.5)",
            border: "1px solid rgba(230,224,212,0.1)",
          }}
        >
          {/* Label */}
          <div>
            <p
              className="font-sans text-sm font-semibold"
              style={{ color: "rgba(230,224,212,0.85)" }}
            >
              Kirim via Email
            </p>
            <p
              className="font-sans text-xs mt-0.5"
              style={{ color: "rgba(230,224,212,0.4)" }}
            >
              Terima foto langsung di inbox kamu
            </p>
          </div>

          {/* Email form fills space */}
          <div className="flex-1 flex items-start">
            <EmailForm
              sessionId={session.sessionId}
              smtpConfigured={!!adminConfig.smtp.user && !!adminConfig.smtp.password}
              saveDir={adminConfig.saveDirectory}
            />
          </div>

          {/* Session ID badge */}
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              className="font-sans text-xs"
              style={{ color: "rgba(230,224,212,0.35)" }}
            >
              ID Sesi:{" "}
              <span
                className="font-medium"
                style={{ color: "rgba(230,224,212,0.6)" }}
              >
                {session.sessionId}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ══ BOTTOM BAR ════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 px-8 py-4 flex items-center justify-between"
        style={{
          borderTop: "1px solid rgba(230,224,212,0.1)",
          background: "rgba(20,10,5,0.4)",
        }}
      >
        {/* Session ID pill */}
        <div
          className="rounded-full px-4 py-2 font-sans text-xs"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(230,224,212,0.1)",
            color: "rgba(230,224,212,0.45)",
          }}
        >
          Sesi:{" "}
          <span style={{ color: "rgba(230,224,212,0.7)", fontWeight: 500 }}>
            {session.sessionId}
          </span>
        </div>

        {/* Selesai button */}
        <button
          id="selesai-btn"
          onClick={handleFinish}
          disabled={isSaving}
          className="flex items-center gap-2.5 rounded-xl px-8 py-3 font-sans text-sm font-semibold tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ background: "#e6e0d4", color: "#3d2a1f" }}
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3d2a1f"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
              Menyimpan sesi…
            </>
          ) : (
            <>
              Selesai
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
