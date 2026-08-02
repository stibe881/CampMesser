/**
 * Clientseitiges Verkleinern von Fotos vor dem Upload ins Reise-Tagebuch.
 *
 * Der Server transformiert bewusst nicht (keine sharp-Abhängigkeit auf dem
 * Webhosting) – deshalb rechnet der Browser das Bild per Canvas auf maximal
 * 1600 px Kantenlänge herunter und kodiert es als JPEG (~0.85). Nebeneffekt:
 * EXIF-Daten (inkl. GPS-Position) werden dabei entfernt.
 */

export const PHOTO_MAX_EDGE_PX = 1600;
export const PHOTO_JPEG_QUALITY = 0.85;

/**
 * Zielgrösse berechnen: die längste Kante wird auf maxEdge begrenzt,
 * das Seitenverhältnis bleibt erhalten, hochskaliert wird nie.
 * Reine Funktion – Unit-Tests in server/imageResize.test.ts.
 */
export function computeResizedDimensions(
  width: number,
  height: number,
  maxEdge: number
): { width: number; height: number } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    maxEdge <= 0
  ) {
    throw new Error("Ungültige Bildabmessungen");
  }
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longestEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Bild dekodieren – createImageBitmap, mit <img>-Fallback für ältere Browser. */
async function decodeImage(
  file: Blob
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fallback unten versuchen (manche Browser dekodieren via <img> mehr)
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht gelesen werden"));
    };
    img.src = url;
  });
}

/**
 * Foto für den Upload aufbereiten: verkleinern und als JPEG kodieren.
 * Wirft, wenn der Browser das Format nicht dekodieren kann (z. B. HEIC).
 */
export async function resizeImageForUpload(
  file: Blob,
  maxEdge: number = PHOTO_MAX_EDGE_PX,
  quality: number = PHOTO_JPEG_QUALITY
): Promise<Blob> {
  const source = await decodeImage(file);
  const sourceWidth =
    source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sourceHeight =
    source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const { width, height } = computeResizedDimensions(
    sourceWidth,
    sourceHeight,
    maxEdge
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D nicht verfügbar");
  context.drawImage(source, 0, 0, width, height);
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    source.close();
  }
  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Bild konnte nicht kodiert werden");
  return blob;
}
