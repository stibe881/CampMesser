/**
 * Platz-Eigenschaften im Dossier (#92): Schatten, Sanitär, Lärm, WLAN …
 * als Chips, dazu der Bearbeiten-Dialog mit den Auswahl-Knöpfen pro
 * Merkmal. Aus SpotDetail.tsx herausgelöst (#458) – der Block hängt nur
 * am `attributesJson` des Platzes.
 */
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import SpotAttributeChips from "@/components/SpotAttributeChips";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  parseSpotAttributes,
  SPOT_ATTRIBUTES,
  type SpotAttributes,
} from "@shared/spotAttributes";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { pick } from "@shared/i18n";
import { cn } from "@/lib/utils";

export default function SpotAttributesCard({
  spotId,
  attributesJson,
  className,
}: {
  spotId: number;
  attributesJson: string | null;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const updateMutation = trpc.spots.update.useMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<SpotAttributes>({});

  const attributes = parseSpotAttributes(attributesJson);

  const openDialog = () => {
    setDraft(attributes);
    setDialogOpen(true);
  };

  const saveAttributes = () => {
    const json = Object.keys(draft).length > 0 ? JSON.stringify(draft) : null;
    updateMutation.mutate(
      { id: spotId, attributesJson: json },
      {
        onSuccess: () => {
          utils.spots.list.invalidate();
          setDialogOpen(false);
          toast.success(t.spotDetail.attributesSaved);
        },
        onError: () => toast.error(t.common.saveFailed),
      }
    );
  };

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal
              className="h-4 w-4 text-primary"
              aria-hidden="true"
            />
            {t.spotDetail.attributesTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(attributes).length > 0 ? (
            <SpotAttributeChips attributes={attributes} lang={lang} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t.spotDetail.attributesEmpty}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={openDialog}
          >
            {t.spotDetail.attributesEditButton}
          </Button>
        </CardContent>
      </Card>

      {/* Eigenschaften bearbeiten */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t.spotDetail.attributesDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {t.spotDetail.attributesDialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {SPOT_ATTRIBUTES.map(def => {
              const current = draft[def.key];
              return (
                <div key={def.key}>
                  <p className="mb-1.5 text-sm font-medium">
                    {pick(def.label, lang)}
                  </p>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label={t.spotDetail.attributeGroupAria(
                      pick(def.label, lang)
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setDraft(prev => {
                          const next = { ...prev };
                          delete next[def.key];
                          return next;
                        })
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        current === undefined
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={current === undefined}
                    >
                      {t.spotDetail.attributeUnset}
                    </button>
                    {def.values.map(value => (
                      <button
                        key={value.value}
                        type="button"
                        onClick={() =>
                          setDraft(prev => ({
                            ...prev,
                            [def.key]: value.value,
                          }))
                        }
                        className={cn(
                          "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                          current === value.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        aria-pressed={current === value.value}
                      >
                        {pick(value.label, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={saveAttributes}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
