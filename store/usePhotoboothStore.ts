import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SlotConfig {
  x: number;       // percentage of frame width
  y: number;       // percentage of frame height
  width: number;   // percentage of frame width
  height: number;  // percentage of frame height
}

export interface FrameConfig {
  id: string;
  name: string;
  dataUrl: string;    // base64 PNG of the frame
  slotCount: 1 | 2 | 3 | 4;
  slots: SlotConfig[];
  thumbnailDataUrl?: string;
}

export interface AdminConfig {
  frames: FrameConfig[];
  saveDirectory: string;
  cameraId?: string | null;
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    fromName: string;
  };
}

export interface CapturedPhoto {
  slotIndex: number;
  dataUrl: string;
}

export interface Session {
  sessionId: string;
  selectedFrame: FrameConfig | null;
  photos: CapturedPhoto[];
  activeFilter: "normal" | "grayscale" | "sepia";
  framedPhotoDataUrl: string | null;
  gifDataUrl: string | null;
  gifBlobUrl: string | null;
}

export type AppMode = "admin" | "kiosk";
export type KioskPage = 1 | 2 | 3 | 4 | 5;

interface PhotoboothState {
  // ── App Mode ──────────────────────────────────────
  appMode: AppMode;
  kioskPage: KioskPage;

  // ── Admin Config ──────────────────────────────────
  adminConfig: AdminConfig;

  // ── Session ───────────────────────────────────────
  session: Session;
  sessionCounter: number;

  // ── Actions ───────────────────────────────────────
  setAppMode: (mode: AppMode) => void;
  setKioskPage: (page: KioskPage) => void;

  // Admin actions
  addFrame: (frame: FrameConfig) => void;
  removeFrame: (id: string) => void;
  updateFrame: (id: string, updates: Partial<FrameConfig>) => void;
  setSaveDirectory: (dir: string) => void;
  setCameraId: (id: string | null) => void;
  setSmtpConfig: (smtp: AdminConfig["smtp"]) => void;

  // Session actions
  selectFrame: (frame: FrameConfig) => void;
  addPhoto: (photo: CapturedPhoto) => void;
  replacePhoto: (slotIndex: number, dataUrl: string) => void;
  setActiveFilter: (filter: Session["activeFilter"]) => void;
  setFramedPhoto: (dataUrl: string) => void;
  setGif: (dataUrl: string, blobUrl: string) => void;

  // Flow actions
  launchKiosk: () => void;
  finishSession: () => void;
  resetSession: () => void;
  getNextSessionId: () => string;
}

// Custom IndexedDB storage engine to bypass localStorage 5MB quota limit
const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined" || !window.indexedDB) return null;
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open("lenzy-photo-db", 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("store");
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("store", "readonly");
          const getReq = tx.objectStore("store").get(name);
          getReq.onsuccess = () => {
            resolve(getReq.result || null);
          };
          getReq.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined" || !window.indexedDB) return;
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open("lenzy-photo-db", 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("store");
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("store", "readwrite");
          const putReq = tx.objectStore("store").put(value, name);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined" || !window.indexedDB) return;
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open("lenzy-photo-db", 1);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("store");
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("store", "readwrite");
          const delReq = tx.objectStore("store").delete(name);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => reject(delReq.error);
        };
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  },
};

// ─── Default Values ───────────────────────────────────────────────────────────

const defaultAdminConfig: AdminConfig = {
  frames: [],
  saveDirectory: "",
  cameraId: null,
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    user: "",
    password: "",
    fromName: "Lenzy Photo",
  },
};

const defaultSession = (sessionId: string): Session => ({
  sessionId,
  selectedFrame: null,
  photos: [],
  activeFilter: "normal",
  framedPhotoDataUrl: null,
  gifDataUrl: null,
  gifBlobUrl: null,
});

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePhotoboothStore = create<PhotoboothState>()(
  persist(
    (set, get) => ({
      appMode: "admin",
      kioskPage: 1,
      adminConfig: defaultAdminConfig,
      session: defaultSession("CS-1"),
      sessionCounter: 1,

      // ── Mode ────────────────────────────────────────
      setAppMode: (mode) => set({ appMode: mode }),
      setKioskPage: (page) => set({ kioskPage: page }),

      // ── Admin ────────────────────────────────────────
      addFrame: (frame) =>
        set((s) => ({
          adminConfig: {
            ...s.adminConfig,
            frames: [...s.adminConfig.frames, frame],
          },
        })),

      removeFrame: (id) =>
        set((s) => ({
          adminConfig: {
            ...s.adminConfig,
            frames: s.adminConfig.frames.filter((f) => f.id !== id),
          },
        })),

      updateFrame: (id, updates) =>
        set((s) => ({
          adminConfig: {
            ...s.adminConfig,
            frames: s.adminConfig.frames.map((f) =>
              f.id === id ? { ...f, ...updates } : f
            ),
          },
        })),

      setSaveDirectory: (dir) =>
        set((s) => ({
          adminConfig: { ...s.adminConfig, saveDirectory: dir },
        })),

      setCameraId: (id) =>
        set((s) => ({
          adminConfig: { ...s.adminConfig, cameraId: id },
        })),

      setSmtpConfig: (smtp) =>
        set((s) => ({
          adminConfig: { ...s.adminConfig, smtp },
        })),

      // ── Session ──────────────────────────────────────
      selectFrame: (frame) =>
        set((s) => ({
          session: { ...s.session, selectedFrame: frame, photos: [] },
        })),

      addPhoto: (photo) =>
        set((s) => ({
          session: { ...s.session, photos: [...s.session.photos, photo] },
        })),

      replacePhoto: (slotIndex, dataUrl) =>
        set((s) => ({
          session: {
            ...s.session,
            photos: s.session.photos.map((p) =>
              p.slotIndex === slotIndex ? { ...p, dataUrl } : p
            ),
          },
        })),

      setActiveFilter: (filter) =>
        set((s) => ({ session: { ...s.session, activeFilter: filter } })),

      setFramedPhoto: (dataUrl) =>
        set((s) => ({ session: { ...s.session, framedPhotoDataUrl: dataUrl } })),

      setGif: (dataUrl, blobUrl) =>
        set((s) => ({ session: { ...s.session, gifDataUrl: dataUrl, gifBlobUrl: blobUrl } })),

      // ── Flow ─────────────────────────────────────────
      launchKiosk: () => set({ appMode: "kiosk", kioskPage: 1 }),

      getNextSessionId: () => {
        const counter = get().sessionCounter;
        return `CS-${counter}`;
      },

      finishSession: () => {
        const next = get().sessionCounter + 1;
        set({
          sessionCounter: next,
          session: defaultSession(`CS-${next}`),
          kioskPage: 1,
        });
      },

      resetSession: () => {
        const id = get().getNextSessionId();
        set({ session: defaultSession(id) });
      },
    }),
    {
      name: "lenzy-photo-store",
      storage: createJSONStorage(() => indexedDBStorage),
      // Don't persist session data (photos are large) — only config & counter
      partialize: (state) => ({
        adminConfig: state.adminConfig,
        sessionCounter: state.sessionCounter,
        appMode: state.appMode,
      }),
    }
  )
);
