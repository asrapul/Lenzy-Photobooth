"use client";

import { useState } from "react";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";

interface EmailFormProps {
  sessionId: string;
  smtpConfigured: boolean;
  saveDir?: string;
}

export default function EmailForm({ sessionId, smtpConfigured, saveDir }: EmailFormProps) {
  const { adminConfig } = usePhotoboothStore();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      setErrorMsg("Masukkan email yang valid.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          sessionId,
          saveDir,
          smtpConfig: adminConfig.smtp,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengirim email.");
      }

      setStatus("sent");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  /* ── Not configured ───────────────────────────────────────────────────── */
  if (!smtpConfigured) {
    return (
      <p
        className="font-sans text-xs italic text-center w-full"
        style={{ color: "rgba(230,224,212,0.35)" }}
      >
        Email tidak dikonfigurasi oleh admin.
      </p>
    );
  }

  /* ── Success state ────────────────────────────────────────────────────── */
  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 w-full">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: "rgba(230,224,212,0.15)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#e6e0d4">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
        <div className="text-center">
          <p
            className="font-sans text-sm font-semibold"
            style={{ color: "#e6e0d4" }}
          >
            Email terkirim!
          </p>
          <p
            className="font-sans text-xs mt-0.5"
            style={{ color: "rgba(230,224,212,0.45)" }}
          >
            Cek inbox kamu sebentar lagi
          </p>
        </div>
      </div>
    );
  }

  /* ── Idle / sending / error ───────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Input */}
      <input
        id="email-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@kamu.com"
        disabled={status === "sending"}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        className="font-sans text-sm transition-all duration-200 focus:outline-none disabled:opacity-50"
        style={{
          width: "100%",
          borderRadius: "0.75rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.625rem",
          paddingBottom: "0.625rem",
          background: "rgba(255,255,255,0.08)",
          border: "1.5px solid rgba(230,224,212,0.2)",
          color: "#f9f6f0",
        }}
      />

      {/* Send button */}
      <button
        id="send-email-btn"
        onClick={handleSend}
        disabled={status === "sending"}
        className="font-sans text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        style={{
          borderRadius: "0.75rem",
          paddingLeft: "1.25rem",
          paddingRight: "1.25rem",
          paddingTop: "0.625rem",
          paddingBottom: "0.625rem",
          background: "#e6e0d4",
          color: "#3d2a1f",
          border: "none",
        }}
      >
        {status === "sending" ? (
          <>
            <svg
              className="animate-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3d2a1f"
              strokeWidth="2.5"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
            Mengirim…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            Kirim Email
          </>
        )}
      </button>

      {/* Error message */}
      {errorMsg && (
        <p
          className="font-sans text-xs px-1"
          style={{ color: "#f87171" }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  );
}
