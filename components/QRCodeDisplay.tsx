"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export default function QRCodeDisplay({
  value,
  size = 150,
  label = "Scan untuk download",
}: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Pure-white QR container for maximum scannability */}
      <QRCodeSVG
        value={value || "https://lenzy.photo"}
        size={size}
        bgColor="#ffffff"
        fgColor="#1a1a1a"
        level="M"
      />

      {/* Label (only shown when provided) */}
      {label && (
        <p
          className="font-sans text-xs text-center"
          style={{ color: "rgba(230,224,212,0.5)", maxWidth: size }}
        >
          {label}
        </p>
      )}
    </div>
  );
}
