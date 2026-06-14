/**
 * Session ID management for CS-X folder naming.
 */

export function getSessionFolderName(counter: number): string {
  return `CS-${counter}`;
}

export function getNextCounter(current: number): number {
  return current + 1;
}

/**
 * Converts a base64 dataURL to a Buffer for server-side file writing.
 */
export function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}

/**
 * Determines the file extension from a dataURL mime type.
 */
export function getExtensionFromDataUrl(dataUrl: string): string {
  const mime = dataUrl.split(";")[0].split(":")[1];
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mime] ?? "png";
}
