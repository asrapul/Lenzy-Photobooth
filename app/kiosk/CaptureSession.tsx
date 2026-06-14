"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import CountdownTimer from "@/components/CountdownTimer";

type CaptureState = "idle" | "countdown" | "flash" | "done";

export default function CaptureSession() {
  const { session, addPhoto, replacePhoto, setKioskPage, adminConfig } = usePhotoboothStore();
  const frame = session.selectedFrame;
  const slotCount = frame?.slotCount ?? 1;

  const webcamRef = useRef<Webcam>(null);

  // Which slot we're currently shooting (0-indexed)
  const [currentSlot, setCurrentSlot] = useState<number>(() => {
    const existing = session.photos.length;
    return existing < slotCount ? existing : 0;
  });
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>(() =>
    session.photos.map((p) => p.dataUrl)
  );
  const [allDone, setAllDone] = useState(false);

  // ── Electron / DSLR mode detection ───────────────────────────────────────
  const [isDslrMode, setIsDslrMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [dslrError, setDslrError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI?.isElectron && adminConfig.cameraId === "dslr") {
      setIsDslrMode(true);
    } else {
      setIsDslrMode(false);
    }
  }, [adminConfig.cameraId]);



  // Start countdown for current slot after a short ready delay
  useEffect(() => {
    if (allDone) return;
    const readyTimer = setTimeout(() => {
      setCaptureState("countdown");
    }, 1200);
    return () => clearTimeout(readyTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlot]);

  const handleCapture = useCallback(async () => {
    if (isCapturing) return; // prevent double-trigger
    setDslrError(null);

    // ── DSLR Mode (Electron + digiCamControl) ────────────────────────────
    if (isDslrMode && window.electronAPI?.captureFromDSLR) {
      setIsCapturing(true);
      setCaptureState("flash");

      try {
        const result = await window.electronAPI.captureFromDSLR();

        if (!result.success || !result.dataUrl) {
          setDslrError(result.error || "Gagal mengambil foto dari DSLR.");
          setCaptureState("countdown"); // go back so user can retry
          setIsCapturing(false);
          return;
        }

        const screenshot = result.dataUrl;
        setTimeout(() => {
          const updated = [...capturedPhotos];
          updated[currentSlot] = screenshot;
          setCapturedPhotos(updated);

          if (currentSlot < session.photos.length) {
            replacePhoto(currentSlot, screenshot);
          } else {
            addPhoto({ slotIndex: currentSlot, dataUrl: screenshot });
          }

          setTimeout(() => {
            if (currentSlot + 1 < slotCount) {
              setCaptureState("idle");
              setCurrentSlot((s) => s + 1);
            } else {
              setAllDone(true);
              setTimeout(() => setKioskPage(4), 1000);
            }
            setIsCapturing(false);
          }, 400);
        }, 300);
      } catch (err) {
        setDslrError("Koneksi ke DSLR gagal. Periksa kabel USB.");
        setCaptureState("countdown");
        setIsCapturing(false);
      }
      return;
    }

    // ── Browser Fallback (Webcam screenshot) ─────────────────────────────
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) return;

    setCaptureState("flash");

    setTimeout(() => {
      const updated = [...capturedPhotos];
      updated[currentSlot] = screenshot;
      setCapturedPhotos(updated);

      if (currentSlot < session.photos.length) {
        replacePhoto(currentSlot, screenshot);
      } else {
        addPhoto({ slotIndex: currentSlot, dataUrl: screenshot });
      }

      setTimeout(() => {
        if (currentSlot + 1 < slotCount) {
          setCaptureState("idle");
          setCurrentSlot((s) => s + 1);
        } else {
          setAllDone(true);
          setTimeout(() => setKioskPage(4), 1000);
        }
      }, 400);
    }, 300);
  }, [isDslrMode, isCapturing, webcamRef, capturedPhotos, currentSlot, session.photos.length, replacePhoto, addPhoto, slotCount, setKioskPage]);

  const isDslrSelected = adminConfig.cameraId === "dslr";
  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    deviceId: (adminConfig.cameraId && !isDslrSelected) ? { exact: adminConfig.cameraId } : undefined,
    facingMode: (adminConfig.cameraId && !isDslrSelected) ? undefined : "user",
  };

  return (
    <div
      id="capture-session"
      className="h-full w-full relative overflow-hidden"
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      {/* ── Full-screen webcam background ─────────────────────────── */}
      <Webcam
        key={adminConfig.cameraId || "default"}
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/png"
        videoConstraints={videoConstraints}
        mirrored={true}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: "block" }}
      />

      {/* ── Dark gradient overlays for readability ─────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* ── Flash overlay ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "white",
          opacity: captureState === "flash" ? 0.9 : 0,
          transition: "opacity 0.12s ease",
          zIndex: 20,
        }}
      />

      {/* ── All done overlay ──────────────────────────────────────── */}
      {allDone && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30"
          style={{ background: "rgba(30,16,8,0.75)", backdropFilter: "blur(8px)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-cream/20 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#e6e0d4">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <p className="font-serif text-2xl text-offwhite">Semua foto selesai!</p>
            <p className="font-sans text-sm text-offwhite/60">Memproses foto kamu...</p>
          </div>
        </div>
      )}

      {/* ── Top bar: step label ───────────────────────────────────── */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 rounded-full px-5 py-2.5 bg-black/30 backdrop-blur-xl border border-white/15">
          <span className="font-sans text-xs text-offwhite/70 tracking-widest uppercase">
            Langkah 2 dari 4
          </span>
          <span className="w-px h-3 bg-white/20" />
          <span className="font-sans text-xs text-offwhite/90 tracking-widest uppercase">
            Foto {currentSlot + 1} dari {slotCount}
          </span>
        </div>
      </div>

      {/* ── Bottom: Camera shutter button ─────────────────────────── */}
      {captureState === "countdown" && !allDone && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4">
          {/* iOS-style shutter ring + button */}
          <button
            id="manual-capture-btn"
            onClick={handleCapture}
            className="relative flex items-center justify-center rounded-full transition-all duration-150 active:scale-95"
            style={{
              width: 88,
              height: 88,
              background: "rgba(255,255,255,0.15)",
              border: "3px solid rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 0 0 4px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.4)",
            }}
            aria-label="Ambil foto sekarang"
          >
            {/* Inner white fill disc */}
            <div
              className="rounded-full transition-all duration-150"
              style={{ width: 68, height: 68, background: "rgba(255,255,255,0.92)" }}
            />
            {/* Camera SVG icon centered */}
            <svg
              className="absolute"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="#3d2a1f"
            >
              <path d="M12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4z" />
              <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
            </svg>
          </button>
          <p className="font-sans text-xs text-white/60 tracking-widest uppercase">
            Ketuk untuk ambil foto
          </p>
        </div>
      )}

      {/* ── DSLR Error toast ───────────────────────────────────────────── */}
      {dslrError && (
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: "slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
        >
          <div className="flex items-center gap-3 rounded-full px-6 py-3.5 bg-red-900/90 backdrop-blur-md border border-red-400/30 shadow-2xl text-red-100 font-sans text-xs font-semibold tracking-wide max-w-sm text-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{dslrError}</span>
          </div>
        </div>
      )}

      {/* ── Right sidebar overlay ──────────────────────────────────────── */}
      <div
        className="absolute right-8 top-8 bottom-8 z-10 flex flex-col gap-5 rounded-[28px] p-6"
        style={{
          width: 220,
          background: "rgba(20,10,4,0.55)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* DSLR Mode Badge */}
        {isDslrMode ? (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-sans text-[10px] font-semibold text-green-300 tracking-wide">DSLR MODE</span>
              <span className="font-sans text-[9px] text-green-400/60">Nikon via USB</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(230,224,212,0.35)">
              <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
            </svg>
            <span className="font-sans text-[10px] text-offwhite/40">Mode Webcam</span>
          </div>
        )}



        {/* Countdown or idle state */}
        <div className="flex flex-col items-center gap-3">
          {captureState === "countdown" && !allDone && (
            <>
              <p className="font-sans text-[10px] text-offwhite/40 tracking-widest uppercase">
                Berpose dalam...
              </p>
              <CountdownTimer
                key={currentSlot}
                seconds={10}
                onComplete={handleCapture}
                size={120}
              />
            </>
          )}
          {captureState === "idle" && (
            <div className="flex flex-col items-center gap-2 py-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="rgba(230,224,212,0.5)"
                  className="animate-pulse"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                  <path d="M12 6c-.55 0-1 .45-1 1v5c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1zm0 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
              </div>
              <p className="font-sans text-xs text-offwhite/40 text-center">Bersiap...</p>
            </div>
          )}
          {captureState === "flash" && (
            <div className="flex flex-col items-center gap-2 py-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#f5c27a">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
              <p className="font-sans text-xs text-[#f5c27a]">Klik!</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Shot thumbnails */}
        <div className="flex flex-col gap-1.5 flex-1">
          <p className="font-sans text-[10px] text-offwhite/30 tracking-widest uppercase text-center mb-1">
            Foto yang diambil
          </p>
          <div className="flex flex-col gap-2 flex-1">
            {Array.from({ length: slotCount }).map((_, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden flex-1"
                style={{
                  minHeight: 0,
                  aspectRatio: "16/9",
                  background: "rgba(255,255,255,0.05)",
                  border:
                    i === currentSlot && !allDone
                      ? "2px solid rgba(230,224,212,0.7)"
                      : "1px solid rgba(255,255,255,0.08)",
                  transition: "border 0.3s ease",
                  boxShadow:
                    i === currentSlot && !allDone
                      ? "0 0 12px rgba(230,224,212,0.2)"
                      : "none",
                }}
              >
                {capturedPhotos[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capturedPhotos[i]}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span
                      className="font-sans text-xs"
                      style={{
                        color:
                          i === currentSlot && !allDone
                            ? "rgba(230,224,212,0.8)"
                            : "rgba(255,255,255,0.2)",
                        fontSize: "10px",
                      }}
                    >
                      {i === currentSlot && !allDone ? "▶ Sekarang" : `Foto ${i + 1}`}
                    </span>
                  </div>
                )}

                {/* Slot number badge */}
                <div
                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                >
                  <span className="font-sans text-[9px] text-white/70">{i + 1}</span>
                </div>

                {/* Done checkmark */}
                {capturedPhotos[i] && (
                  <div
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(90,200,90,0.7)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
