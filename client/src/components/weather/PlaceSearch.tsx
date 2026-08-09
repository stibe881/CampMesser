/**
 * Ortssuche für die Wetter-Favoriten (#157/#438, aus Weather.tsx
 * herausgelöst): gleiche Geocoding-Suche wie der Vergleich – ein Klick
 * speichert den Ort (Stern) und zeigt sofort sein Wetter.
 */
import { useState } from "react";
import { Search, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
import type { WeatherPlace } from "@/lib/weatherPlaces";

/**
 * Ortssuche für die Wetter-Favoriten: gleiche Geocoding-Suche wie der
 * Vergleich – ein Klick auf ein Resultat speichert den Ort (Stern) und
 * zeigt sofort sein Wetter.
 */
export default function PlaceSearch({
  onPick,
  onClose,
}: {
  onPick: (place: WeatherPlace) => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [results, setResults] = useState<PlaceResult[] | null>(null);

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

  return (
    <Card className="mb-4">
      <CardContent className="pt-5">
        <form
          onSubmit={e => {
            e.preventDefault();
            void runSearch();
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="weather-place-search">
              {t.weather.placeSearchLabel}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={t.weather.placeSearchCloseAria}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="weather-place-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.weather.placeSearchPlaceholder}
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={searching || query.trim().length < 2}
            >
              <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.weather.compareSearchButton}
            </Button>
          </div>
        </form>
        {searching && (
          <div
            className="mt-3"
            role="status"
            aria-busy="true"
            aria-label={t.weather.compareSearchingAria}
          >
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        )}
        {searchFailed && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t.weather.compareSearchFailed}
          </p>
        )}
        {!searching && results !== null && results.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t.weather.compareNoResults}
          </p>
        )}
        {!searching && results !== null && results.length > 0 && (
          <>
            <ul
              aria-label={t.weather.compareResultsAria}
              className="mt-3 space-y-1.5"
            >
              {results.map(r => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onPick({
                        name: r.name,
                        lat: r.latitude,
                        lon: r.longitude,
                      })
                    }
                    className="flex w-full items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary/50"
                  >
                    <Star
                      className="h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="font-medium">{r.name}</span>
                    {r.region && (
                      <span className="truncate text-xs text-muted-foreground">
                        {r.region}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.weather.placeResultsHint}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
