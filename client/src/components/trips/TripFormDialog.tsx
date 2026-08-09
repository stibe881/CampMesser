/**
 * Erfassungs-Dialog «Neue Reise» / «Reise bearbeiten» (#483, aus Trips.tsx
 * herausgelöst – Muster wie SpotDetail #458): Der Dialog besitzt seinen
 * Formular-Zustand und seine add/update-Mutationen selbst; die Seite sagt
 * nur noch, OB er offen ist und WELCHE Reise er lädt.
 *
 * Beim Öffnen wird der Zustand aus der übergebenen Reise aufgebaut
 * (Bearbeiten) oder frisch geleert (Neu) – die ganze Normalisierung
 * (#485: Arten ohne Zeltplatz-Auswahl, #465: Koordinaten der Ortssuche)
 * lebt hier und nicht mehr verstreut in der Seite.
 */
import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { useTodayIso } from "@/lib/useTodayIso";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
import {
  normalizeTripKind,
  TRIP_KINDS,
  tripKindForm,
  tripKindLabel,
  type TripKind,
} from "@shared/tripKind";
import { cn } from "@/lib/utils";
import { packScenarios } from "@shared/packTemplates";
import { formatChf } from "@/lib/money";
import { pick } from "@shared/i18n";

/**
 * Passende Packvorlage je Reiseart (#517). Bewusst OHNE Camping und
 * Tagesausflug: Beim Camping ist «Solo oder Familie?» eine echte Frage
 * (die Auswahl in den Packlisten kann sie stellen, wir nicht), und der
 * Tagesausflug braucht selten eine Liste.
 */
const KIND_SCENARIO: Partial<Record<TripKind, string>> = {
  strand: "strand",
  hotel: "hotelferien",
  staedte: "staedtereise",
  wandern: "solo",
  velo: "velotour",
  // Das «Motorrad-Zelten»-Szenario gab es längst – jetzt findet es die
  // passende Reise-Art von selbst (Nutzerwunsch 09.08.2026)
  motorrad: "motorrad",
  wintersport: "wintersport",
};

/** Auswahl-Wert «freier Ort» (kein Zeltplatz-Favorit verknüpft). */
const FREE_LOCATION = "frei";

/** Zeltplatz-Favorit, so weit ihn das Formular braucht. */
interface FormSpot {
  id: number;
  name: string;
}

/** Packliste, so weit sie das Formular braucht. */
interface FormPackList {
  id: number;
  name: string;
  archivedAt: unknown;
}

/** Die Reise, die der Dialog zum Bearbeiten lädt. */
export interface TripFormTrip {
  id: number;
  role?: string | null;
  spotId: number | null;
  packListId: number | null;
  location: string | null;
  latitude?: number | null;
  longitude?: number | null;
  kind?: string | null;
  title: string | null;
  notes: string | null;
  startDate: string;
  endDate: string;
  rating: number | null;
  arrivalTime: string | null;
  departureTime: string | null;
  pitchNumber: string | null;
  wifiName: string | null;
  wifiPassword: string | null;
  pitchNotes: string | null;
}

/**
 * 5 klickbare Sterne als radiogroup – ein Klick auf den bereits gewählten
 * Stern wählt die Bewertung wieder ab (onChange(null)). Exportiert, weil
 * auch die Reiseliste (Trips.tsx) dieselben Sterne zeigt.
 */
export function StarRating({
  value,
  onChange,
  groupLabel,
  disabled,
  size = "md",
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
  groupLabel: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const starClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map(n => {
        const active = value !== null && n <= value;
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            aria-label={
              selected ? t.trips.removeRatingAria : t.trips.rateStarAria(n)
            }
            onClick={() => onChange(selected ? null : n)}
            className="rounded p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={cn(
                starClass,
                active
                  ? "fill-chart-1 text-chart-1"
                  : "text-muted-foreground/40"
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

export default function TripFormDialog({
  open,
  editing,
  spots,
  packLists,
  onClose,
  initialPlace = null,
}: {
  open: boolean;
  /** Zu bearbeitende Reise – null heisst «Neue Reise». */
  editing: TripFormTrip | null;
  spots: FormSpot[];
  packLists: FormPackList[];
  onClose: () => void;
  /**
   * Vorbelegter Ort (#562, «Reise hierhin planen» am Merkort): Name und
   * Koordinaten stehen beim Öffnen schon im Formular – nur bei «Neu».
   */
  initialPlace?: { name: string; lat: number; lng: number } | null;
}) {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const today = useTodayIso();

  const [spotChoice, setSpotChoice] = useState<string>(FREE_LOCATION);
  // "keine" = ohne Packliste, sonst Listen-ID
  const [packListChoice, setPackListChoice] = useState<string>("keine");
  const [form, setForm] = useState({
    location: "",
    title: "",
    notes: "",
    startDate: today,
    endDate: today,
    arrivalTime: "",
    departureTime: "",
    pitchNumber: "",
    wifiName: "",
    wifiPassword: "",
    pitchNotes: "",
  });
  /** Sterne-Bewertung des Eintrags (null = ohne Bewertung). */
  const [formRating, setFormRating] = useState<number | null>(null);
  /** Reise-Art (#460) – Camping ist der Normalfall dieser App. */
  const [formKind, setFormKind] = useState<TripKind>("camping");
  /**
   * Koordinaten des Freitext-Orts aus der Ortssuche (#465); null = keine
   * bestimmt. Wer den Ortstext von Hand ändert, verliert sie wieder – die
   * Koordinaten gehören zum GEWÄHLTEN Ort, nicht zum getippten Text.
   */
  const [formCoords, setFormCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  /** Treffer der Ortssuche; null = (noch) nicht gesucht. */
  const [placeResults, setPlaceResults] = useState<PlaceResult[] | null>(null);
  const [placeSearching, setPlaceSearching] = useState(false);
  /**
   * «Wer ist dabei?» (Reisepass #292): Ids der Personen, die bei DIESER
   * Reise fehlen. Gespeichert wird die Abwesenheit – ohne Antippen sind
   * alle dabei, wie es bei einer Familienreise der Normalfall ist.
   */
  const [absentIds, setAbsentIds] = useState<Set<number>>(new Set());
  /** Für welchen Dialog-Aufbau `absentIds` schon initialisiert ist. */
  const [absentInitFor, setAbsentInitFor] = useState<string | null>(null);

  const editingId = editing?.id ?? null;
  /** Mitglieds-Trip im Formular: Zeltplatz/Packliste bleiben unveränderbar. */
  const editingShared = editing?.role === "member";

  // Personen und bestehende Abwesenheiten – nur solange der Dialog offen
  // ist. Bei Mitglieds-Trips entfällt der Abschnitt: Die Personen gehören
  // zum Konto der Besitzerin/des Besitzers.
  const peopleQuery = trpc.family.children.list.useQuery(undefined, {
    enabled: open && !editingShared,
  });
  const absencesQuery = trpc.family.passport.absences.useQuery(undefined, {
    enabled: open && !editingShared,
  });
  const people = peopleQuery.data ?? [];

  /**
   * Merkorte (#537) als Orts-Vorschlag beim ANLEGEN einer Reise: Wer auf
   * der Karte Wunschziele gesammelt hat, soll sie hier nicht nochmals
   * eintippen. Nur bei neuen Reisen – beim Bearbeiten steht der Ort fest.
   */
  const savedPlacesQuery = trpc.savedPlaces.list.useQuery(undefined, {
    enabled: open && editingId === null,
  });
  const savedPlaces = savedPlacesQuery.data ?? [];

  /**
   * `absentIds` aufbauen, sobald die Abwesenheiten da sind: beim
   * Bearbeiten die gespeicherten dieser Reise, bei einer neuen Reise
   * leer (= alle dabei). Der Schlüssel verhindert, dass ein späteres
   * Nachladen die Auswahl der Nutzerin überschreibt.
   */
  useEffect(() => {
    if (!open) {
      setAbsentInitFor(null);
      return;
    }
    const key = editingId === null ? "neu" : String(editingId);
    if (absentInitFor === key) return;
    if (editingId !== null && absencesQuery.data === undefined) return;
    setAbsentIds(
      new Set(
        editingId === null
          ? []
          : (absencesQuery.data ?? [])
              .filter(a => a.tripId === editingId)
              .map(a => a.childId)
      )
    );
    setAbsentInitFor(key);
  }, [open, editingId, absencesQuery.data, absentInitFor]);

  /** Welche Felder das Formular für die gewählte Art zeigt (#485). */
  const kindForm = tripKindForm(formKind);
  // Kosten-Schätzung (#568): nur beim Anlegen, je gewählter Art
  const costHintQuery = trpc.trips.expenses.costHint.useQuery(
    { kind: formKind },
    { enabled: open && editingId === null, staleTime: 5 * 60_000 }
  );

  /**
   * Beim Öffnen den Zustand aufbauen: aus der Reise (Bearbeiten) oder
   * frisch (Neu). Hat die Art keine Zeltplatz-Auswahl (#485), hängt aber
   * (aus alter Zeit) ein Platz an der Reise, wird er zum sichtbaren
   * Freitext-Ort – sonst gäbe es im Formular gar kein Orts-Feld.
   */
  useEffect(() => {
    if (!open) return;
    if (editing) {
      const editKind = tripKindForm(normalizeTripKind(editing.kind));
      const keepSpot = editing.spotId != null && editKind.spotSelect;
      const freshSpotName =
        editing.spotId != null
          ? (spots.find(s => s.id === editing.spotId)?.name ?? null)
          : null;
      setSpotChoice(keepSpot ? String(editing.spotId) : FREE_LOCATION);
      setPackListChoice(
        editing.packListId != null ? String(editing.packListId) : "keine"
      );
      setForm({
        location:
          editing.location ??
          (editing.spotId != null && !keepSpot ? (freshSpotName ?? "") : ""),
        title: editing.title ?? "",
        notes: editing.notes ?? "",
        startDate: editing.startDate,
        endDate: editing.endDate,
        arrivalTime: editing.arrivalTime ?? "",
        departureTime: editing.departureTime ?? "",
        pitchNumber: editing.pitchNumber ?? "",
        wifiName: editing.wifiName ?? "",
        wifiPassword: editing.wifiPassword ?? "",
        pitchNotes: editing.pitchNotes ?? "",
      });
      setFormRating(editing.rating ?? null);
      setFormKind(normalizeTripKind(editing.kind));
      setFormCoords(
        editing.latitude != null && editing.longitude != null
          ? { lat: editing.latitude, lng: editing.longitude }
          : null
      );
      setPlaceResults(null);
    } else {
      setSpotChoice(FREE_LOCATION);
      setPackListChoice("keine");
      setForm({
        location: "",
        title: "",
        notes: "",
        startDate: today,
        endDate: today,
        arrivalTime: "",
        departureTime: "",
        pitchNumber: "",
        wifiName: "",
        wifiPassword: "",
        pitchNotes: "",
      });
      setFormRating(null);
      setFormKind("camping");
      setFormCoords(null);
      setPlaceResults(null);
    }
    // Vorbelegter Ort (#562): Der Merkort steht beim Öffnen im Formular –
    // Name als Freitext-Ort, Koordinaten wie ein Ortssuche-Treffer.
    if (!editing && initialPlace) {
      setForm(f => ({ ...f, location: initialPlace.name }));
      setFormCoords({ lat: initialPlace.lat, lng: initialPlace.lng });
    }
    // Nur beim Öffnen bzw. beim Wechsel der geladenen Reise neu aufbauen –
    // Tipp-Zwischenstände dürfen ein Re-Render nicht verlieren.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  const addMutation = trpc.trips.add.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      utils.family.passport.absences.invalidate();
      onClose();
      toast.success(t.trips.entrySaved);
    },
    onError: e => toast.error(e.message || t.trips.entrySaveFailed),
  });

  const updateMutation = trpc.trips.update.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      utils.family.passport.absences.invalidate();
      onClose();
      toast.success(t.trips.entryUpdated);
    },
    onError: e => toast.error(e.message || t.trips.entryUpdateFailed),
  });

  // Vorlagen-Vorschlag (#517): Liste aus der Szenario-Vorlage erstellen
  // und gleich mit der Reise verknüpfen.
  const suggestedScenario =
    !editingShared && packListChoice === "keine"
      ? (packScenarios.find(s => s.id === KIND_SCENARIO[formKind]) ?? null)
      : null;
  const createListMutation = trpc.packing.createList.useMutation({
    onSuccess: (data: { listId: number }) => {
      utils.packing.lists.invalidate();
      setPackListChoice(String(data.listId));
      toast.success(t.trips.templateListCreated);
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  /**
   * Art im Formular wechseln (#485): Felder, die es für die neue Art
   * nicht gibt, werden aufgeräumt statt unsichtbar mitgeschleppt – ein
   * verknüpfter Zeltplatz wird zum sichtbaren Freitext-Ort (nichts geht
   * verloren), beim Tagesausflug rückt die Abreise auf die Anreise.
   */
  const selectKind = (kind: TripKind) => {
    setFormKind(kind);
    const next = tripKindForm(kind);
    if (!next.spotSelect && spotChoice !== FREE_LOCATION) {
      const spotName = spots.find(s => String(s.id) === spotChoice)?.name ?? "";
      setSpotChoice(FREE_LOCATION);
      setForm(f => ({
        ...f,
        location: f.location.trim() ? f.location : spotName,
      }));
    }
    if (next.singleDay) {
      setForm(f => ({ ...f, endDate: f.startDate }));
    }
  };

  /** Ortssuche (#465): Treffer zur getippten Eingabe holen. */
  const runPlaceSearch = async () => {
    const query = form.location.trim();
    if (!query) return;
    setPlaceSearching(true);
    try {
      setPlaceResults(await searchPlaces(query, lang));
    } catch {
      toast.error(t.trips.locationSearchFailed);
    } finally {
      setPlaceSearching(false);
    }
  };

  /** Treffer übernehmen: Name wird zum Ort, Koordinaten bleiben daran. */
  const pickPlace = (place: PlaceResult) => {
    setForm(f => ({ ...f, location: place.name }));
    setFormCoords({ lat: place.latitude, lng: place.longitude });
    setPlaceResults(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {editingId !== null
              ? t.trips.editEntryTitle
              : t.trips.newTripButton}
          </DialogTitle>
          <DialogDescription>{t.trips.tripFormDialogDesc}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={e => {
            e.preventDefault();
            if (editingShared && editing) {
              // Mitglieds-Trip: Zeltplatz-/Packlisten-Verknüpfung bleibt
              // unverändert (gehört der Besitzerin/dem Besitzer)
              if (editing.spotId === null && !form.location.trim()) {
                toast.error(t.trips.choosePlaceError);
                return;
              }
              updateMutation.mutate({
                id: editing.id,
                spotId: editing.spotId,
                packListId: editing.packListId,
                location:
                  editing.spotId === null
                    ? form.location.trim()
                    : editing.location,
                latitude: formCoords?.lat ?? null,
                longitude: formCoords?.lng ?? null,
                kind: formKind,
                title: form.title.trim() || null,
                notes: form.notes.trim() || null,
                startDate: form.startDate,
                endDate: form.endDate,
                rating: formRating,
                arrivalTime: form.arrivalTime || null,
                departureTime: form.departureTime || null,
                pitchNumber: form.pitchNumber.trim() || null,
                wifiName: form.wifiName.trim() || null,
                wifiPassword: form.wifiPassword.trim() || null,
                pitchNotes: form.pitchNotes.trim() || null,
              });
              return;
            }
            // Ohne Zeltplatz-Auswahl für diese Art (#485) zählt nur der Ort
            const spotId =
              !kindForm.spotSelect || spotChoice === FREE_LOCATION
                ? null
                : Number(spotChoice);
            if (spotId === null && !form.location.trim()) {
              toast.error(t.trips.choosePlaceError);
              return;
            }
            const payload = {
              spotId,
              packListId:
                packListChoice === "keine" ? null : Number(packListChoice),
              location: spotId === null ? form.location.trim() : null,
              latitude: spotId === null ? (formCoords?.lat ?? null) : null,
              longitude: spotId === null ? (formCoords?.lng ?? null) : null,
              kind: formKind,
              title: form.title.trim() || null,
              notes: form.notes.trim() || null,
              startDate: form.startDate,
              endDate: form.endDate,
              rating: formRating,
              arrivalTime: form.arrivalTime || null,
              departureTime: form.departureTime || null,
              pitchNumber: form.pitchNumber.trim() || null,
              wifiName: form.wifiName.trim() || null,
              wifiPassword: form.wifiPassword.trim() || null,
              pitchNotes: form.pitchNotes.trim() || null,
              // Nur mitschicken, wenn es Personen gibt – sonst gäbe es
              // nichts zu speichern und nichts zu löschen
              ...(people.length > 0
                ? { absentChildIds: Array.from(absentIds) }
                : {}),
            };
            if (editingId !== null) {
              updateMutation.mutate({ id: editingId, ...payload });
            } else {
              addMutation.mutate(payload);
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Zeltplatz/Packliste gehören der Besitzerin/dem Besitzer –
                beim Bearbeiten eines Mitglieds-Trips ausgeblendet.
                Die Zeltplatz-Auswahl gibt es nur für Arten, die dort
                schlafen (#485) – bei Hotelferien zählt der Ort. */}
            {!editingShared && kindForm.spotSelect && (
              <div>
                <Label htmlFor="trip-spot">{t.trips.placeLabel}</Label>
                <Select value={spotChoice} onValueChange={setSpotChoice}>
                  <SelectTrigger id="trip-spot" className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FREE_LOCATION}>
                      {t.trips.freeLocationOption}
                    </SelectItem>
                    {spots.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(editingShared
              ? editing?.spotId === null
              : spotChoice === FREE_LOCATION) && (
              <div>
                <Label htmlFor="trip-location">
                  {t.trips.locationNameLabel}
                </Label>
                <Input
                  id="trip-location"
                  className="mt-1.5"
                  placeholder={t.trips.locationPlaceholder}
                  value={form.location}
                  onChange={e => {
                    // Von Hand geändert → die Koordinaten des vorher
                    // gewählten Orts gelten nicht mehr (#465)
                    setFormCoords(null);
                    setForm(f => ({ ...f, location: e.target.value }));
                  }}
                />
                {/* Ortssuche (#465): macht aus dem Freitext einen Ort
                    MIT Koordinaten – damit Hotel-, Strand- und
                    Städtereisen Wetter und Heute-Ansicht bekommen. */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!form.location.trim() || placeSearching}
                    onClick={() => void runPlaceSearch()}
                  >
                    <Search className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    {t.trips.locationSearchButton}
                  </Button>
                  {formCoords && (
                    <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {t.trips.locationCoordsSet}
                      <button
                        type="button"
                        onClick={() => setFormCoords(null)}
                        aria-label={t.trips.locationCoordsClearAria}
                        className="ml-0.5 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                </div>
                {placeResults !== null &&
                  (placeResults.length === 0 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t.trips.locationSearchNoResults}
                    </p>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {placeResults.map(place => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => pickPlace(place)}
                          className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {place.name}
                          {place.region && (
                            <span className="text-xs"> · {place.region}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                {/* Merkorte (#537): Klick übernimmt Name UND Koordinaten */}
                {editingId === null && savedPlaces.length > 0 && (
                  <div className="mt-1.5">
                    <p className="text-xs text-muted-foreground">
                      {t.trips.savedPlacesSuggestTitle}
                    </p>
                    <div
                      className="mt-1 flex flex-wrap gap-1.5"
                      role="group"
                      aria-label={t.trips.savedPlacesSuggestTitle}
                    >
                      {savedPlaces.slice(0, 6).map(place => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => {
                            setForm(f => ({ ...f, location: place.name }));
                            setFormCoords({
                              lat: place.latitude,
                              lng: place.longitude,
                            });
                            setPlaceResults(null);
                          }}
                          className="rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground transition-colors hover:opacity-80"
                        >
                          {place.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!editingShared && (
              <div>
                <Label htmlFor="trip-packlist">{t.trips.packListLabel}</Label>
                <Select
                  value={packListChoice}
                  onValueChange={setPackListChoice}
                >
                  <SelectTrigger id="trip-packlist" className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keine">{t.trips.noPackList}</SelectItem>
                    {/* Archivierte Packlisten (#194) tauchen in der
                        Auswahl nicht auf – bereits verknüpfte bleiben
                        aber wählbar, damit nichts stillschweigend abfällt */}
                    {packLists
                      .filter(
                        l =>
                          l.archivedAt == null ||
                          String(l.id) === packListChoice
                      )
                      .map(l => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {suggestedScenario && (
                  <button
                    type="button"
                    disabled={createListMutation.isPending}
                    onClick={() =>
                      createListMutation.mutate({
                        name: pick(suggestedScenario.label, lang),
                        scenario: suggestedScenario.id,
                        lang,
                      })
                    }
                    className="mt-1.5 text-left text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {t.trips.templateSuggest(
                      pick(suggestedScenario.label, lang)
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          {/* Reise-Art (#460): steuert, was die Heute-Ansicht während
              der Reise in den Vordergrund stellt – sortieren und
              vorschlagen, nie sperren. */}
          <div>
            <p className="text-sm font-medium">{t.trips.kindLabel}</p>
            <div
              className="mt-1.5 flex flex-wrap gap-1.5"
              role="group"
              aria-label={t.trips.kindLabel}
            >
              {TRIP_KINDS.map(kind => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => selectKind(kind)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    formKind === kind
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={formKind === kind}
                >
                  {tripKindLabel(kind, lang)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.trips.kindHint}
            </p>
            {/* Kosten-Schätzung (#568): der Median der eigenen Reisen
                gleicher Art – ehrlich erst ab zwei vergleichbaren. */}
            {editingId === null && costHintQuery.data && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t.trips.costHintLine(
                  `${formatChf(costHintQuery.data.perNightRappen, lang)} CHF`,
                  costHintQuery.data.tripCount
                )}
              </p>
            )}
          </div>
          {/* «Wer ist dabei?» (Reisepass #292): angetippt = dabei. Die
              Auswahl speichert die Abwesenheiten, aus denen die Pässe
              ihre Stempel ableiten – nichts wird doppelt erfasst. */}
          {!editingShared && people.length > 0 && (
            <div>
              <p className="text-sm font-medium">{t.trips.whoAlongTitle}</p>
              <div
                className="mt-1.5 flex flex-wrap gap-1.5"
                role="group"
                aria-label={t.trips.whoAlongTitle}
              >
                {people.map(person => {
                  const along = !absentIds.has(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() =>
                        setAbsentIds(prev => {
                          const next = new Set(prev);
                          if (along) next.add(person.id);
                          else next.delete(person.id);
                          return next;
                        })
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        along
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground line-through hover:text-foreground"
                      )}
                      aria-pressed={along}
                      aria-label={t.trips.whoAlongPersonAria(person.name)}
                    >
                      {person.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.trips.whoAlongHint}
              </p>
            </div>
          )}
          <div
            className={cn("grid gap-3", !kindForm.singleDay && "grid-cols-2")}
          >
            <div>
              <Label htmlFor="trip-start">
                {/* Tagesausflug (#485): EIN Tag, also «Datum» statt
                    «Anreise» – eine getrennte Abreise wäre eine
                    Fangfrage. */}
                {kindForm.singleDay ? t.trips.dayLabel : t.trips.arrivalLabel}
              </Label>
              <Input
                id="trip-start"
                className="mt-1.5"
                type="date"
                value={form.startDate}
                max={kindForm.singleDay ? undefined : form.endDate}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    startDate: e.target.value,
                    // Abreise nachziehen: beim Tagesausflug immer gleich,
                    // sonst nur, wenn sie vor der Anreise läge
                    endDate: kindForm.singleDay
                      ? e.target.value
                      : f.endDate < e.target.value
                        ? e.target.value
                        : f.endDate,
                  }))
                }
                required
              />
            </div>
            {!kindForm.singleDay && (
              <div>
                <Label htmlFor="trip-end">{t.trips.departureLabel}</Label>
                <Input
                  id="trip-end"
                  className="mt-1.5"
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={e =>
                    setForm(f => ({ ...f, endDate: e.target.value }))
                  }
                  required
                />
              </div>
            )}
          </div>
          {/* Optionale Uhrzeiten – passend zu den Check-in-Zeiten des Platzes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="trip-start-time">
                {t.trips.arrivalTimeLabel}
              </Label>
              <Input
                id="trip-start-time"
                className="mt-1.5"
                type="time"
                value={form.arrivalTime}
                onChange={e =>
                  setForm(f => ({ ...f, arrivalTime: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="trip-end-time">
                {t.trips.departureTimeLabel}
              </Label>
              <Input
                id="trip-end-time"
                className="mt-1.5"
                type="time"
                value={form.departureTime}
                onChange={e =>
                  setForm(f => ({ ...f, departureTime: e.target.value }))
                }
              />
            </div>
          </div>
          {/* Stellplatz-Details (#252): gelten für diesen Aufenthalt.
              Nur für Arten mit Platz (#485) – im Hotel gibt es keine
              Parzellennummer. Gespeicherte Werte bleiben beim Umschalten
              erhalten, die Felder sind nur ausgeblendet. */}
          {(kindForm.pitchDetails || kindForm.hotelDetails) && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium">
                {kindForm.hotelDetails
                  ? t.trips.hotelSectionTitle
                  : t.trips.pitchSectionTitle}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {kindForm.hotelDetails
                  ? t.trips.hotelSectionHint
                  : t.trips.pitchSectionHint}
              </p>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="trip-pitch-number">
                    {kindForm.hotelDetails
                      ? t.trips.hotelRoomLabel
                      : t.trips.pitchNumberLabel}
                  </Label>
                  <Input
                    id="trip-pitch-number"
                    className="mt-1.5"
                    maxLength={40}
                    placeholder={
                      kindForm.hotelDetails
                        ? t.trips.hotelRoomPlaceholder
                        : t.trips.pitchNumberPlaceholder
                    }
                    value={form.pitchNumber}
                    onChange={e =>
                      setForm(f => ({ ...f, pitchNumber: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="trip-wifi-name">
                    {t.trips.wifiNameLabel}
                  </Label>
                  <Input
                    id="trip-wifi-name"
                    className="mt-1.5"
                    maxLength={80}
                    placeholder={t.trips.wifiNamePlaceholder}
                    value={form.wifiName}
                    onChange={e =>
                      setForm(f => ({ ...f, wifiName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="trip-wifi-password">
                  {t.trips.wifiPasswordLabel}
                </Label>
                <Input
                  id="trip-wifi-password"
                  className="mt-1.5"
                  maxLength={80}
                  placeholder={t.trips.wifiPasswordPlaceholder}
                  value={form.wifiPassword}
                  onChange={e =>
                    setForm(f => ({ ...f, wifiPassword: e.target.value }))
                  }
                />
              </div>
              <div className="mt-3">
                <Label htmlFor="trip-pitch-notes">
                  {t.trips.pitchNotesLabel}
                </Label>
                <Textarea
                  id="trip-pitch-notes"
                  className="mt-1.5"
                  rows={2}
                  placeholder={t.trips.pitchNotesPlaceholder}
                  value={form.pitchNotes}
                  onChange={e =>
                    setForm(f => ({ ...f, pitchNotes: e.target.value }))
                  }
                />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="trip-title">{t.trips.titleLabel}</Label>
            <Input
              id="trip-title"
              className="mt-1.5"
              placeholder={t.trips.titlePlaceholder}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="trip-notes">{t.trips.notesLabel}</Label>
            <Textarea
              id="trip-notes"
              className="mt-1.5"
              rows={3}
              placeholder={t.trips.notesPlaceholder}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div>
            <Label>{t.trips.ratingLabel}</Label>
            <div className="mt-1.5">
              <StarRating
                value={formRating}
                onChange={setFormRating}
                groupLabel={t.trips.ratingFormAria}
              />
            </div>
          </div>
          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {editingId !== null ? (
                <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              {addMutation.isPending || updateMutation.isPending
                ? t.common.saving
                : editingId !== null
                  ? t.trips.saveChanges
                  : t.trips.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
