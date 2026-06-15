"use client";

import { useEffect } from "react";

interface GalleryFile {
  name: string;
  url: string;
}

interface GalleryContentProps {
  sessionId: string;
  animatedGif: GalleryFile | null;
  framedPhoto: GalleryFile | null;
  displayOriginals: GalleryFile[];
}

export default function GalleryContent({
  sessionId,
  animatedGif,
  framedPhoto,
  displayOriginals,
}: GalleryContentProps) {
  useEffect(() => {
    // Save original body overflow styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Enable page scrolling on mobile
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    return () => {
      // Restore original overflow styles for the Kiosk
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  const hasBothShowcase = animatedGif && framedPhoto;

  return (
    <div 
      className="min-h-screen pb-20 font-sans" 
      style={{ 
        background: "linear-gradient(160deg, #4A2C1A 0%, #6B4226 100%)", 
        color: "#FFF8F0" 
      }}
    >
      {/* Header (No white border) */}
      <div className="px-6 py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Terima Kasih!</h1>
        <p className="text-sm text-cream/70">
          Berikut adalah hasil foto dari sesi kamu. Silakan simpan ke perangkat HP.
        </p>
      </div>

      <div className="p-6 flex flex-col gap-10 max-w-5xl mx-auto">
        
        {/* GIF & Framed collage showcase block */}
        {(animatedGif || framedPhoto) && (
          <div className={hasBothShowcase ? "grid grid-cols-1 md:grid-cols-2 gap-8 items-start" : "flex justify-center"}>
            
            {/* GIF Section */}
            {animatedGif && (
              <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                <h2 className="text-xs uppercase tracking-widest text-center font-bold text-cream/50">Video Animasi (GIF)</h2>
                {/* No card borders */}
                <div className="rounded-2xl overflow-hidden bg-mocha/30 p-4 shadow-xl flex flex-col justify-between h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={animatedGif.url} 
                    alt="Animation GIF" 
                    className="w-full h-auto rounded-xl object-contain mb-4"
                  />
                  <a 
                    href={`/api/download-asset?url=${encodeURIComponent(animatedGif.url)}&filename=lenzy-animation.gif`}
                    download="lenzy-animation.gif"
                    className="mt-auto block w-full py-4 rounded-xl text-center text-sm font-bold transition-all active:scale-95 cursor-pointer bg-cream/15 text-[#FFF8F0] hover:bg-cream/20"
                  >
                    Download GIF
                  </a>
                </div>
              </div>
            )}

            {/* Framed Section */}
            {framedPhoto && (
              <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                <h2 className="text-xs uppercase tracking-widest text-center font-bold text-cream/50">Foto Cetak (Kolase)</h2>
                {/* No card borders */}
                <div className="rounded-2xl overflow-hidden bg-mocha/30 p-4 shadow-xl flex flex-col justify-between h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={framedPhoto.url} 
                    alt="Kolase Foto" 
                    className="w-full h-auto rounded-xl object-contain mb-4"
                  />
                  <a 
                    href={`/api/download-asset?url=${encodeURIComponent(framedPhoto.url)}&filename=lenzy-kolase.png`}
                    download="lenzy-kolase.png"
                    className="mt-auto block w-full py-4 rounded-xl text-center text-sm font-bold transition-all active:scale-95 cursor-pointer bg-cream/15 text-[#FFF8F0] hover:bg-cream/20"
                  >
                    Download Kolase
                  </a>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Originals Section */}
        {displayOriginals.length > 0 && (
          <div className="flex flex-col gap-3 w-full">
            <h2 className="text-xs uppercase tracking-widest text-center font-bold text-cream/50">Foto Satuan (Original)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {displayOriginals.map((photo, idx) => (
                <div key={idx} className="rounded-2xl overflow-hidden bg-mocha/30 p-3.5 flex flex-col justify-between gap-4 shadow-lg w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photo.url} 
                    alt={`Foto ${idx + 1}`} 
                    className="w-full h-auto rounded-xl object-cover aspect-[3/2]"
                  />
                  <a 
                    href={`/api/download-asset?url=${encodeURIComponent(photo.url)}&filename=lenzy-photo-${idx + 1}.jpg`}
                    download={`lenzy-photo-${idx + 1}.jpg`}
                    className="block w-full py-3.5 rounded-lg text-center text-xs font-bold transition-all active:scale-95 cursor-pointer bg-cream/10 text-[#FFF8F0] hover:bg-cream/15"
                  >
                    Simpan Foto
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
