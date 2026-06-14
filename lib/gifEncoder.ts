import GIF from "gif.js";

/**
 * Generates an animated GIF from an array of image dataURLs.
 * Uses gif.js with its Web Worker for non-blocking encoding.
 */
export async function generateGif(
  frameDataUrls: string[],
  options: {
    delay?: number;      // ms per frame (default 600)
    width?: number;      // output width (default 480)
    height?: number;     // output height (default 360)
    quality?: number;    // 1 (best) – 30 (fastest) (default 8)
    repeat?: number;     // 0 = loop forever, -1 = no repeat
    filter?: "normal" | "grayscale" | "sepia";
  } = {}
): Promise<{ blobUrl: string; dataUrl: string }> {
  const {
    delay = 600,
    width = 480,
    height = 360,
    quality = 8,
    repeat = 0,
    filter = "normal",
  } = options;

  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality,
      width,
      height,
      workerScript: "/gif.worker.js",
      repeat,
    });

    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });

    // Process frames sequentially then encode
    (async () => {
      try {
        for (const dataUrl of frameDataUrls) {
          const img = await loadImage(dataUrl);

          // Draw to canvas to resize + apply to GIF
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;

          // Cover-fit
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const targetRatio = width / height;
          let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
          if (imgRatio > targetRatio) {
            sw = sh * targetRatio;
            sx = (img.naturalWidth - sw) / 2;
          } else {
            sh = sw / targetRatio;
            sy = (img.naturalHeight - sh) / 2;
          }

          ctx.save();
          if (filter === "grayscale") {
            ctx.filter = "grayscale(100%)";
          } else if (filter === "sepia") {
            ctx.filter = "sepia(80%)";
          } else {
            ctx.filter = "none";
          }

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
          ctx.restore();
          gif.addFrame(canvas, { delay, copy: true });
        }

        gif.on("finished", (blob: Blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              blobUrl,
              dataUrl: reader.result as string,
            });
          };
          reader.readAsDataURL(blob);
        });

        gif.render();
      } catch (err) {
        reject(err);
      }
    })();
  });
}
