import { supabase } from "@/lib/supabase";

// This tells Next.js not to statically generate this page at build time
export const dynamic = "force-dynamic";

interface GalleryProps {
  params: Promise<{ sessionId: string }>;
}

export default async function GalleryPage({ params }: GalleryProps) {
  const { sessionId } = await params;

  const { data: rootFiles, error: rootError } = await supabase.storage.from("sessions").list(sessionId);
  const { data: originalFiles } = await supabase.storage.from("sessions").list(`${sessionId}/originals`);

  if (rootError || !rootFiles || rootFiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#2a1b12] text-[#e6e0d4] flex flex-col items-center justify-center p-8 text-center font-sans">
        <h1 className="text-2xl font-serif mb-2">Sesi Tidak Ditemukan</h1>
        <p className="opacity-60">Foto untuk sesi ini belum tersedia atau sudah dihapus.</p>
      </div>
    );
  }

  // Categorize files
  const originalPhotos = (originalFiles || []).filter(f => f.name.startsWith("photo_") && f.name.endsWith(".jpg")).sort((a,b) => a.name.localeCompare(b.name));
  const framedPhoto = rootFiles.find(f => f.name.startsWith("framed."));
  const animatedGif = rootFiles.find(f => f.name.endsWith(".gif"));

  const getImageUrl = (file: string) => {
    return supabase.storage.from("sessions").getPublicUrl(`${sessionId}/${file}`).data.publicUrl;
  };
  
  const getOriginalUrl = (file: string) => {
    return supabase.storage.from("sessions").getPublicUrl(`${sessionId}/originals/${file}`).data.publicUrl;
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "linear-gradient(160deg, #3d2a1f 0%, #5a3e31 100%)", color: "#f9f6f0" }}>
      {/* Header */}
      <div className="px-6 py-8 text-center" style={{ borderBottom: "1px solid rgba(230,224,212,0.1)" }}>
        <h1 className="font-serif text-3xl mb-1">Terima Kasih!</h1>
        <p className="font-sans text-sm" style={{ color: "rgba(230,224,212,0.6)" }}>
          Berikut adalah hasil foto kamu.
        </p>
      </div>

      <div className="p-6 flex flex-col gap-8 max-w-lg mx-auto">
        
        {/* GIF Section */}
        {animatedGif && (
          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-xs uppercase tracking-widest text-center" style={{ color: "rgba(230,224,212,0.5)" }}>Video Animasi (GIF)</h2>
            <div className="rounded-2xl overflow-hidden bg-[rgba(20,10,5,0.5)] border border-[rgba(230,224,212,0.1)] p-4 shadow-xl">
              <img 
                src={getImageUrl(animatedGif.name)} 
                alt="Animation GIF" 
                className="w-full h-auto rounded-xl object-contain mb-4"
              />
              <a 
                href={getImageUrl(animatedGif.name)} 
                download="lenzy-animation.gif"
                className="mt-2 block w-full py-3.5 rounded-xl text-center font-sans text-sm font-semibold transition-all active:scale-95"
                style={{ background: "rgba(230,224,212,0.15)", color: "#e6e0d4", border: "1px solid rgba(230,224,212,0.2)" }}
              >
                Download GIF
              </a>
            </div>
          </div>
        )}

        {/* Framed Section */}
        {framedPhoto && (
          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-xs uppercase tracking-widest text-center" style={{ color: "rgba(230,224,212,0.5)" }}>Foto Cetak (Kolase)</h2>
            <div className="rounded-2xl overflow-hidden bg-[rgba(20,10,5,0.5)] border border-[rgba(230,224,212,0.1)] p-4 shadow-xl">
              <img 
                src={getImageUrl(framedPhoto.name)} 
                alt="Kolase Foto" 
                className="w-full h-auto rounded-xl object-contain mb-4"
              />
              <a 
                href={getImageUrl(framedPhoto.name)} 
                download="lenzy-kolase.png"
                className="mt-2 block w-full py-3.5 rounded-xl text-center font-sans text-sm font-semibold transition-all active:scale-95"
                style={{ background: "rgba(230,224,212,0.15)", color: "#e6e0d4", border: "1px solid rgba(230,224,212,0.2)" }}
              >
                Download Kolase
              </a>
            </div>
          </div>
        )}

        {/* Originals Section */}
        {originalPhotos.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-xs uppercase tracking-widest text-center" style={{ color: "rgba(230,224,212,0.5)" }}>Foto Satuan (Original)</h2>
            <div className="grid grid-cols-2 gap-3">
              {originalPhotos.map((photo, idx) => {
                const url = getOriginalUrl(photo.name);
                return (
                  <div key={idx} className="rounded-2xl overflow-hidden bg-[rgba(20,10,5,0.5)] border border-[rgba(230,224,212,0.1)] p-3 flex flex-col gap-3 shadow-lg">
                    <img 
                      src={url} 
                      alt={`Foto ${idx + 1}`} 
                      className="w-full h-auto rounded-xl object-cover aspect-[3/2]"
                    />
                    <a 
                      href={url}
                      download={`lenzy-photo-${idx + 1}.jpg`}
                      className="block w-full py-2.5 rounded-lg text-center font-sans text-xs font-medium transition-all active:scale-95"
                      style={{ background: "rgba(230,224,212,0.08)", color: "#e6e0d4", border: "1px solid rgba(230,224,212,0.1)" }}
                    >
                      Simpan
                    </a>
                  </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Bar for ZIP Download */}
      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background: "linear-gradient(to top, rgba(30,20,15,0.95) 0%, rgba(30,20,15,0) 100%)" }}>
        <div className="max-w-lg mx-auto">
          <a 
            href={`/api/download/${sessionId}?dir=${encodeURIComponent(dir)}`}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-center font-sans text-sm font-bold shadow-2xl transition-all active:scale-[0.98]"
            style={{ background: "#e6e0d4", color: "#2a1b12" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Download Semua (ZIP)
          </a>
        </div>
      </div>
    </div>
  );
}
