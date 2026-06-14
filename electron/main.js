// electron/main.js — Lenzy Photo Kiosk: Electron Main Process
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");

const isDev = !app.isPackaged;

// ── Paths for digiCamControl executables ──────────────────────────────────────
const DIGICAM_CMD_PATHS = [
  "C:\\Program Files (x86)\\digiCamControl\\CameraControlCmd.exe",
  "C:\\Program Files\\digiCamControl\\CameraControlCmd.exe",
  path.join(os.homedir(), "AppData", "Local", "digiCamControl", "CameraControlCmd.exe"),
];

const DIGICAM_REMOTE_PATHS = [
  "C:\\Program Files (x86)\\digiCamControl\\CameraControlRemoteCmd.exe",
  "C:\\Program Files\\digiCamControl\\CameraControlRemoteCmd.exe",
  path.join(os.homedir(), "AppData", "Local", "digiCamControl", "CameraControlRemoteCmd.exe"),
];

function findCmdPath(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── Helper to execute command ────────────────────────────────────────────────
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log("[DSLR] Executing command:", command);
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr, stdout });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    kiosk: !isDev,
    fullscreen: !isDev,
    frame: isDev,
    backgroundColor: "#3d2a1f",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const url = isDev
    ? "http://localhost:3000"
    : "file://" + path.join(__dirname, "../out/index.html");

  mainWindow.loadURL(url);
  if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── IPC Handlers ────────────────────────────────────────────────────────
// ── IPC: Capture from DSLR ────────────────────────────────────────────────────
ipcMain.handle("capture-dslr", async () => {
  const tmpPath = path.join(os.tmpdir(), `lenzy_dslr_${Date.now()}.jpg`);
  const platform = process.platform;

  if (platform !== "win32" && platform !== "darwin" && platform !== "linux") {
    return { success: false, error: "Platform tidak didukung: " + platform, code: "UNSUPPORTED_PLATFORM" };
  }

  // Windows: Coba gunakan CameraControlRemoteCmd.exe dulu jika GUI digiCamControl aktif
  if (platform === "win32") {
    const remotePath = findCmdPath(DIGICAM_REMOTE_PATHS);
    if (remotePath) {
      try {
        console.log("[DSLR] Attempting capture with CameraControlRemoteCmd...");
        // Command format: CameraControlRemoteCmd.exe /c capture <filename>
        await runCommand(`"${remotePath}" /c capture "${tmpPath}"`);
      } catch (err) {
        console.log("[DSLR] RemoteCmd failed or GUI not running, falling back to CameraControlCmd...", err.stderr || err.message);
      }
    }

    // Jika RemoteCmd gagal, coba Cmd biasa
    const cmdPath = findCmdPath(DIGICAM_CMD_PATHS);
    if (cmdPath && !fs.existsSync(tmpPath)) {
      try {
        await runCommand(`"${cmdPath}" /capture /filename "${tmpPath}"`);
      } catch (err) {
        const combined = ((err.error?.message || "") + (err.stderr || "")).toLowerCase();
        let code = "CAPTURE_FAILED";
        let msg = "Gagal mengambil foto dari kamera Nikon.";
        if (combined.includes("no camera") || combined.includes("not connected") || combined.includes("camera is not")) {
          code = "CAMERA_NOT_FOUND";
          msg = "Kamera tidak terdeteksi. Pastikan Nikon D7100 terhubung via USB dan sudah menyala.";
        } else if (combined.includes("timeout")) {
          code = "TIMEOUT";
          msg = "Timeout: Kamera tidak merespons dalam 30 detik.";
        }
        return { success: false, error: msg, code };
      }
    }
  }

  // Mac / Linux fallback: gphoto2
  if (platform === "darwin" || platform === "linux") {
    try {
      await runCommand(`gphoto2 --capture-image-and-download --force-overwrite --filename "${tmpPath}"`);
    } catch (err) {
      return { success: false, error: "Gagal capture via gphoto2: " + (err.error?.message || err.stderr), code: "CAPTURE_FAILED" };
    }
  }

  // Tunggu file selesai ditulis (terkadang digiCamControl butuh waktu beberapa detik)
  let finalPath = null;
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(tmpPath)) {
      finalPath = tmpPath;
      break;
    }
    const tmpDir = os.tmpdir();
    const candidates = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith("lenzy_dslr_") && (f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".jpeg")))
      .map(f => ({ f, t: fs.statSync(path.join(tmpDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
      
    if (candidates.length > 0) {
      finalPath = path.join(tmpDir, candidates[0].f);
      break;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  if (!finalPath) {
    return { success: false, error: "File foto tidak ditemukan setelah capture.", code: "FILE_NOT_FOUND" };
  }

  try {
    // Tunggu sedikit ekstra agar file selesai ditulis (menghindari EBUSY)
    await new Promise(r => setTimeout(r, 200));
    const data = fs.readFileSync(finalPath);
    const base64 = "data:image/jpeg;base64," + data.toString("base64");
    fs.unlinkSync(finalPath);
    console.log("[DSLR] ✓ Captured", Math.round(data.length / 1024) + "KB");
    return { success: true, dataUrl: base64 };
  } catch (readErr) {
    return { success: false, error: "Gagal membaca file foto: " + readErr.message, code: "READ_FAILED" };
  }
});

ipcMain.handle("get-dslr-status", async () => {
  if (process.platform === "win32") {
    const exePath = findCmdPath(DIGICAM_CMD_PATHS);
    const remotePath = findCmdPath(DIGICAM_REMOTE_PATHS);
    return {
      platform: "win32",
      available: !!exePath,
      path: exePath,
      remotePath: remotePath,
      tool: "digiCamControl"
    };
  }
  return { platform: process.platform, available: true, path: "gphoto2", tool: "gphoto2" };
});