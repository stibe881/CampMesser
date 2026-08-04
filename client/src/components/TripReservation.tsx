/**
 * Reservation ablegen (#279): Buchungsbestätigung als Foto oder PDF an
 * der Reise.
 *
 * Die Bestätigung liegt sonst im Mail-Postfach – und genau dort kommt man
 * an der Schranke um 22 Uhr ohne Empfang nicht heran. Deshalb hängt sie
 * hier an der Reise, und der Service Worker legt die einmal geöffnete
 * Datei in einen eigenen Cache.
 *
 * Bilder werden vor dem Hochladen verkleinert (dasselbe Muster wie bei
 * den Reise-Fotos), PDF gehen unverändert durch – ein PDF zu
 * «verkleinern» kann der Browser nicht, und die Schrift soll lesbar
 * bleiben.
 */
import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { resizeImageForUpload } from "@/lib/imageResize";
import { cn } from "@/lib/utils";
import { MAX_RESERVATION_BYTES, isPdfReservation } from "@shared/reservations";

export default function TripReservation({
  tripId,
  fileName,
  className,
}: {
  tripId: number;
  fileName: string | null;
  className?: string;
}) {
  const { t } = useI18n();
  const tr = t.reservation;
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const removeMutation = trpc.trips.removeReservation.useMutation({
    onSuccess: () => void utils.trips.list.invalidate(),
    onError: () => toast.error(tr.removeFailed),
  });

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const isPdf = file.type === "application/pdf";
      // Bilder verkleinern, PDF unverändert lassen
      const body: Blob = isPdf ? file : await resizeImageForUpload(file);
      if (body.size > MAX_RESERVATION_BYTES) {
        toast.error(tr.tooLarge);
        return;
      }
      const res = await fetch(`/api/trips/${tripId}/reservation`, {
        method: "POST",
        headers: { "Content-Type": isPdf ? "application/pdf" : body.type },
        body,
        credentials: "include",
      });
      if (!res.ok) throw new Error(String(res.status));
      await utils.trips.list.invalidate();
      toast.success(tr.uploaded);
    } catch {
      toast.error(tr.uploadFailed);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const href = fileName ? `/api/trips/reservations/${fileName}` : null;
  const pdf = fileName ? isPdfReservation(fileName) : false;

  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-3", className)}
    >
      <p className="text-sm font-medium">{tr.title}</p>

      {href ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {pdf ? (
              <FileText className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
            )}
            {pdf ? tr.openPdf : tr.openImage}
          </a>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeMutation.mutate({ tripId })}
            disabled={removeMutation.isPending}
            aria-label={tr.removeAria}
          >
            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">{tr.empty}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {fileName ? tr.replace : tr.add}
      </Button>

      <p className="mt-2 text-xs text-muted-foreground">{tr.offlineNote}</p>
    </div>
  );
}
