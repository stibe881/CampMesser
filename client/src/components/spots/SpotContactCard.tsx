/**
 * Kontakt & Check-in im Platz-Dossier (#152): Rezeptions-Telefon,
 * Check-in-Zeiten und Parzellen-Nummer – Karte und Bearbeiten-Dialog in
 * einem Baustein. Aus SpotDetail.tsx herausgelöst (#458): Die Seite war
 * auf über 1700 Zeilen angewachsen, und dieser Block hängt nur an vier
 * Feldern des Platzes, nicht am Rest des Dossiers.
 */
import { useState } from "react";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

export default function SpotContactCard({
  spot,
  className,
}: {
  spot: {
    id: number;
    name: string;
    receptionPhone: string | null;
    checkinInfo: string | null;
    parcelNumber: string | null;
  };
  className?: string;
}) {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const updateMutation = trpc.spots.update.useMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({ phone: "", checkin: "", parcel: "" });

  const openDialog = () => {
    setDraft({
      phone: spot.receptionPhone ?? "",
      checkin: spot.checkinInfo ?? "",
      parcel: spot.parcelNumber ?? "",
    });
    setDialogOpen(true);
  };

  const saveContact = () => {
    updateMutation.mutate(
      {
        id: spot.id,
        receptionPhone: draft.phone,
        checkinInfo: draft.checkin,
        parcelNumber: draft.parcel,
      },
      {
        onSuccess: () => {
          utils.spots.list.invalidate();
          setDialogOpen(false);
          toast.success(t.spotDetail.contactSaved);
        },
        onError: () => toast.error(t.common.saveFailed),
      }
    );
  };

  /** Etwas zum Anzeigen? Sonst zeigt die Karte den Leer-Hinweis. */
  const hasContact = Boolean(
    spot.receptionPhone || spot.checkinInfo || spot.parcelNumber
  );

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.spotDetail.contactTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasContact ? (
            <dl className="space-y-2 text-sm">
              {spot.receptionPhone && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="w-36 shrink-0 text-muted-foreground">
                    {t.spotDetail.contactPhoneLabel}
                  </dt>
                  <dd>
                    <a
                      href={`tel:${spot.receptionPhone.replace(/[^+\d]/g, "")}`}
                      className="font-medium text-primary hover:underline"
                      aria-label={t.spotDetail.contactPhoneAria(spot.name)}
                    >
                      {spot.receptionPhone}
                    </a>
                  </dd>
                </div>
              )}
              {spot.checkinInfo && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="w-36 shrink-0 text-muted-foreground">
                    {t.spotDetail.contactCheckinLabel}
                  </dt>
                  <dd>{spot.checkinInfo}</dd>
                </div>
              )}
              {spot.parcelNumber && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <dt className="w-36 shrink-0 text-muted-foreground">
                    {t.spotDetail.contactParcelLabel}
                  </dt>
                  <dd>{spot.parcelNumber}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.contactEmpty}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={openDialog}
          >
            {t.spotDetail.contactEditButton}
          </Button>
        </CardContent>
      </Card>

      {/* Kontakt & Check-in bearbeiten (Muster Eigenschaften-Dialog) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t.spotDetail.contactDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {t.spotDetail.contactDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">
                {t.spotDetail.contactPhoneLabel}
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                maxLength={40}
                value={draft.phone}
                onChange={e =>
                  setDraft(prev => ({ ...prev, phone: e.target.value }))
                }
                placeholder={t.spotDetail.contactPhonePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-checkin">
                {t.spotDetail.contactCheckinLabel}
              </Label>
              <Input
                id="contact-checkin"
                maxLength={120}
                value={draft.checkin}
                onChange={e =>
                  setDraft(prev => ({ ...prev, checkin: e.target.value }))
                }
                placeholder={t.spotDetail.contactCheckinPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-parcel">
                {t.spotDetail.contactParcelLabel}
              </Label>
              <Input
                id="contact-parcel"
                maxLength={40}
                value={draft.parcel}
                onChange={e =>
                  setDraft(prev => ({ ...prev, parcel: e.target.value }))
                }
                placeholder={t.spotDetail.contactParcelPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={saveContact} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
