"use client";

import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import AdminView from "./admin/AdminView";
import KioskView from "./kiosk/KioskView";
import { useEffect, useState } from "react";

export default function RootPage() {
  const appMode = usePhotoboothStore((s) => s.appMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="h-full w-full overflow-hidden" style={{ background: "#3d2a1f" }} />
    );
  }

  return (
    <main className="h-full w-full overflow-hidden">
      {appMode === "admin" ? <AdminView /> : <KioskView />}
    </main>
  );
}
