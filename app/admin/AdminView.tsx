"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { usePhotoboothStore, FrameConfig, SlotConfig } from "@/store/usePhotoboothStore";
import FrameCard from "@/components/FrameCard";
import Webcam from "react-webcam";


// Simple UUID without external dep
function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_SLOT_LAYOUTS: Record<number, SlotConfig[]> = {
  1: [{ x: 5, y: 5, width: 90, height: 90 }],
  2: [
    { x: 5, y: 5, width: 90, height: 45 },
    { x: 5, y: 52, width: 90, height: 45 },
  ],
  3: [
    { x: 5, y: 3, width: 90, height: 30 },
    { x: 5, y: 35, width: 90, height: 30 },
    { x: 5, y: 67, width: 90, height: 30 },
  ],
  4: [
    { x: 5, y: 3, width: 43, height: 46 },
    { x: 52, y: 3, width: 43, height: 46 },
    { x: 5, y: 51, width: 43, height: 46 },
    { x: 52, y: 51, width: 43, height: 46 },
  ],
};

export default function AdminView() {
  const {
    adminConfig,
    addFrame,
    removeFrame,
    updateFrame,
    setSaveDirectory,
    setSmtpConfig,
    setCameraId,
    launchKiosk,
    sessionCounter,
  } = usePhotoboothStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"frames" | "directory" | "email" | "camera">("frames");
  const [editingFrame, setEditingFrame] = useState<FrameConfig | null>(null);
  const [launchConfirm, setLaunchConfirm] = useState(false);

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Camera states and auto-connect logic
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [activeDeviceLabel, setActiveDeviceLabel] = useState<string>("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const prevDeviceIds = useRef<string[]>([]);

  const scanDevices = useCallback(async () => {
    if (typeof window === "undefined" || !navigator?.mediaDevices) {
      console.warn("navigator.mediaDevices is not available (secure context required).");
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      
      if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
        const dslrDevice = {
          deviceId: "dslr",
          kind: "videoinput" as MediaDeviceKind,
          label: "📷 Kamera DSLR (Tethering via USB)",
          groupId: "dslr-group",
          toJSON: () => {}
        } as MediaDeviceInfo;
        videoDevices = [dslrDevice, ...videoDevices];
      }
      
      setDevices(videoDevices);

      const currentIds = videoDevices.map((d) => d.deviceId).filter(Boolean);

      // Find if a new device was added
      const newDevice = videoDevices.find(
        (d) => d.deviceId && !prevDeviceIds.current.includes(d.deviceId)
      );

      if (newDevice && prevDeviceIds.current.length > 0) {
        // A camera was plugged in! Auto-select it.
        setActiveDeviceId(newDevice.deviceId);
        setCameraId(newDevice.deviceId);
        setActiveDeviceLabel(newDevice.label || "Kamera Eksternal");
        setToastMessage(`Kamera terdeteksi & terhubung: ${newDevice.label || "Kamera USB"}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else if (!activeDeviceId || !currentIds.includes(activeDeviceId)) {
        // Fallback
        if (videoDevices.length > 0) {
          const external = videoDevices.find((d) => {
            const label = (d.label || "").toLowerCase();
            return (
              (label.includes("usb") ||
                label.includes("cam") ||
                label.includes("eos") ||
                label.includes("logi") ||
                label.includes("nikon") ||
                label.includes("canon") ||
                label.includes("sony") ||
                label.includes("fuji") ||
                label.includes("obs") ||
                label.includes("dcc") ||
                label.includes("virtual")) &&
              !label.includes("integrated") &&
              !label.includes("front") &&
              !label.includes("facetime")
            );
          });
          const preferred = external || videoDevices[videoDevices.length - 1];
          // Prefer stored cameraId if it exists and is still connected
          const finalDeviceId = adminConfig.cameraId && currentIds.includes(adminConfig.cameraId) 
            ? adminConfig.cameraId 
            : preferred.deviceId;
          const finalDevice = videoDevices.find(d => d.deviceId === finalDeviceId) || preferred;
          
          setActiveDeviceId(finalDeviceId);
          setCameraId(finalDeviceId);
          setActiveDeviceLabel(finalDevice.label || "Kamera Default");
        } else {
          setActiveDeviceId(null);
          setCameraId(null);
          setActiveDeviceLabel("");
        }
      }

      prevDeviceIds.current = currentIds;
    } catch (err) {
      console.error("Error scanning camera devices:", err);
    }
  }, [activeDeviceId]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator?.mediaDevices) return;
    scanDevices();
    navigator.mediaDevices.addEventListener("devicechange", scanDevices);
    return () => {
      if (navigator?.mediaDevices) {
        navigator.mediaDevices.removeEventListener("devicechange", scanDevices);
      }
    };
  }, [scanDevices]);

  const handleSlotMouseDown = (
    e: React.MouseEvent,
    index: number,
    action: "drag" | "resize"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSlotIndex(index);

    const container = containerRef.current;
    if (!container || !editingFrame) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const slot = editingFrame.slots[index];
    const initialX = slot.x;
    const initialY = slot.y;
    const initialW = slot.width;
    const initialH = slot.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      if (action === "drag") {
        const nextX = Math.max(0, Math.min(100 - slot.width, initialX + deltaX));
        const nextY = Math.max(0, Math.min(100 - slot.height, initialY + deltaY));
        handleSlotEdit(editingFrame, index, "x", Math.round(nextX * 10) / 10);
        handleSlotEdit(editingFrame, index, "y", Math.round(nextY * 10) / 10);
      } else if (action === "resize") {
        const nextW = Math.max(5, Math.min(100 - slot.x, initialW + deltaX));
        const nextH = Math.max(5, Math.min(100 - slot.y, initialH + deltaY));
        handleSlotEdit(editingFrame, index, "width", Math.round(nextW * 10) / 10);
        handleSlotEdit(editingFrame, index, "height", Math.round(nextH * 10) / 10);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // ── Frame Upload ───────────────────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (!file.type.includes("png")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const newFrame: FrameConfig = {
          id: generateId(),
          name: file.name.replace(".png", ""),
          dataUrl,
          slotCount: 1,
          slots: DEFAULT_SLOT_LAYOUTS[1],
        };
        addFrame(newFrame);
        setEditingFrame(newFrame);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [addFrame]);

  const handleSlotCountChange = (frame: FrameConfig, count: 1 | 2 | 3 | 4) => {
    setSelectedSlotIndex(null);
    const updated = {
      ...frame,
      slotCount: count,
      slots: DEFAULT_SLOT_LAYOUTS[count],
    };
    updateFrame(frame.id, { slotCount: count, slots: DEFAULT_SLOT_LAYOUTS[count] });
    setEditingFrame(updated);
  };

  const handleSlotEdit = (
    frame: FrameConfig,
    slotIndex: number,
    field: keyof SlotConfig,
    value: number
  ) => {
    const newSlots = frame.slots.map((s, i) =>
      i === slotIndex ? { ...s, [field]: value } : s
    );
    updateFrame(frame.id, { slots: newSlots });
    setEditingFrame({ ...frame, slots: newSlots });
  };

  const canLaunch = adminConfig.frames.length > 0;

  // ── Shared card class ──────────────────────────────────────────────────────
  const cardClass = "rounded-2xl border shadow-lg";
  const cardStyle = { background: "rgba(20,10,5,0.52)", borderColor: "rgba(230,224,212,0.11)" };

  return (
    <div
      className="h-full flex flex-col relative"
      style={{ background: "linear-gradient(135deg, #5a3e31 0%, #3d2a1f 100%)" }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>

      {/* ── Toast Notification ─────────────────────────────────────── */}
      {showToast && (
        <div 
          className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          style={{ animation: "slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
        >
          <div className="flex items-center gap-3 rounded-full px-6 py-3.5 bg-black/80 backdrop-blur-md border border-cream/20 shadow-2xl text-cream font-sans text-xs font-semibold tracking-wide">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/8">
        <div>
          <h1 className="font-serif text-2xl text-offwhite tracking-tight">
            Lenzy Photo
          </h1>
          <p className="font-sans text-xs text-offwhite/40 tracking-widest uppercase mt-0.5">
            Admin Panel · Sesi berikutnya: CS-{sessionCounter}
          </p>
        </div>

        <button
          id="launch-kiosk-btn"
          onClick={() => setLaunchConfirm(true)}
          disabled={!canLaunch}
          className="flex items-center gap-2.5 rounded-full px-8 py-4 font-sans text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
          style={{
            background: canLaunch
              ? "linear-gradient(135deg, #e6e0d4 0%, #d4c9b8 100%)"
              : "rgba(230,224,212,0.15)",
            color: "#3d2a1f",
            boxShadow: canLaunch ? "0 8px 24px rgba(0,0,0,0.25)" : "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Launch Kiosk
        </button>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <nav className="flex gap-2 px-8 pt-5 pb-2">
        {(["frames", "directory", "email", "camera"] as const).map((tab) => (
          <button
            key={tab}
            id={`admin-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className="rounded-full px-6 py-3 font-sans text-sm font-medium tracking-wide transition-all duration-200"
            style={{
              background:
                activeTab === tab
                  ? "rgba(230,224,212,0.15)"
                  : "transparent",
              color:
                activeTab === tab
                  ? "#e6e0d4"
                  : "rgba(249,246,240,0.35)",
              border:
                activeTab === tab
                  ? "1px solid rgba(230,224,212,0.25)"
                  : "1px solid transparent",
            }}
          >
            {tab === "frames"
              ? "🖼  Bingkai"
              : tab === "directory"
              ? "📁  Direktori"
              : tab === "email"
              ? "✉  Email"
              : "📷  Kamera"}
          </button>
        ))}
      </nav>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex gap-6 p-8">

        {/* ── TAB: Frames ──────────────────────────────────────────────── */}
        {activeTab === "frames" && (
          <>
            {/* Left: Frame list + upload */}
            <div className={`flex flex-col gap-4 w-72 flex-shrink-0 ${cardClass} p-6`} style={cardStyle}>
              {/* Upload button */}
              <button
                id="upload-frame-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2.5 rounded-2xl py-4 px-6 font-sans text-sm font-medium text-offwhite/70 border border-dashed border-white/20 hover:border-white/40 hover:text-offwhite hover:bg-white/5 active:scale-[0.97] transition-all duration-200"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Upload Bingkai PNG
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                aria-label="Upload frame PNG files"
              />

              {/* Divider */}
              <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

              {/* Frame list */}
              <div
                className="flex flex-col gap-2 scrollable flex-1"
                style={{ maxHeight: "calc(100vh - 340px)" }}
              >
                {adminConfig.frames.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(230,224,212,0.15)">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                    <p className="font-sans text-xs text-offwhite/25 text-center leading-relaxed">
                      Belum ada bingkai.
                      <br />
                      Upload PNG transparan untuk mulai.
                    </p>
                  </div>
                ) : (
                  adminConfig.frames.map((frame) => (
                    <div
                      key={frame.id}
                      onClick={() => {
                        setEditingFrame(frame);
                        setSelectedSlotIndex(null);
                      }}
                      className="flex items-center gap-3 rounded-2xl p-3 cursor-pointer transition-all duration-200"
                      style={{
                        background:
                          editingFrame?.id === frame.id
                            ? "rgba(230,224,212,0.12)"
                            : "rgba(255,255,255,0.04)",
                        border:
                          editingFrame?.id === frame.id
                            ? "1px solid rgba(230,224,212,0.25)"
                            : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* Thumb */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frame.dataUrl}
                        alt={frame.name}
                        className="w-10 h-12 object-contain rounded-xl"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-offwhite truncate">{frame.name}</p>
                        <p className="font-sans text-xs text-offwhite/35 mt-0.5">{frame.slotCount} slot foto</p>
                      </div>
                      <button
                        id={`remove-frame-${frame.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFrame(frame.id);
                          if (editingFrame?.id === frame.id) setEditingFrame(null);
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/25 transition-colors flex-shrink-0"
                        aria-label={`Remove frame ${frame.name}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(249,246,240,0.4)">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Frame editor */}
            <div className={`flex-1 scrollable ${cardClass} p-8`} style={cardStyle}>
              {!editingFrame ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(230,224,212,0.12)">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  <p className="font-sans text-sm text-offwhite/30 text-center">
                    Pilih atau upload bingkai
                    <br />
                    untuk mengatur posisi slot foto
                  </p>
                </div>
              ) : (
                <div className="flex gap-8">
                  {/* Frame preview with slot overlays */}
                  <div className="flex flex-col items-center gap-5 flex-shrink-0">
                    <div
                      ref={containerRef}
                      onClick={() => setSelectedSlotIndex(null)}
                      className="relative rounded-2xl overflow-hidden inline-block cursor-default"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editingFrame.dataUrl}
                        alt={editingFrame.name}
                        className="max-h-[320px] max-w-[280px] w-auto h-auto block select-none pointer-events-none"
                        style={{ userSelect: "none" }}
                      />
                      {/* Slot overlays */}
                      {editingFrame.slots.map((slot, i) => {
                        const isSelected = selectedSlotIndex === i;
                        return (
                          <div
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSlotIndex(i);
                            }}
                            onMouseDown={(e) => handleSlotMouseDown(e, i, "drag")}
                            className={`absolute border-2 rounded cursor-move ${
                              isSelected
                                ? "border-[#e6e0d4] ring-2 ring-[#705141]/50 bg-cream/25 shadow-lg shadow-black/40"
                                : "border-cream/50 hover:border-cream bg-white/5"
                            }`}
                            style={{
                              left: `${slot.x}%`,
                              top: `${slot.y}%`,
                              width: `${slot.width}%`,
                              height: `${slot.height}%`,
                            }}
                          >
                            <span className="absolute top-1 left-1 text-[10px] font-sans font-semibold text-cream bg-mocha px-1.5 py-0.5 rounded shadow select-none pointer-events-none">
                              {i + 1}
                            </span>

                            {/* Resize handle (only on selected slot) */}
                            {isSelected && (
                              <div
                                onMouseDown={(e) => handleSlotMouseDown(e, i, "resize")}
                                className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#e6e0d4] border border-[#5a3e31] rounded-full cursor-se-resize shadow"
                                style={{ transform: "translate(35%, 35%)", zIndex: 10 }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="font-sans text-xs text-offwhite/35 tracking-wider">
                      Drag slot untuk memindahkan
                    </p>
                  </div>

                  {/* Slot config panel */}
                  <div className="flex-1 flex flex-col gap-6">
                    {/* Frame name */}
                    <div className={`${cardClass} p-6 flex flex-col gap-3`} style={cardStyle}>
                      <label className="font-sans text-xs text-offwhite/40 uppercase tracking-widest">
                        Nama Bingkai
                      </label>
                      <input
                        id="frame-name-input"
                        type="text"
                        value={editingFrame.name}
                        onChange={(e) => {
                          updateFrame(editingFrame.id, { name: e.target.value });
                          setEditingFrame({ ...editingFrame, name: e.target.value });
                        }}
                        className="w-full rounded-xl px-4 py-3 font-sans text-sm text-offwhite focus:outline-none transition-all"
                        style={{
                          background: "rgba(255,255,255,0.14)",
                          border: "1.5px solid rgba(230,224,212,0.22)",
                        }}
                      />
                    </div>

                    {/* Slot count */}
                    <div className={`${cardClass} p-6 flex flex-col gap-4`} style={cardStyle}>
                      <label className="font-sans text-xs text-offwhite/40 uppercase tracking-widest">
                        Jumlah Foto
                      </label>
                      <div className="flex gap-3">
                        {([1, 2, 3, 4] as const).map((n) => (
                          <button
                            key={n}
                            id={`slot-count-${n}`}
                            onClick={() => handleSlotCountChange(editingFrame, n)}
                            className="flex-1 h-12 rounded-2xl font-sans text-sm font-medium transition-all duration-200 active:scale-[0.97]"
                            style={{
                              background:
                                editingFrame.slotCount === n
                                  ? "#e6e0d4"
                                  : "rgba(255,255,255,0.06)",
                              color:
                                editingFrame.slotCount === n ? "#5a3e31" : "#f9f6f0",
                              border: "1px solid rgba(255,255,255,0.1)",
                              boxShadow:
                                editingFrame.slotCount === n
                                  ? "0 4px 12px rgba(0,0,0,0.2)"
                                  : "none",
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Slot positions */}
                    <div className={`${cardClass} p-6 flex flex-col gap-4`} style={cardStyle}>
                      <label className="font-sans text-xs text-offwhite/40 uppercase tracking-widest">
                        Posisi Slot <span className="normal-case text-offwhite/20">(% dari ukuran bingkai)</span>
                      </label>
                      <div
                        className="scrollable flex flex-col gap-3"
                        style={{ maxHeight: 260 }}
                      >
                        {editingFrame.slots.map((slot, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedSlotIndex(i)}
                            className="rounded-2xl p-4 transition-all cursor-pointer"
                            style={{
                              background:
                                selectedSlotIndex === i
                                  ? "rgba(230,224,212,0.1)"
                                  : "rgba(255,255,255,0.04)",
                              border:
                                selectedSlotIndex === i
                                  ? "1px solid rgba(230,224,212,0.35)"
                                  : "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <p className="font-sans text-xs text-offwhite/50 mb-3">
                              Slot {i + 1}
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                              {(["x", "y", "width", "height"] as const).map((field) => (
                                <div key={field} className="flex flex-col gap-1.5">
                                  <label className="font-sans text-[10px] text-offwhite/35 uppercase tracking-wider">
                                    {field}
                                  </label>
                                  <input
                                    id={`slot-${i}-${field}`}
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.1"
                                    value={slot[field]}
                                    onChange={(e) =>
                                      handleSlotEdit(
                                        editingFrame,
                                        i,
                                        field,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-full rounded-lg px-2.5 py-2 font-sans text-xs text-offwhite focus:outline-none transition-all"
                                    style={{
                                      background: "rgba(255,255,255,0.14)",
                                      border: "1.5px solid rgba(230,224,212,0.2)",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: Directory ───────────────────────────────────────────── */}
        {activeTab === "directory" && (
          <div className="flex-1 flex flex-col gap-6 max-w-2xl">
            {/* Main card */}
            <div className={`${cardClass} p-8 flex flex-col gap-6`} style={cardStyle}>
              <div>
                <h2 className="font-serif text-xl text-offwhite mb-2">
                  Direktori Penyimpanan
                </h2>
                <p className="font-sans text-sm text-offwhite/40 leading-relaxed">
                  Tentukan folder tempat foto sesi akan disimpan. Subfolder CS-1, CS-2, dst. akan dibuat otomatis di dalamnya.
                </p>
              </div>

              <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

              <div className="flex flex-col gap-3">
                <label
                  htmlFor="save-directory-input"
                  className="font-sans text-xs text-offwhite/40 uppercase tracking-widest"
                >
                  Path Folder
                </label>
                <input
                  id="save-directory-input"
                  type="text"
                  value={adminConfig.saveDirectory}
                  onChange={(e) => setSaveDirectory(e.target.value)}
                  placeholder="Contoh: D:\LenzySessions"
                  className="rounded-xl px-5 py-3.5 font-sans text-sm text-offwhite focus:outline-none transition-all w-full"
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    border: "1.5px solid rgba(230,224,212,0.22)",
                  }}
                />
              </div>

              {adminConfig.saveDirectory && (
                <div
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{
                    background: "rgba(90,200,90,0.07)",
                    border: "1px solid rgba(90,200,90,0.15)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#4ade80" className="mt-0.5 flex-shrink-0">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span className="font-sans text-sm text-offwhite/60 leading-relaxed">
                    Sesi akan disimpan di:{" "}
                    <code
                      className="font-mono rounded-lg px-2 py-0.5 text-cream"
                      style={{ background: "rgba(230,224,212,0.1)" }}
                    >
                      {adminConfig.saveDirectory}\CS-{sessionCounter}
                    </code>
                  </span>
                </div>
              )}
            </div>

            {/* Info card */}
            <div className={`${cardClass} p-6`} style={cardStyle}>
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(230,224,212,0.4)" className="mt-0.5 flex-shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <p className="font-sans text-sm text-offwhite/40 leading-relaxed">
                  Pastikan folder tersebut sudah ada dan aplikasi memiliki izin tulis. Foto disimpan sebagai PNG individual dan satu file GIF per sesi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Email ───────────────────────────────────────────────── */}
        {activeTab === "email" && (
          <div className="flex-1 flex flex-col gap-6 max-w-2xl">
            {/* Main card */}
            <div className={`${cardClass} p-8 flex flex-col gap-6`} style={cardStyle}>
              <div>
                <h2 className="font-serif text-xl text-offwhite mb-2">
                  Konfigurasi Email SMTP
                </h2>
                <p className="font-sans text-sm text-offwhite/40 leading-relaxed">
                  Gunakan Gmail App Password atau SMTP provider lain. Kredensial disimpan lokal di perangkat ini.
                </p>
              </div>

              <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

              <div className="flex flex-col gap-5">
                {[
                  {
                    id: "smtp-host",
                    label: "SMTP Host",
                    key: "host" as const,
                    placeholder: "smtp.gmail.com",
                    type: "text",
                  },
                  {
                    id: "smtp-port",
                    label: "Port",
                    key: "port" as const,
                    placeholder: "587",
                    type: "number",
                  },
                  {
                    id: "smtp-user",
                    label: "Email / Username",
                    key: "user" as const,
                    placeholder: "kamu@gmail.com",
                    type: "email",
                  },
                  {
                    id: "smtp-password",
                    label: "Password / App Password",
                    key: "password" as const,
                    placeholder: "••••••••••••",
                    type: "password",
                  },
                  {
                    id: "smtp-fromname",
                    label: "Nama Pengirim",
                    key: "fromName" as const,
                    placeholder: "Lenzy Photo",
                    type: "text",
                  },
                ].map(({ id, label, key, placeholder, type }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label
                      htmlFor={id}
                      className="font-sans text-xs text-offwhite/40 uppercase tracking-widest"
                    >
                      {label}
                    </label>
                    <input
                      id={id}
                      type={type}
                      value={String(adminConfig.smtp[key])}
                      onChange={(e) =>
                        setSmtpConfig({
                          ...adminConfig.smtp,
                          [key]:
                            key === "port"
                              ? parseInt(e.target.value) || 587
                              : e.target.value,
                        })
                      }
                      placeholder={placeholder}
                      className="rounded-xl px-5 py-3.5 font-sans text-sm text-offwhite focus:outline-none transition-all w-full"
                      style={{
                        background: "rgba(255,255,255,0.14)",
                        border: "1.5px solid rgba(230,224,212,0.22)",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Status badge */}
              {adminConfig.smtp.user && adminConfig.smtp.password ? (
                <div
                  className="flex items-center gap-3 rounded-2xl px-5 py-4"
                  style={{
                    background: "rgba(90,200,90,0.07)",
                    border: "1px solid rgba(90,200,90,0.15)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#4ade80">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span className="font-sans text-sm text-offwhite/60">
                    Email dikonfigurasi · Pengiriman foto aktif
                  </span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 rounded-2xl px-5 py-4"
                  style={{
                    background: "rgba(245,180,0,0.07)",
                    border: "1px solid rgba(245,180,0,0.15)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span className="font-sans text-sm text-offwhite/50">
                    Isi username dan password untuk mengaktifkan email
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Camera ──────────────────────────────────────────────── */}
        {activeTab === "camera" && (
          <div className="flex-1 flex gap-6">
            {/* Left: Camera list and preferences */}
            <div className={`w-80 flex-shrink-0 ${cardClass} p-6 flex flex-col gap-5`} style={cardStyle}>
              <div>
                <h2 className="font-serif text-xl text-offwhite mb-1">
                  Pengaturan Kamera
                </h2>
                <p className="font-sans text-xs text-offwhite/40 leading-relaxed">
                  Verifikasi dan tes koneksi kamera sebelum memulai sesi kiosk. Kamera eksternal akan terhubung otomatis jika dicolokkan.
                </p>
              </div>

              <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

              {/* Status Badge */}
              <div
                className="flex items-center gap-3 rounded-xl p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-300"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="font-sans text-xs font-medium">
                  Deteksi Otomatis Aktif (Plug & Play)
                </span>
              </div>

              {/* Camera List */}
              <div className="flex flex-col gap-2">
                <label className="font-sans text-xs text-offwhite/40 uppercase tracking-widest">
                  Kamera Terdeteksi ({devices.length})
                </label>
                <div className="flex flex-col gap-2 scrollable max-h-56 overflow-y-auto">
                  {devices.length === 0 ? (
                    <div className="py-4 text-center text-offwhite/30 font-sans text-xs">
                      Tidak ada kamera terdeteksi
                    </div>
                  ) : (
                    devices.map((device, idx) => {
                      const isActive = device.deviceId === activeDeviceId;
                      return (
                        <button
                          key={device.deviceId || idx}
                          type="button"
                          onClick={() => {
                            setActiveDeviceId(device.deviceId);
                            setCameraId(device.deviceId);
                            setActiveDeviceLabel(device.label || `Kamera ${idx + 1}`);
                          }}
                          className="flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 hover:bg-white/5 cursor-pointer focus:outline-none"
                          style={{
                            background: isActive
                              ? "rgba(230,224,212,0.12)"
                              : "rgba(255,255,255,0.03)",
                            border: isActive
                              ? "1px solid rgba(230,224,212,0.25)"
                              : "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <svg
                            className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-cream" : "text-offwhite/30"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <span className={`block font-sans text-xs truncate ${isActive ? "text-offwhite font-medium" : "text-offwhite/60"}`}>
                              {device.label || `Kamera ${idx + 1}`}
                            </span>
                            <span className="block font-mono text-[9px] text-offwhite/20 truncate">
                              ID: {device.deviceId ? `${device.deviceId.slice(0, 12)}...` : "N/A"}
                            </span>
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-cream" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={scanDevices}
                className="flex items-center justify-center gap-2 rounded-xl py-3 border border-white/10 font-sans text-xs text-offwhite/60 hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.213 6H16" />
                </svg>
                Pindai Ulang Kamera
              </button>
            </div>

            {/* Right: Live Preview Panel */}
            <div className={`flex-1 ${cardClass} p-8 flex flex-col gap-4`} style={cardStyle}>
              <div>
                <h3 className="font-serif text-lg text-offwhite mb-0.5">
                  Live Preview: {activeDeviceLabel || "Memuat..."}
                </h3>
                <p className="font-sans text-xs text-offwhite/40">
                  Pastikan rasio gambar dan pencahayaan sudah optimal sebelum meluncurkan kiosk.
                </p>
              </div>

              {/* Live Webcam Window */}
              <div className="flex-1 rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative min-h-[300px] flex items-center justify-center">
                {activeDeviceId ? (
                  <Webcam
                    audio={false}
                    screenshotFormat="image/png"
                    videoConstraints={{
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                      deviceId: { exact: activeDeviceId },
                    }}
                    onUserMedia={scanDevices}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center flex flex-col items-center gap-3">
                    <svg className="w-12 h-12 text-offwhite/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="font-sans text-xs text-offwhite/30">
                      Hubungkan kamera atau izinkan akses untuk melihat preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Launch Confirm Modal ─────────────────────────────────────────── */}
      {launchConfirm && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
          onClick={() => setLaunchConfirm(false)}
        >
          <div
            className="flex flex-col items-center gap-8 rounded-3xl p-10 max-w-sm w-full mx-4 shadow-2xl"
            style={{
              background: "#2e1e14",
              border: "1px solid rgba(230,224,212,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-cream/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#e6e0d4">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="font-serif text-2xl text-offwhite mb-3">Mulai Kiosk?</h2>
              <p className="font-sans text-sm text-offwhite/50 leading-relaxed">
                Panel admin akan terkunci. Untuk kembali, ketuk sudut kiri atas sebanyak 5 kali.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                id="cancel-launch-btn"
                onClick={() => setLaunchConfirm(false)}
                className="flex-1 rounded-full py-4 font-sans text-sm font-medium transition-all active:scale-[0.97]"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  color: "#f9f6f0",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Batal
              </button>
              <button
                id="confirm-launch-btn"
                onClick={launchKiosk}
                className="flex-1 rounded-full py-4 font-sans text-sm font-medium transition-all active:scale-[0.97] shadow-lg shadow-black/20"
                style={{
                  background: "linear-gradient(135deg, #e6e0d4 0%, #d4c9b8 100%)",
                  color: "#3d2a1f",
                }}
              >
                Launch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
