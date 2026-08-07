/**
 * Der Campingplatz-Plan als Bild (#401, Nutzerwunsch 07.08.2026).
 *
 * DER PLAN AN DER REZEPTION ist das nützlichste Blatt des ganzen
 * Platzes – wo die Parzelle liegt, wo Duschen und Abwasch sind. Ein
 * Foto davon lag bisher irgendwo in der Galerie zwischen Sonnenuntergängen.
 * Jetzt hat es seinen festen Ort im Dossier.
 *
 * HÖCHSTENS EIN PLAN pro Platz, ein neuer ersetzt den alten – zwei
 * «aktuelle» Pläne wären einer zu viel. Gespeichert wird er über
 * dieselben Wege wie die Galerie-Fotos (spotPhotos mit kind «plan»),
 * damit Konto-Löschung und Papierkorb ihn automatisch mitnehmen.
 */
import { useRef, useState } from "react";
import { Map as MapIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/ConfirmDialog";
import { useI18n } from "@/i18n";
import { resizeImageForUpload } from "@/lib/imageResize";

export default function SitePlanCard({
  spotId,
  spotName,
  plan,
  onChanged,
  deletePhoto,
  className,
}: {
  spotId: number;
  spotName: string;
  plan: { id: number; fileName: string } | null;
  onChanged: () => void;
  deletePhoto: (photoId: number) => Promise<unknown>;
  className?: string;
}) {
  const { t } = useI18n();
  const sp = t.sitePlan;
  const ask = useConfirm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      let blob: Blob;
      try {
        blob = await resizeImageForUpload(file);
      } catch {
        toast.error(sp.readFailed);
        return;
      }
      const response = await fetch(`/api/spots/${spotId}/photos?kind=plan`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
        credentials: "include",
      });
      if (!response.ok) {
        toast.error(sp.uploadFailed);
        return;
      }
      toast.success(sp.uploaded);
      onChanged();
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!plan) return;
    if (!(await ask({ title: sp.deleteConfirm }))) return;
    try {
      await deletePhoto(plan.id);
      toast.success(sp.deleted);
      onChanged();
    } catch {
      toast.error(t.common.deleteFailed);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          {sp.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {plan ? (
          <button
            type="button"
            className="block w-full overflow-hidden rounded-lg border border-border"
            onClick={() => setOpen(true)}
            aria-label={sp.openAria(spotName)}
          >
            <img
              src={`/api/spots/photos/${plan.fileName}`}
              alt={sp.alt(spotName)}
              className="max-h-64 w-full object-cover"
              loading="lazy"
            />
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">{sp.empty}</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={e => void upload(e.target.files?.[0])}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {busy ? sp.uploading : plan ? sp.replace : sp.add}
          </Button>
          {plan && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => void remove()}
            >
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {sp.remove}
            </Button>
          )}
        </div>

        {/* Gross-Ansicht: Auf dem Plan sucht man eine Parzellen-Nummer –
            dafür muss er sich zoomen lassen, ein Daumennagel reicht nicht. */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
            <DialogHeader>
              <DialogTitle>{sp.title}</DialogTitle>
            </DialogHeader>
            {plan && (
              <img
                src={`/api/spots/photos/${plan.fileName}`}
                alt={sp.alt(spotName)}
                className="w-full"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
