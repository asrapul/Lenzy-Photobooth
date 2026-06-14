"use client";

import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import { useEffect, useRef, useState } from "react";

export default function IdleScreen() {
  const setKioskPage = usePhotoboothStore((s) => s.setKioskPage);
  const [clicked, setClicked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleTap = () => {
    if (clicked) return;
    setClicked(true);
    setTimeout(() => setKioskPage(2), 600);
  };

  return (
    <div
      id="idle-screen"
      onClick={handleTap}
      className="relative h-full w-full flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
    >
      {/* Video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        autoPlay
        playsInline
        aria-hidden="true"
      >
        <source src="/loading_animasi.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(90,62,49,0.55) 0%, rgba(61,42,31,0.8) 100%)",
        }}
      />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center gap-8 transition-all duration-500 ease-out ${
          clicked ? "opacity-0 scale-105" : "opacity-100 scale-100"
        }`}
      >
        {/* Logo / title */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-20 h-px"
            style={{ background: "rgba(230,224,212,0.4)" }}
          />
          <h1
            className="font-serif text-center text-offwhite"
            style={{
              fontSize: "clamp(3rem, 8vw, 7rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 400,
              textShadow: "0 4px 40px rgba(0,0,0,0.4)",
            }}
          >
            Lenzy
            <br />
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>Photo</span>
          </h1>
          <div
            className="w-20 h-px"
            style={{ background: "rgba(230,224,212,0.4)" }}
          />
        </div>

        {/* Tap prompt */}
        <div className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/20 rounded-full px-10 py-4 active:scale-[0.97] active:opacity-80 transition-all duration-200 ease-out">
          <span
            className="font-sans text-offwhite/90 tracking-widest uppercase"
            style={{ fontSize: "clamp(0.75rem, 2vw, 1rem)", letterSpacing: "0.3em" }}
          >
            Tap untuk mulai
          </span>
        </div>

        {/* Large decorative text */}
        <p
          className="font-serif text-offwhite/10 absolute"
          style={{
            fontSize: "clamp(8rem, 25vw, 22rem)",
            bottom: "-2rem",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            letterSpacing: "-0.04em",
          }}
          aria-hidden="true"
        >
          
        </p>
      </div>
    </div>
  );
}
