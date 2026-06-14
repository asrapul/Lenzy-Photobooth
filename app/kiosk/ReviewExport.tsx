"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import FilterSelector from "@/components/FilterSelector";
import { compositeFrame } from "@/lib/frameCompositor";
import { generateGif } from "@/lib/gifEncoder";

/* ─── CSS filter lookup ─────────────────────────────────────────────────── */
const CSS_FILTER_MAP: Record<string, string> = {
  normal: "none",
  grayscale: "grayscale(100%)",
  sepia: "sepia(80%)",
};

type ProcessStatus = "compositing" | "gifgen" | "saving" | "done" | "error";

/* ─── small helper: step label ─────────────────────────────────────────── */
function StatusLabel({ status }: { status: ProcessStatus }) {
  const map: Record<ProcessStatus, { text: string; color: string }> = {
    compositing: { text: "Menggabungkan foto…", color: "rgba(230,224,212,0.5)" },
    gifgen:      { text: "Membuat GIF animasi…", color: "rgba(230,224,212,0.5)" },
    saving:      { text: "Menyimpan ke perangkat…", color: "rgba(230,224,212,0.5)" },
    done:        { text: "✓  Siap dikirim!", color: "#86efac" },
    error:       { text: "Terjadi kesalahan", color: "#fca5a5" },
  };
  const { text, color } = map[status];
  return (
    <span className="font-sans text-xs font-medium" style={{ color }}>
      {status !== "done" && status !== "error" && (
        <svg
          className="inline-block animate-spin mr-1.5"
          width="11" height="11" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
        </svg>
      )}
      {text}
    </span>
  );
}

export default function ReviewExport() {
  const {
    session,
    adminConfig,
    setActiveFilter,
    setFramedPhoto,
    setGif,
    setKioskPage,
    finishSession,
  } = usePhotoboothStore();

  const frame  = session.selectedFrame!;
  const photos = session.photos
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map((p) => p.dataUrl);

  const [processStatus,    setProcessStatus]    = useState<ProcessStatus>("compositing");
  const [errorMsg,         setErrorMsg]         = useState("");
  const [bakedFilter,      setBakedFilter]      = useState<"normal" | "grayscale" | "sepia">("normal");
  const [isUpdatingFilter, setIsUpdatingFilter] = useState(false);
  const hasProcessed = useRef(false);

  /* ── Initial composite + GIF (runs once on mount) ──────────────────── */
  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    (async () => {
      try {
        const framedDataUrl = await compositeFrame(photos, frame, session.activeFilter);
        setFramedPhoto(framedDataUrl);
        setBakedFilter(session.activeFilter);

        setProcessStatus("gifgen");

        const { blobUrl, dataUrl } = await generateGif(photos, {
          delay: 600, width: 480, height: 320,
          filter: session.activeFilter,
        });
        setGif(dataUrl, blobUrl);

        setProcessStatus("saving");

        if (adminConfig.saveDirectory) {
          const res = await fetch("/api/save-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId:  session.sessionId,
              saveDir:    adminConfig.saveDirectory,
              photos,
              framedPhoto: framedDataUrl,
              gif: dataUrl,
            }),
          });
          if (!res.ok) throw new Error("Save failed");
        }

        setProcessStatus("done");
      } catch (err) {
        console.error(err);
        setErrorMsg(String(err));
        setProcessStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-composite when filter changes (debounced) ──────────────────── */
  const filterChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleFilterChange = useCallback(
    async (filter: "normal" | "grayscale" | "sepia") => {
      setActiveFilter(filter);
      if (filterChangeTimeout.current) clearTimeout(filterChangeTimeout.current);
      setIsUpdatingFilter(true);

      filterChangeTimeout.current = setTimeout(async () => {
        try {
          const framedDataUrl = await compositeFrame(photos, frame, filter);
          setFramedPhoto(framedDataUrl);
          setBakedFilter(filter);

          const { blobUrl, dataUrl } = await generateGif(photos, {
            delay: 600, width: 480, height: 320, filter,
          });
          setGif(dataUrl, blobUrl);

          if (adminConfig.saveDirectory) {
            await fetch("/api/save-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId:  session.sessionId,
                saveDir:    adminConfig.saveDirectory,
                photos,
                framedPhoto: framedDataUrl,
                gif: dataUrl,
              }),
            });
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsUpdatingFilter(false);
        }
      }, 300);
    },
    [photos, frame, session.sessionId, adminConfig.saveDirectory, setActiveFilter, setFramedPhoto, setGif]
  );

  /* ── Retake a specific slot ─────────────────────────────────────────── */
  const handleRetake = (slotIndex: number) => {
    usePhotoboothStore.setState((s) => ({
      session: {
        ...s.session,
        photos:           s.session.photos.filter((p) => p.slotIndex !== slotIndex),
        framedPhotoDataUrl: null,
        gifDataUrl:       null,
        gifBlobUrl:       null,
      },
    }));
    hasProcessed.current = false;
    setKioskPage(3);
  };

  const handleBatal = () => finishSession();
  const handleNext  = () => setKioskPage(5);

  const isProcessing = processStatus !== "done" && processStatus !== "error";
  const canAdvance   = !isProcessing && !isUpdatingFilter && processStatus !== "error";

  return (
    <div
      id="review-export"
      className="h-full w-full flex flex-col relative"
      style={{ background: "linear-gradient(160deg, #3d2a1f 0%, #5a3e31 100%)" }}
    >
      {/* ══ LOADING OVERLAY (initial composite only) ══════════════════════ */}
      {isProcessing && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5"
          style={{ background: "rgba(30,16,8,0.82)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(230,224,212,0.08)", border: "1px solid rgba(230,224,212,0.15)" }}
          >
            <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e6e0d4" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-serif text-xl" style={{ color: "#f9f6f0" }}>Memproses foto…</p>
            <p className="font-sans text-sm mt-1" style={{ color: "rgba(230,224,212,0.45)" }}>
              {processStatus === "compositing"
                ? "Menggabungkan foto dengan bingkai…"
                : processStatus === "gifgen"
                ? "Membuat GIF animasi…"
                : "Menyimpan ke perangkat…"}
            </p>
          </div>
        </div>
      )}

      {/* ══ ERROR OVERLAY ═════════════════════════════════════════════════ */}
      {processStatus === "error" && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5"
          style={{ background: "rgba(30,16,8,0.9)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#f87171">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-serif text-xl text-red-300 mb-1">Terjadi kesalahan</p>
            <p className="font-sans text-sm max-w-xs" style={{ color: "rgba(230,224,212,0.45)" }}>{errorMsg}</p>
          </div>
          <button
            id="error-retry-btn"
            onClick={() => { hasProcessed.current = false; setProcessStatus("compositing"); }}
            className="rounded-xl py-3 px-7 font-sans text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
            style={{ background: "#e6e0d4", color: "#5a3e31" }}
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ══ TOP BAR ═══════════════════════════════════════════════════════ */}
      <div
        className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(230,224,212,0.1)" }}
      >
        {/* Batal */}
        <button
          id="review-batal-btn"
          onClick={handleBatal}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-sans text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
          style={{
            background: "rgba(230,224,212,0.08)",
            color: "rgba(230,224,212,0.65)",
            border: "1px solid rgba(230,224,212,0.12)",
          }}
          aria-label="Batal dan mulai ulang sesi"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
          Batal
        </button>

        {/* Title + step */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-sans text-xs font-medium tracking-widest uppercase" style={{ color: "rgba(230,224,212,0.4)" }}>
            Langkah 3 dari 4
          </span>
          <h1
            className="font-serif text-center"
            style={{ color: "#f9f6f0", fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", fontWeight: 400, letterSpacing: "-0.01em" }}
          >
            Review &amp; Pilih Filter
          </h1>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(230,224,212,0.1)", minWidth: 140 }}
        >
          <StatusLabel status={processStatus} />
        </div>
      </div>

      {/* ══ PROGRESS BAR ══════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 px-8 pt-3 pb-1 flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: step <= 3
                ? "#e6e0d4"
                : "rgba(230,224,212,0.18)",
            }}
          />
        ))}
      </div>

      {/* ══ MAIN CONTENT ══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex gap-6 px-8 py-5">

        {/* ── LEFT PANEL: Single large photo card ─────────────────────── */}
        <div className="flex-1 flex flex-col">
          <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center p-5"
            style={{
              background: "rgba(20,10,5,0.5)",
              border: "1px solid rgba(230,224,212,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <p className="font-sans text-xs font-medium tracking-widest uppercase mb-4" style={{ color: "rgba(230,224,212,0.35)" }}>
              Hasil Foto
            </p>

            {session.framedPhotoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.framedPhotoDataUrl}
                alt="Hasil foto dengan bingkai"
                className="object-contain rounded-xl"
                style={{
                  maxHeight: "62vh",
                  maxWidth: "100%",
                  filter:
                    session.activeFilter !== bakedFilter
                      ? CSS_FILTER_MAP[session.activeFilter]
                      : "none",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                  transition: "filter 0.2s ease",
                }}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ width: 320, height: 240 }}>
                <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(230,224,212,0.4)", borderTopColor: "transparent" }} />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: w-72, filter card + thumbnails card ──────── */}
        <div className="flex flex-col gap-4" style={{ width: 288 }}>

          {/* Filter selector card */}
          <div
            className="rounded-2xl p-4 flex-shrink-0"
            style={{
              background: "rgba(20,10,5,0.5)",
              border: "1px solid rgba(230,224,212,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-sans text-sm font-semibold" style={{ color: "rgba(230,224,212,0.85)" }}>
                Pilih Filter
              </p>
              {isUpdatingFilter && (
                <span className="font-sans text-xs flex items-center gap-1.5" style={{ color: "rgba(230,224,212,0.5)" }}>
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Memperbarui…
                </span>
              )}
            </div>
            <FilterSelector active={session.activeFilter} onChange={handleFilterChange} />
          </div>

          {/* Thumbnails card — flex-1 so it fills remaining sidebar height */}
          <div
            className="rounded-2xl p-4 flex-1 overflow-hidden flex flex-col"
            style={{
              background: "rgba(20,10,5,0.5)",
              border: "1px solid rgba(230,224,212,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            <div className="mb-3 flex-shrink-0">
              <p className="font-sans text-sm font-semibold" style={{ color: "rgba(230,224,212,0.85)" }}>
                Foto Individual
              </p>
              <p className="font-sans text-xs mt-0.5" style={{ color: "rgba(230,224,212,0.4)" }}>
                Ketuk untuk mengulang
              </p>
            </div>

            {/* Thumbnail list — scrollable, fills remaining card height */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  id={`retake-btn-${i}`}
                  onClick={() => handleRetake(i)}
                  className="relative rounded-xl overflow-hidden focus:outline-none transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] w-full flex-shrink-0"
                  style={{
                    aspectRatio: "16/9",
                    border: "1px solid rgba(230,224,212,0.12)",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
                  }}
                  aria-label={`Ulangi foto ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover"
                    style={{
                      transform: "scaleX(-1)",
                      filter: CSS_FILTER_MAP[session.activeFilter] ?? "none",
                      transition: "filter 0.2s ease",
                    }}
                  />
                  {/* Retake hover overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "rgba(30,16,8,0.72)" }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#e6e0d4">
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                      </svg>
                      <span className="font-sans text-xs font-medium" style={{ color: "#e6e0d4" }}>Ulangi</span>
                    </div>
                  </div>
                  {/* Slot badge */}
                  <div
                    className="absolute top-2 left-2 rounded-lg px-2 py-0.5 font-sans text-[10px] font-medium"
                    style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.9)" }}
                  >
                    Foto {i + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ STICKY BOTTOM BAR ═════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 px-8 py-4 flex items-center justify-end gap-4"
        style={{ borderTop: "1px solid rgba(230,224,212,0.1)", background: "rgba(20,10,5,0.5)" }}
      >
        <button
          id="next-to-export-btn"
          onClick={handleNext}
          disabled={!canAdvance}
          className="flex items-center gap-2.5 rounded-xl px-8 py-3.5 font-sans text-sm font-semibold tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          style={{
            background: canAdvance ? "#e6e0d4" : "rgba(230,224,212,0.5)",
            color: "#3d2a1f",
          }}
        >
          {isUpdatingFilter ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d2a1f" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
              </svg>
              Memperbarui filter…
            </>
          ) : (
            <>
              Lanjut ke Pengiriman
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
