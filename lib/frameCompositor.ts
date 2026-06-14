import { FrameConfig, SlotConfig } from "@/store/usePhotoboothStore";

/**
 * Composites user photos behind a PNG frame on an offscreen canvas.
 *
 * Algorithm per slot:
 *   1. Convert percentage-based slot coords to pixel values.
 *   2. ctx.save() → create a clipping rect at (x, y, w, h).
 *   3. Calculate "cover" fit — scale the photo so it *completely fills*
 *      the slot while preserving aspect ratio (crop overflow).
 *   4. ctx.drawImage() the photo centered inside the slot.
 *   5. ctx.restore() to clear the clip.
 *   6. After all photos, draw the frame PNG at (0, 0) on top.
 *
 * @param photos  Array of dataURLs in slot order
 * @param frame   FrameConfig with slot coordinates (in percentages)
 * @param filter  CSS filter string to apply to photos
 * @returns       PNG dataURL of the composited result
 */
export async function compositeFrame(
  photos: string[],
  frame: FrameConfig,
  filter: "normal" | "grayscale" | "sepia" = "normal"
): Promise<string> {
  // Load frame image to get its natural pixel dimensions
  const frameImg = await loadImage(frame.dataUrl);
  
  // Clean green screen templates dynamically within slot boundaries (plus 12px bleed margin to clear edges)
  const processedFrame = processFrameChromaKey(frameImg, frame.slots, 12);

  const canvas = document.createElement("canvas");
  canvas.width = frameImg.naturalWidth;
  canvas.height = frameImg.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  // ── Draw each user photo into its slot (behind the frame) ─────────
  for (let i = 0; i < frame.slots.length; i++) {
    const photoSrc = photos[i];
    if (!photoSrc) continue;

    const slot: SlotConfig = frame.slots[i];

    // Slot rectangle in pixels (with 12px bleed to overlap behind frame borders)
    const bleed = 12;
    const slotX = (slot.x / 100) * canvas.width - bleed;
    const slotY = (slot.y / 100) * canvas.height - bleed;
    const slotW = (slot.width / 100) * canvas.width + bleed * 2;
    const slotH = (slot.height / 100) * canvas.height + bleed * 2;

    const photoImg = await loadImage(photoSrc);

    ctx.save();

    // Apply CSS-style filter
    if (filter === "grayscale") {
      ctx.filter = "grayscale(100%)";
    } else if (filter === "sepia") {
      ctx.filter = "sepia(80%)";
    } else {
      ctx.filter = "none";
    }

    // ── CLIP to the slot rectangle (including bleed) ─────────────
    ctx.beginPath();
    ctx.rect(slotX, slotY, slotW, slotH);
    ctx.clip();

    // ── COVER-FIT: scale photo to completely fill the slot ──────
    const photoAR = photoImg.naturalWidth / photoImg.naturalHeight;
    const slotAR = slotW / slotH;

    let drawW: number;
    let drawH: number;

    if (photoAR > slotAR) {
      // Photo is wider than slot → match height, overflow width
      drawH = slotH;
      drawW = slotH * photoAR;
    } else {
      // Photo is taller than slot → match width, overflow height
      drawW = slotW;
      drawH = slotW / photoAR;
    }

    // Center the scaled photo within the slot
    const drawX = slotX + (slotW - drawW) / 2;
    const drawY = slotY + (slotH - drawH) / 2;

    // Draw the full photo image at the calculated position
    // No source cropping needed — the clip region handles overflow
    ctx.drawImage(photoImg, 0, 0, photoImg.naturalWidth, photoImg.naturalHeight, drawX, drawY, drawW, drawH);

    ctx.restore(); // removes clip + filter
  }

  // ── Draw frame on top (preserves transparency / covers edges) ─────
  ctx.drawImage(processedFrame, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

/**
 * Scans the configured slot regions in a frame image and keys out bright green (chroma key) pixels,
 * making them fully transparent so photos behind them can show through.
 * Uses a bleed margin to expand detection and erase anti-aliased green borders.
 */
function processFrameChromaKey(
  frameImg: HTMLImageElement,
  slots: SlotConfig[],
  bleed: number = 12
): HTMLCanvasElement | HTMLImageElement {
  if (!slots || slots.length === 0) return frameImg;

  const canvas = document.createElement("canvas");
  canvas.width = frameImg.naturalWidth;
  canvas.height = frameImg.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(frameImg, 0, 0);

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let modified = false;

    for (const slot of slots) {
      // Convert percentage-based slot coords to pixel values
      const slotX = Math.floor((slot.x / 100) * canvas.width);
      const slotY = Math.floor((slot.y / 100) * canvas.height);
      const slotW = Math.floor((slot.width / 100) * canvas.width);
      const slotH = Math.floor((slot.height / 100) * canvas.height);

      // Expand detection bounds by bleed to clean up anti-aliased green borders
      const startX = Math.max(0, slotX - bleed);
      const startY = Math.max(0, slotY - bleed);
      const endX = Math.min(canvas.width, slotX + slotW + bleed);
      const endY = Math.min(canvas.height, slotY + slotH + bleed);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Skip if already transparent
          if (a === 0) continue;

          // Chroma key threshold for bright green screen slots (with lenient bounds for edge halos)
          if (g > 70 && g > r * 1.2 && g > b * 1.2) {
            data[idx + 3] = 0; // set alpha to 0
            modified = true;
          }
        }
      }
    }

    if (modified) {
      ctx.putImageData(imgData, 0, 0);
      return canvas;
    }
  } catch (err) {
    console.error("[chromaKey] Failed to clear green pixels from frame:", err);
  }

  return frameImg;
}

/**
 * Renders a single photo with filter applied, cover-fitted to given dimensions.
 * Used for individual frame generation (GIF frames, thumbnails).
 */
export async function renderPhotoWithFilter(
  photoDataUrl: string,
  filter: "normal" | "grayscale" | "sepia",
  width = 400,
  height = 300
): Promise<string> {
  const img = await loadImage(photoDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.save();
  if (filter === "grayscale") ctx.filter = "grayscale(100%)";
  if (filter === "sepia") ctx.filter = "sepia(80%)";

  // Cover-fit using source crop
  const { sx, sy, sw, sh } = coverFitSource(img, width, height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.9);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Returns the source crop rect for cover-fitting an image into target dimensions.
 * Used for the simpler "source crop" approach in renderPhotoWithFilter / GIF.
 */
function coverFitSource(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): { sx: number; sy: number; sw: number; sh: number } {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = targetW / targetH;

  let sw: number, sh: number, sx: number, sy: number;

  if (imgRatio > targetRatio) {
    // Image is wider than target — crop sides
    sh = img.naturalHeight;
    sw = sh * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    // Image is taller than target — crop top/bottom
    sw = img.naturalWidth;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  return { sx, sy, sw, sh };
}
