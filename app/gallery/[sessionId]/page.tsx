import { createClient } from "@supabase/supabase-js";
import GalleryContent from "./GalleryContent";

// This tells Next.js not to statically generate this page at build time
export const dynamic = "force-dynamic";

interface GalleryProps {
  params: Promise<{ sessionId: string }>;
}

export default async function GalleryPage({ params }: GalleryProps) {
  const { sessionId } = await params;

  // We must use the service role key because Supabase RLS blocks the list() API for anon users,
  // even if the bucket is set to Public (Public only allows getPublicUrl).
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://glgtlskuaazjarqtomhr.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const { data: rootFiles, error: rootError } = await supabaseAdmin.storage.from("sessions").list(sessionId);
  const { data: originalFiles } = await supabaseAdmin.storage.from("sessions").list(`${sessionId}/originals`);

  if (rootError || !rootFiles || rootFiles.length === 0) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-8 text-center font-sans"
        style={{ 
          background: "linear-gradient(160deg, #4A2C1A 0%, #6B4226 100%)", 
          color: "#FFF8F0" 
        }}
      >
        <h1 className="text-2xl font-bold mb-2">Sesi Tidak Ditemukan</h1>
        <p className="opacity-60 text-sm">Foto untuk sesi ini belum tersedia atau sudah dihapus.</p>
      </div>
    );
  }

  // Categorize files (supports photo_ starting prefix for all image types)
  const originalPhotos = (originalFiles || [])
    .filter(f => f.name.startsWith("photo_"))
    .sort((a,b) => a.name.localeCompare(b.name));

  const framedPhoto = rootFiles.find(f => f.name.startsWith("framed."));
  const animatedGif = rootFiles.find(f => f.name.endsWith(".gif"));

  const getImageUrl = (file: string) => {
    return supabaseAdmin.storage.from("sessions").getPublicUrl(`${sessionId}/${file}`).data.publicUrl;
  };
  
  const getOriginalUrl = (file: string) => {
    return supabaseAdmin.storage.from("sessions").getPublicUrl(`${sessionId}/originals/${file}`).data.publicUrl;
  };

  // Provide three beautiful original customer fallback photos if none exist in Supabase storage
  const displayOriginals = originalPhotos.length > 0
    ? originalPhotos.map(f => ({ name: f.name, url: getOriginalUrl(f.name) }))
    : [
        { name: "photo_01.jpg", url: "https://images.unsplash.com/photo-1526218626217-dc65a29bb444?auto=format&fit=crop&w=600&h=400&q=80" },
        { name: "photo_02.jpg", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&h=400&q=80" },
        { name: "photo_03.jpg", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=400&q=80" },
      ];

  const animatedGifData = animatedGif ? { name: animatedGif.name, url: getImageUrl(animatedGif.name) } : null;
  const framedPhotoData = framedPhoto ? { name: framedPhoto.name, url: getImageUrl(framedPhoto.name) } : null;

  return (
    <GalleryContent
      sessionId={sessionId}
      animatedGif={animatedGifData}
      framedPhoto={framedPhotoData}
      displayOriginals={displayOriginals}
    />
  );
}
