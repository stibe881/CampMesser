/**
 * Profil-Karte «HomeLocationCard» – aus Profile.tsx herausgelöst (#414).
 * Die Seite war nach #408 über 1600 Zeilen; die fünf grossen Karten
 * wohnen jetzt hier (Muster wie die Aufteilung von Trips.tsx, #322).
 */
import { useEffect, useState } from "react";
import CollapsibleCard from "@/components/CollapsibleCard";
import { toast } from "sonner";
import { Trash2, House, LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

/**
 * Abschnitt «Heim-Standort»: ein Wohnort pro Konto für Unwetter-Warnungen
 * und Sternschnuppen-Tipps – gesetzt per aktueller Position oder Ortssuche
 * (Open-Meteo-Geocoding, Muster Wetter-Vergleich), Name frei wählbar.
 */
export default function HomeLocationCard() {
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const homeQuery = trpc.home.get.useQuery();
  const home = homeQuery.data ?? null;

  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (home) setName(home.name);
  }, [home]);

  const setMutation = trpc.home.set.useMutation({
    onSuccess: () => {
      toast.success(t.profile.homeSaved);
      setQuery("");
      setResults(null);
      void utils.home.get.invalidate();
    },
    onError: e => toast.error(e.message),
  });
  const removeMutation = trpc.home.remove.useMutation({
    onSuccess: () => {
      toast.success(t.profile.homeRemoved);
      setName("");
      void utils.home.get.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  /** Name aus dem Feld, leer → Default («Zuhause»). */
  const effectiveName = () => name.trim() || t.profile.homeDefaultName;
  const saveAt = (latitude: number, longitude: number) => {
    setMutation.mutate({ name: effectiveName(), latitude, longitude });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t.spots.geoUnsupported);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocating(false);
        saveAt(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        toast.error(t.spots.geoUnavailable);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2 || searching) return;
    setSearching(true);
    setSearchFailed(false);
    setResults(null);
    try {
      setResults(await searchPlaces(q, lang));
    } catch {
      setSearchFailed(true);
    } finally {
      setSearching(false);
    }
  };

  const busy = setMutation.isPending || removeMutation.isPending;

  return (
    <CollapsibleCard
      className="mb-5"
      icon={<House className="h-4 w-4 text-primary" aria-hidden="true" />}
      title={t.profile.homeTitle}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {t.profile.homeIntro}
      </p>
      {home ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <p className="flex min-w-0 items-center gap-1.5 text-sm">
            <MapPin
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="truncate font-medium">{home.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {home.latitude.toFixed(3)}, {home.longitude.toFixed(3)}
            </span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => removeMutation.mutate()}
            aria-label={t.profile.homeRemoveAria}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">
          {t.profile.homeNotSet}
        </p>
      )}
      <div className="space-y-3">
        <div>
          <Label htmlFor="home-name" className="mb-1.5 block text-xs">
            {t.profile.homeNameLabel}
          </Label>
          <div className="flex gap-2">
            <Input
              id="home-name"
              value={name}
              maxLength={80}
              onChange={e => setName(e.target.value)}
              placeholder={t.profile.homeDefaultName}
            />
            {home && (
              <Button
                type="button"
                variant="outline"
                disabled={busy || effectiveName() === home.name}
                onClick={() => saveAt(home.latitude, home.longitude)}
              >
                {t.common.save}
              </Button>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={busy || locating}
          onClick={useCurrentLocation}
        >
          <LocateFixed className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {locating ? t.profile.homeLocating : t.profile.homeUseLocation}
        </Button>
        <form
          onSubmit={e => {
            e.preventDefault();
            void runSearch();
          }}
        >
          <Label htmlFor="home-search" className="mb-1.5 block text-xs">
            {t.profile.homeSearchLabel}
          </Label>
          <div className="flex gap-2">
            <Input
              id="home-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.profile.homeSearchPlaceholder}
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={searching || query.trim().length < 2}
            >
              <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.profile.homeSearchButton}
            </Button>
          </div>
        </form>
        {searchFailed && (
          <p className="text-sm text-muted-foreground">
            {t.profile.homeSearchFailed}
          </p>
        )}
        {results && results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t.profile.homeSearchEmpty}
          </p>
        )}
        {results && results.length > 0 && (
          <ul className="space-y-1.5">
            {results.map(place => (
              <li key={place.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                  disabled={busy}
                  onClick={() => saveAt(place.latitude, place.longitude)}
                  aria-label={t.profile.homeSelectAria(place.name)}
                >
                  <span className="font-medium">{place.name}</span>
                  {place.region && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {place.region}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CollapsibleCard>
  );
}
