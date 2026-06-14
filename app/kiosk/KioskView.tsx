"use client";

import { usePhotoboothStore } from "@/store/usePhotoboothStore";
import IdleScreen from "./IdleScreen";
import FrameSelection from "./FrameSelection";
import CaptureSession from "./CaptureSession";
import ReviewExport from "./ReviewExport";
import ExportShare from "./ExportShare";
import { useEffect, useState } from "react";

export default function KioskView() {
  const kioskPage = usePhotoboothStore((s) => s.kioskPage);
  const setAppMode = usePhotoboothStore((s) => s.setAppMode);

  const [displayPage, setDisplayPage] = useState(kioskPage);
  const [animKey, setAnimKey] = useState(0);
  const [adminClicks, setAdminClicks] = useState(0);

  useEffect(() => {
    setDisplayPage(kioskPage);
    setAnimKey((k) => k + 1);
  }, [kioskPage]);

  // Reset clicks after 2 seconds of inactivity
  useEffect(() => {
    if (adminClicks === 0) return;
    const t = setTimeout(() => setAdminClicks(0), 2000);
    return () => clearTimeout(t);
  }, [adminClicks]);

  const handleCornerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextClicks = adminClicks + 1;
    if (nextClicks >= 5) {
      setAppMode("admin");
    } else {
      setAdminClicks(nextClicks);
    }
  };

  const pages: Record<number, React.ReactNode> = {
    1: <IdleScreen />,
    2: <FrameSelection />,
    3: <CaptureSession />,
    4: <ReviewExport />,
    5: <ExportShare />,
  };

  return (
    <div className="h-full w-full overflow-hidden relative" style={{ background: "#5a3e31" }}>
      {/* Secret gesture: click top-left corner 5 times to return to Admin */}
      <div
        onClick={handleCornerClick}
        className="absolute top-0 left-0 w-20 h-20 z-50 cursor-default select-none"
        style={{ pointerEvents: "auto" }}
        title="Secret escape hatch"
      />

      <div key={animKey} className="h-full w-full page-enter">
        {pages[displayPage]}
      </div>
    </div>
  );
}
