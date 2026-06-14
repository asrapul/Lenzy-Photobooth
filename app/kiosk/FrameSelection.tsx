// FILE: d:\Coding\asrapgabut\lenzy-photo\app\kiosk\FrameSelection.tsx
"use client";

import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import FrameCard from "@/components/FrameCard";
import { useState } from "react";

/** Step progress bar — 4 dots, step 1 highlighted */
function StepProgressBar({ currentStep = 1, totalSteps = 4 }: { currentStep?: number; totalSteps?: number }) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isPast = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            {/* Segment */}
            <div
              style={{
                width: isActive ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: isActive
                  ? "#e6e0d4"
                  : isPast
                  ? "rgba(230,224,212,0.45)"
                  : "rgba(230,224,212,0.2)",
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
            {/* Connector line between segments */}
            {step < totalSteps && (
              <div
                style={{
                  width: 16,
                  height: 1,
                  background: isPast
                    ? "rgba(230,224,212,0.35)"
                    : "rgba(230,224,212,0.15)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FrameSelection() {
  const { adminConfig, selectFrame, setKioskPage } = usePhotoboothStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (frame: (typeof adminConfig.frames)[0]) => {
    setSelectedId(frame.id);
    selectFrame(frame);
    setTimeout(() => setKioskPage(3), 700);
  };

  return (
    <div
      id="frame-selection"
      className="h-full w-full flex flex-col"
      style={{ background: "linear-gradient(160deg, #3d2a1f 0%, #5a3e31 100%)" }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-10 py-5"
        style={{ borderBottom: "1px solid rgba(230,224,212,0.1)" }}
      >
        {/* Back button */}
        <button
          id="frame-back-btn"
          onClick={() => setKioskPage(1)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-sans text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
          style={{
            background: "rgba(230,224,212,0.1)",
            color: "rgba(230,224,212,0.75)",
            border: "1px solid rgba(230,224,212,0.15)",
          }}
          aria-label="Kembali ke halaman awal"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Kembali
        </button>

        {/* Centre: step label + title + subtitle */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="font-sans text-xs font-medium tracking-widest uppercase"
            style={{ color: "rgba(230,224,212,0.45)" }}
          >
            Langkah 1 dari 4
          </span>
          <h1
            className="font-serif text-center"
            style={{
              color: "#f9f6f0",
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          >
            Pilih Bingkai
          </h1>
          <p className="font-sans text-xs text-center" style={{ color: "rgba(230,224,212,0.5)" }}>
            Pilih bingkai favorit untuk foto kamu, lalu sesi pemotretan akan dimulai.
          </p>
        </div>

        {/* Right spacer — mirrors back button width */}
        <div className="w-32" />
      </div>

      {/* ── Step Progress Bar ─────────────────────────────────────────────── */}
      <div className="flex justify-center pt-4 pb-1">
        <StepProgressBar currentStep={1} totalSteps={4} />
      </div>

      {/* ── Frame grid ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-10 pb-8 pt-2 overflow-auto">
        {adminConfig.frames.length === 0 ? (
          <div
            className="flex flex-col items-center gap-5 rounded-2xl p-14 text-center"
            style={{
              background: "rgba(20,10,5,0.5)",
              border: "1px solid rgba(230,224,212,0.14)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              maxWidth: 400,
              width: "100%",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(230,224,212,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(230,224,212,0.4)">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
            <div>
              <p className="font-sans text-sm font-medium mb-1.5" style={{ color: "rgba(230,224,212,0.75)" }}>
                Tidak ada bingkai tersedia
              </p>
              <p className="font-sans text-xs" style={{ color: "rgba(230,224,212,0.4)" }}>
                Hubungi admin untuk menambahkan bingkai.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-wrap gap-8 justify-center items-center"
            role="listbox"
            aria-label="Frame selection"
          >
            {adminConfig.frames.map((frame) => (
              <div key={frame.id} role="option" aria-selected={selectedId === frame.id}>
                <FrameCard
                  frame={frame}
                  selected={selectedId === frame.id}
                  onSelect={handleSelect}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
