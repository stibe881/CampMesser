/**
 * Reise-Vorlagen (#284): «Wochenende», «Sommerferien» und Verwandte in
 * einem Schritt anlegen – Zeitraum, Packliste und Menüplan.
 *
 * Die Vorlage entscheidet über die Dauer; der Abreisetag wird daraus
 * gerechnet und VOR dem Anlegen angezeigt. Wer eine Woche wählt und den
 * 12. Juni einträgt, soll «bis 19. Juni» lesen können, bevor er tippt.
 *
 * Packliste und Menüplan lassen sich einzeln abwählen: Wer schon eine
 * Liste hat, will keine zweite; wer unterwegs entscheidet, was es gibt,
 * will keinen vorgefüllten Plan. Gerechnet und geschrieben wird alles
 * serverseitig (trips.createFromTemplate).
 */
import { useState } from "react";
import {
  Backpack,
  Bookmark,
  Building2,
  CalendarDays,
  CalendarRange,
  Footprints,
  LayoutTemplate,
  Route,
  Sun,
  Trash2,
  Umbrella,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { templateEndDate, tripTemplates } from "@shared/tripTemplates";
import { tripKindForm, tripKindLabel } from "@shared/tripKind";

/** Symbol je Vorlage – der Name steht als String in den Daten. */
const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  CalendarDays,
  CalendarRange,
  Backpack,
  Sun,
  Building2,
  Umbrella,
  Footprints,
  Route,
};

/** Heute als ISO-Tag (lokale Zeitzone, nicht UTC). */
function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export default function TripTemplatePicker({
  spots,
  className,
}: {
  spots: { id: number; name: string }[];
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tt = t.tripTemplates;
  const utils = trpc.useUtils();
  const ask = useConfirm();

  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(tripTemplates[0].id);
  const [startDate, setStartDate] = useState(todayIso());
  const [spotId, setSpotId] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [withPackList, setWithPackList] = useState(true);
  const [withMenu, setWithMenu] = useState(true);

  const template =
    tripTemplates.find(x => x.id === templateId) ?? tripTemplates[0];
  const endDate = templateEndDate(startDate, template.nights);

  // Eigene Vorlagen (#628): gespeicherte Reisen als Ein-Klick-Vorlage –
  // angewendet mit dem oben gewählten Anreisetag.
  const ownQuery = trpc.trips.ownTemplates.list.useQuery(undefined, {
    enabled: open,
    staleTime: 60_000,
  });
  const ownCreateMutation = trpc.trips.ownTemplates.createTrip.useMutation({
    onSuccess: () => {
      void utils.trips.list.invalidate();
      setOpen(false);
      toast.success(tt.ownCreated);
    },
    onError: error => toast.error(error.message || tt.createFailed),
  });
  const ownRemoveMutation = trpc.trips.ownTemplates.remove.useMutation({
    onSuccess: () => void utils.trips.ownTemplates.list.invalidate(),
    onError: () => toast.error(t.common.actionFailed),
  });

  const createMutation = trpc.trips.createFromTemplate.useMutation({
    onSuccess: result => {
      void utils.trips.list.invalidate();
      void utils.packing.lists.invalidate();
      setOpen(false);
      toast.success(
        tt.created(
          result.endDate,
          result.menuEntries,
          result.packListId != null
        )
      );
    },
    onError: error => toast.error(error.message || tt.createFailed),
  });

  const formatDay = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "numeric",
      month: "long",
    });

  const submit = () => {
    if (spotId === null && !location.trim()) {
      toast.error(tt.placeMissing);
      return;
    }
    createMutation.mutate({
      templateId: template.id,
      startDate,
      spotId,
      location: spotId === null ? location.trim() : null,
      withPackList,
      withMenu,
      lang,
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className={className}
        onClick={() => setOpen(true)}
      >
        <LayoutTemplate className="mr-1.5 h-5 w-5" aria-hidden="true" />
        {tt.button}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{tt.title}</DialogTitle>
            <DialogDescription>{tt.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Vorlage wählen */}
            <div className="grid gap-2 sm:grid-cols-2">
              {tripTemplates.map(entry => {
                const Icon = TEMPLATE_ICONS[entry.icon] ?? CalendarDays;
                const active = entry.id === template.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setTemplateId(entry.id);
                      // Ohne Zeltplatz-Auswahl für diese Art (#485) darf
                      // kein unsichtbar gewählter Platz hängenbleiben
                      if (!tripKindForm(entry.kind).spotSelect) {
                        setSpotId(null);
                      }
                    }}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-primary bg-accent"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <span className="flex flex-wrap items-center gap-2 font-semibold">
                      <Icon
                        className="h-4 w-4 text-primary"
                        aria-hidden="true"
                      />
                      {pick(entry.title, lang)}
                      {/* Reise-Art der Vorlage (#463) – Camping ist der
                          Normalfall und braucht kein Etikett */}
                      {entry.kind !== "camping" && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          {tripKindLabel(entry.kind, lang)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                      {tt.nights(entry.nights)}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {pick(entry.description, lang)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Eigene Vorlagen (#628): gespeicherte Reisen – «Anwenden»
                nutzt den unten gewählten Anreisetag. */}
            {(ownQuery.data ?? []).length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold">{tt.ownSection}</p>
                <ul className="space-y-1.5">
                  {(ownQuery.data ?? []).map(own => (
                    <li
                      key={own.id}
                      className="flex items-center gap-2 rounded-xl border border-border bg-card p-3"
                    >
                      <Bookmark
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {own.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tt.nights(own.nights)}
                          {own.stages.length > 0 &&
                            ` · ${tt.ownStages(own.stages.length)}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={ownCreateMutation.isPending}
                        onClick={() =>
                          ownCreateMutation.mutate({
                            templateId: own.id,
                            startDate,
                          })
                        }
                      >
                        {tt.ownApply}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        disabled={ownRemoveMutation.isPending}
                        onClick={async () => {
                          if (
                            await ask({ title: tt.ownDeleteConfirm(own.name) })
                          ) {
                            ownRemoveMutation.mutate({ id: own.id });
                          }
                        }}
                        aria-label={tt.ownDeleteAria(own.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <Label htmlFor="template-start">{tt.startLabel}</Label>
              <Input
                id="template-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {tt.endLine(formatDay(endDate))}
              </p>
            </div>

            {/* Zeltplatz nur für Arten, die dort schlafen (#485) */}
            {spots.length > 0 && tripKindForm(template.kind).spotSelect && (
              <div>
                <Label htmlFor="template-spot">{tt.spotLabel}</Label>
                <select
                  id="template-spot"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={spotId === null ? "" : String(spotId)}
                  onChange={e =>
                    setSpotId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">{tt.spotFree}</option>
                  {spots.map(spot => (
                    <option key={spot.id} value={spot.id}>
                      {spot.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {spotId === null && (
              <div>
                <Label htmlFor="template-location">{tt.locationLabel}</Label>
                <Input
                  id="template-location"
                  value={location}
                  maxLength={140}
                  placeholder={tt.locationPlaceholder}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="template-packlist" className="text-sm">
                  {tt.withPackList}
                </Label>
                <Switch
                  id="template-packlist"
                  checked={withPackList}
                  onCheckedChange={setWithPackList}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="template-menu" className="text-sm">
                  {tt.withMenu}
                </Label>
                <Switch
                  id="template-menu"
                  checked={withMenu}
                  onCheckedChange={setWithMenu}
                />
              </div>
              <p className="text-xs text-muted-foreground">{tt.menuNote}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={submit} disabled={createMutation.isPending}>
              {createMutation.isPending ? t.common.saving : tt.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
