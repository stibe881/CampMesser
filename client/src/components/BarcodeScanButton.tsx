/**
 * Barcode-Scan für Kühlbox & Vorrat (#634): Ein Foto des Strichcodes
 * (Kamera-Feld mit capture) wird mit der nativen BarcodeDetector-API
 * gelesen, der Produktname kommt von OpenFoodFacts – der freien
 * Lebensmittel-Datenbank, ohne Schlüssel. Geräte ohne BarcodeDetector
 * (z. B. Firefox) sehen den Knopf gar nicht; unbekannte Codes bleiben
 * ehrlich «nicht gefunden», der Name lässt sich immer tippen.
 */
import { useRef, useState } from "react";
import { Loader2, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

/** Minimale Sicht auf die BarcodeDetector-API (noch ohne DOM-Typen). */
interface BarcodeDetectorLike {
  detect(source: ImageBitmap): Promise<{ rawValue: string }[]>;
}
interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

function barcodeDetector(): BarcodeDetectorLike | null {
  const ctor = (window as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector;
  if (!ctor) return null;
  try {
    return new ctor({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });
  } catch {
    return null;
  }
}

/** Produktname zu einem Strichcode von OpenFoodFacts holen. */
async function lookupProduct(code: string): Promise<string | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,quantity`
  );
  if (!response.ok) return null;
  const json = (await response.json()) as {
    status?: number;
    product?: { product_name?: string; quantity?: string };
  };
  const name = json.product?.product_name?.trim();
  if (json.status !== 1 || !name) return null;
  const quantity = json.product?.quantity?.trim();
  return quantity ? `${name} ${quantity}` : name;
}

export default function BarcodeScanButton({
  onProduct,
}: {
  /** Erkannter Produktname – landet im Namensfeld des Formulars. */
  onProduct: (name: string) => void;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  // Ohne API-Unterstützung gibt es den Knopf nicht – nichts Kaputtes zeigen
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) {
    return null;
  }

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const detector = barcodeDetector();
    if (!detector) return;
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close();
      const code = codes[0]?.rawValue;
      if (!code) {
        toast.error(t.food.scanNoCode);
        return;
      }
      const product = await lookupProduct(code);
      if (!product) {
        toast.error(t.food.scanUnknown(code));
        return;
      }
      onProduct(product);
    } catch {
      toast.error(t.food.scanFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={e => void handleFile(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        aria-label={t.food.scanAria}
        title={t.food.scanAria}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ScanBarcode className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </>
  );
}
