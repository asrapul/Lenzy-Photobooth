// types/electron.d.ts
// TypeScript declarations for the secure Electron API exposed via contextBridge.

interface DslrCaptureResult {
  success: boolean;
  dataUrl?: string;   // base64 data URL (data:image/jpeg;base64,...)
  error?: string;     // Human-readable error message
  code?: string;      // Error code: CAMERA_NOT_FOUND | TIMEOUT | FILE_NOT_FOUND | READ_FAILED | CMD_NOT_FOUND | CAPTURE_FAILED
}

interface DslrStatus {
  platform: string;    // "win32" | "darwin" | "linux"
  available: boolean;  // Whether the CLI tool was found
  path: string | null; // Path to the CLI executable
  tool: string;        // "digiCamControl" | "gphoto2"
}

interface ElectronAPI {
  isElectron: true;
  captureFromDSLR: () => Promise<DslrCaptureResult>;
  getDslrStatus: () => Promise<DslrStatus>;
  getTunnelUrl: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
