// FILE: d:\Coding\asrapgabut\lenzy-photo\components\FrameCard.tsx
"use client";

import { FrameConfig } from "@/store/usePhotoboothStore";

interface FrameCardProps {
  frame: FrameConfig;
  selected?: boolean;
  onSelect: (frame: FrameConfig) => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export default function FrameCard({
  frame,
  selected,
  onSelect,
  onDelete,
  showDelete,
}: FrameCardProps) {
  return (
    <button
      id={`frame-card-${frame.id}`}
      onClick={() => onSelect(frame)}
      className="relative group flex flex-col items-center gap-3 focus:outline-none transition-all duration-200 hover:-translate-y-1 active:scale-[0.97]"
      aria-pressed={selected}
      aria-label={`Select frame: ${frame.name}`}
    >
      {/* Card container */}
      <div
        className="relative overflow-hidden rounded-2xl transition-all duration-200"
        style={{
          width: 210,
          height: 288,
          background: selected
            ? "rgba(230,224,212,0.12)"
            : "rgba(0,0,0,0.25)",
          border: selected
            ? "2.5px solid #e6e0d4"
            : "1.5px solid rgba(230,224,212,0.18)",
          boxShadow: selected
            ? "0 8px 28px rgba(0,0,0,0.35), 0 0 0 3px rgba(230,224,212,0.2)"
            : "0 4px 16px rgba(0,0,0,0.25)",
        }}
        onMouseEnter={(e) => {
          if (!selected) {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 4px 16px rgba(0,0,0,0.25), 0 0 0 2px rgba(180,130,80,0.4)";
          }
        }}
        onMouseLeave={(e) => {
          if (!selected) {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 4px 16px rgba(0,0,0,0.25)";
          }
        }}
      >
        {/* Frame thumbnail */}
        {frame.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frame.dataUrl}
            alt={frame.name}
            className="w-full h-full object-contain p-3"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: "rgba(230,224,212,0.25)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}

        {/* Slot count badge */}
        <div
          className="absolute top-2.5 right-2.5 rounded-lg px-2 py-0.5 font-sans text-xs font-medium"
          style={{ background: "rgba(0,0,0,0.6)", color: "#e6e0d4" }}
        >
          {frame.slotCount} foto
        </div>

        {/* Selected checkmark */}
        {selected && (
          <div
            className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "#e6e0d4" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#5a3e31">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        )}

        {/* Delete button (admin only) */}
        {showDelete && onDelete && (
          <button
            id={`delete-frame-${frame.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(frame.id);
            }}
            className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: "rgba(200,60,60,0.85)" }}
            aria-label="Remove frame"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>

      {/* Frame name */}
      <span
        className="font-sans text-sm font-medium text-center max-w-[195px] truncate"
        style={{ color: selected ? "#e6e0d4" : "rgba(230,224,212,0.55)" }}
      >
        {frame.name}
      </span>
    </button>
  );
}
