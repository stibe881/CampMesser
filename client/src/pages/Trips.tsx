import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Loader2,
  MapPin,
  Moon,
  Plus,
  Tent,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { computeTripStats, tripNights } from "@shared/trips";

/** Auswahlwert für «Ort frei eintragen» im Zeltplatz-Select. */
const FREE_LOCATION = "frei";

function formatRange(startDate: string, endDate: string): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("de-CH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

export default function TripsPage() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const spotsQuery = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const today = new Date().toISOString().slice(0, 10);
  const [spotChoice, setSpotChoice] = useState<string>(FREE_LOCATION);
  const [form, setForm] = useState({
    location: "",
    title: "",
    notes: "",
    startDate: today,
    endDate: today,
  });

  const addMutation = trpc.trips.add.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      setForm(f => ({ ...f, location: "", title: "", notes: "" }));
      toast.success("Eintrag gespeichert");
    },
    onError: e =>
      toast.error(e.message || "Eintrag konnte nicht gespeichert werden"),
  });

  const removeMutation = trpc.trips.remove.useMutation({
    onSuccess: () => utils.trips.list.invalidate(),
    onError: () => toast.error("Löschen fehlgeschlagen"),
  });

  const spots = spotsQuery.data ?? [];
  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data]);

  /** Anzeigename eines Eintrags: verknüpfter Favorit, sonst Freitext-Ort. */
  const placeName = (trip: (typeof trips)[number]): string => {
    if (trip.spotId != null) {
      const spot = spots.find(s => s.id === trip.spotId);
      if (spot) return spot.name;
    }
    return trip.location ?? "Unbekannter Ort";
  };

  const stats = useMemo(
    () =>
      computeTripStats(
        trips.map(t => ({
          startDate: t.startDate,
          endDate: t.endDate,
          placeName: placeName(t),
        }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trips, spots]
  );
  const currentYear = new Date().getFullYear();

  if (loading || (isAuthenticated && tripsQuery.isLoading)) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label="Lädt"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <PageHeader
          title="Reise-Tagebuch"
          subtitle="Deine Camping-Aufenthalte festhalten: Orte, Nächte und Erinnerungen."
        />
        <LoginPrompt feature="dein Reise-Tagebuch" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader
        title="Reise-Tagebuch"
        subtitle="Deine Camping-Aufenthalte festhalten: Orte, Nächte und Erinnerungen."
      />

      {/* Statistik */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="font-serif text-2xl font-bold text-primary">
                {stats.nightsByYear[currentYear] ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Nächte {currentYear}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalNights}</p>
              <p className="text-xs text-muted-foreground">Nächte gesamt</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalTrips}</p>
              <p className="text-xs text-muted-foreground">Aufenthalte</p>
            </div>
            <div className="text-center">
              <p className="flex items-center justify-center gap-1 text-sm font-semibold leading-8">
                <Trophy
                  className="h-4 w-4 shrink-0 text-chart-1"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {stats.topPlaces[0]?.name ?? "–"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">Lieblingsplatz</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Neuer Eintrag */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-base font-semibold">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            Aufenthalt eintragen
          </h2>
          <form
            className="grid gap-3"
            onSubmit={e => {
              e.preventDefault();
              const spotId =
                spotChoice === FREE_LOCATION ? null : Number(spotChoice);
              if (spotId === null && !form.location.trim()) {
                toast.error(
                  "Bitte einen Zeltplatz wählen oder einen Ort eintragen"
                );
                return;
              }
              addMutation.mutate({
                spotId,
                location: spotId === null ? form.location.trim() : null,
                title: form.title.trim() || null,
                notes: form.notes.trim() || null,
                startDate: form.startDate,
                endDate: form.endDate,
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="trip-spot">Ort</Label>
                <Select value={spotChoice} onValueChange={setSpotChoice}>
                  <SelectTrigger id="trip-spot" className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FREE_LOCATION}>
                      Ort frei eintragen …
                    </SelectItem>
                    {spots.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {spotChoice === FREE_LOCATION && (
                <div>
                  <Label htmlFor="trip-location">Ortsname</Label>
                  <Input
                    id="trip-location"
                    className="mt-1.5"
                    placeholder="z. B. Camping Aareschlucht"
                    value={form.location}
                    onChange={e =>
                      setForm(f => ({ ...f, location: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="trip-start">Anreise</Label>
                <Input
                  id="trip-start"
                  className="mt-1.5"
                  type="date"
                  value={form.startDate}
                  max={form.endDate}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      startDate: e.target.value,
                      // Abreise automatisch nachziehen, wenn sie vor der Anreise läge
                      endDate:
                        f.endDate < e.target.value ? e.target.value : f.endDate,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="trip-end">Abreise</Label>
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
            </div>
            <div>
              <Label htmlFor="trip-title">Titel (optional)</Label>
              <Input
                id="trip-title"
                className="mt-1.5"
                placeholder="z. B. Familienferien am See"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="trip-notes">Notizen (optional)</Label>
              <Textarea
                id="trip-notes"
                className="mt-1.5"
                rows={3}
                placeholder="Schönster Stellplatz, bestes Rezept, was beim nächsten Mal anders …"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <Button
              type="submit"
              disabled={addMutation.isPending}
              className="justify-self-start"
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {addMutation.isPending
                ? "Wird gespeichert …"
                : "Eintrag speichern"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Einträge */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        Deine Aufenthalte
      </h2>
      {trips.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Noch keine Einträge – halte oben deinen ersten Camping-Aufenthalt
          fest.
        </p>
      ) : (
        <ul className="space-y-3">
          {trips.map(trip => {
            const nights = tripNights(trip.startDate, trip.endDate);
            return (
              <li
                key={trip.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    {trip.spotId != null ? (
                      <Tent className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {trip.title || placeName(trip)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {trip.title && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {placeName(trip)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        {formatRange(trip.startDate, trip.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3" aria-hidden="true" />
                        {nights === 1 ? "1 Nacht" : `${nights} Nächte`}
                      </span>
                    </p>
                    {trip.notes && (
                      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                        {trip.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                    onClick={() => removeMutation.mutate({ id: trip.id })}
                    aria-label={`Eintrag ${trip.title || placeName(trip)} löschen`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
