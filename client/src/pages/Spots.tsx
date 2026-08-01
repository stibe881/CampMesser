import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Droplets,
  LocateFixed,
  MapIcon,
  MapPin,
  Plus,
  Sunrise,
  Sunset,
  Tent,
  Trash2,
  Wind,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { MapView } from "@/components/Map";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getSunTimes } from "@/lib/sun";
import {
  describeWeatherCode,
  detectAlerts,
  type WeatherAlert,
} from "@shared/weather";

interface SpotForecast {
  tempMaxC: number;
  tempMinC: number;
  precipProbability: number;
  windGustsKmh: number;
  weatherCode: number;
  alerts: WeatherAlert[];
}

async function fetchSpotForecast(
  lat: number,
  lon: number
): Promise<SpotForecast> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    forecast_days: "3",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max,weather_code",
    hourly:
      "temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code,cape,cloud_cover",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  );
  if (!res.ok) throw new Error("Wetterdienst nicht erreichbar");
  const json = await res.json();
  const hourly = (json.hourly.time as string[]).map(
    (time: string, i: number) => ({
      time,
      temperatureC: json.hourly.temperature_2m[i],
      apparentC: json.hourly.apparent_temperature[i],
      precipitationMm: json.hourly.precipitation[i],
      precipitationProbability: json.hourly.precipitation_probability?.[i] ?? 0,
      windSpeedKmh: json.hourly.wind_speed_10m[i],
      windGustsKmh: json.hourly.wind_gusts_10m[i],
      weatherCode: json.hourly.weather_code[i],
      cape: json.hourly.cape?.[i] ?? 0,
      cloudCover: json.hourly.cloud_cover?.[i] ?? 0,
    })
  );
  return {
    tempMaxC: json.daily.temperature_2m_max[0],
    tempMinC: json.daily.temperature_2m_min[0],
    precipProbability: json.daily.precipitation_probability_max?.[0] ?? 0,
    windGustsKmh: json.daily.wind_gusts_10m_max[0],
    weatherCode: json.daily.weather_code[0],
    alerts: detectAlerts(hourly),
  };
}

function SpotCard({
  spot,
  onDelete,
}: {
  spot: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    note: string | null;
  };
  onDelete: () => void;
}) {
  const [forecast, setForecast] = useState<SpotForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const sun = useMemo(() => {
    const times = getSunTimes(new Date(), spot.latitude, spot.longitude);
    const fmt = (d: Date | null) =>
      d
        ? d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
        : "–";
    return { sunrise: fmt(times.sunrise), sunset: fmt(times.sunset) };
  }, [spot.latitude, spot.longitude]);

  const loadForecast = async () => {
    setLoading(true);
    setFailed(false);
    try {
      setForecast(await fetchSpotForecast(spot.latitude, spot.longitude));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold">
              <Tent
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {spot.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {spot.latitude.toFixed(4)}°, {spot.longitude.toFixed(4)}°
            </p>
            {spot.note && (
              <p className="mt-1 text-sm text-muted-foreground">{spot.note}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`${spot.name} löschen`}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sunrise className="h-3.5 w-3.5 text-chart-4" aria-hidden="true" />
            {sun.sunrise}
          </span>
          <span className="flex items-center gap-1">
            <Sunset className="h-3.5 w-3.5 text-chart-1" aria-hidden="true" />
            {sun.sunset}
          </span>
          <a
            href={`/zeltplaetze/${spot.id}`}
            className="ml-auto font-medium text-primary hover:underline"
          >
            Dossier →
          </a>
          <a
            href={`/sonne?lat=${spot.latitude}&lon=${spot.longitude}&name=${encodeURIComponent(spot.name)}&spot=${spot.id}`}
            className="font-medium text-primary hover:underline"
          >
            Sonnenstand →
          </a>
        </div>

        {forecast === null && !loading && !failed && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={loadForecast}
          >
            Wetter-Vorschau laden
          </Button>
        )}
        {loading && <Skeleton className="mt-3 h-16 w-full rounded-lg" />}
        {failed && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Wetter konnte nicht geladen werden.
            <button type="button" onClick={loadForecast} className="underline">
              Nochmals versuchen
            </button>
          </p>
        )}
        {forecast && (
          <div className="mt-3 rounded-lg bg-accent/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {describeWeatherCode(forecast.weatherCode).label}
              </span>
              <span>
                <span className="font-semibold">
                  {Math.round(forecast.tempMaxC)}°
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  / {Math.round(forecast.tempMinC)}°
                </span>
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" aria-hidden="true" />
                {Math.round(forecast.precipProbability)} %
              </span>
              <span className="flex items-center gap-1">
                <Wind className="h-3 w-3" aria-hidden="true" />
                Böen {Math.round(forecast.windGustsKmh)} km/h
              </span>
            </div>
            {forecast.alerts.length > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                {forecast.alerts.map(a => a.title).join(" · ")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Karten-Auswahl: Ein Tipp/Klick auf die Karte setzt einen Marker und
 * übernimmt die Koordinaten ins Formular.
 */
function SpotMapPicker({
  initial,
  onPick,
}: {
  initial: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null
  );

  return (
    <MapView
      className="h-56 overflow-hidden rounded-lg border border-border"
      initialCenter={initial ?? { lat: 46.8182, lng: 8.2275 }}
      initialZoom={initial ? 13 : 8}
      onMapReady={map => {
        if (initial) {
          markerRef.current = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: initial,
          });
        }
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          if (markerRef.current) {
            markerRef.current.position = { lat, lng };
          } else {
            markerRef.current = new google.maps.marker.AdvancedMarkerElement({
              map,
              position: { lat, lng },
            });
          }
          onPick(lat, lng);
        });
      }}
    />
  );
}

export default function SpotsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { data: spots, isLoading } = trpc.spots.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [note, setNote] = useState("");
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const addMutation = trpc.spots.add.useMutation({
    onSuccess: () => {
      utils.spots.list.invalidate();
      setDialogOpen(false);
      setName("");
      setLat("");
      setLon("");
      setNote("");
      toast.success("Zeltplatz gespeichert");
    },
    onError: () => toast.error("Speichern fehlgeschlagen"),
  });
  const removeMutation = trpc.spots.remove.useMutation({
    onMutate: async input => {
      await utils.spots.list.cancel();
      const prev = utils.spots.list.getData();
      utils.spots.list.setData(undefined, old =>
        old?.filter(s => s.id !== input.id)
      );
      return { prev };
    },
    onError: (_e, _i, ctx) => {
      utils.spots.list.setData(undefined, ctx?.prev);
      toast.error("Löschen fehlgeschlagen");
    },
    onSettled: () => utils.spots.list.invalidate(),
  });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Dein Gerät unterstützt keine Standortbestimmung.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude.toFixed(5));
        setLon(pos.coords.longitude.toFixed(5));
        setLocating(false);
      },
      () => {
        toast.error("Standort nicht verfügbar.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const submit = () => {
    const latNum = parseFloat(lat.replace(",", "."));
    const lonNum = parseFloat(lon.replace(",", "."));
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    if (
      Number.isNaN(latNum) ||
      latNum < -90 ||
      latNum > 90 ||
      Number.isNaN(lonNum) ||
      lonNum < -180 ||
      lonNum > 180
    ) {
      toast.error(
        "Bitte gültige Koordinaten eingeben (z. B. 46.8182 und 8.2275)."
      );
      return;
    }
    addMutation.mutate({
      name: name.trim(),
      latitude: latNum,
      longitude: lonNum,
      note: note.trim() || undefined,
    });
  };

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader
        title="Zeltplatz-Favoriten"
        subtitle="Speichere geplante Zeltplätze und rufe Wetter und Sonnenstand im Voraus ab."
      />

      {!authLoading && !isAuthenticated ? (
        <LoginPrompt feature="deine Zeltplatz-Favoriten" />
      ) : (
        <>
          <Button onClick={() => setDialogOpen(true)} className="mb-5">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Zeltplatz hinzufügen
          </Button>

          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          )}

          {!isLoading && (spots?.length ?? 0) === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <MapPin
                  className="h-8 w-8 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Noch keine Favoriten. Speichere deinen ersten geplanten
                  Zeltplatz – per Koordinaten oder direkt mit deinem aktuellen
                  Standort.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {spots?.map(spot => (
              <SpotCard
                key={spot.id}
                spot={spot}
                onDelete={() => removeMutation.mutate({ id: spot.id })}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              Zeltplatz speichern
            </DialogTitle>
            <DialogDescription>
              Tippe auf die Karte, übernimm deinen aktuellen Standort oder gib
              die Koordinaten von Hand ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="spot-name">Name</Label>
              <Input
                id="spot-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="z. B. Camping Grindelwald"
                maxLength={120}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Ort auf der Karte wählen
                </Label>
                <button
                  type="button"
                  onClick={() => setShowMap(v => !v)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {showMap ? "Karte ausblenden" : "Karte anzeigen"}
                </button>
              </div>
              {showMap && dialogOpen && (
                <SpotMapPicker
                  initial={
                    lat &&
                    lon &&
                    !Number.isNaN(parseFloat(lat)) &&
                    !Number.isNaN(parseFloat(lon))
                      ? {
                          lat: parseFloat(lat.replace(",", ".")),
                          lng: parseFloat(lon.replace(",", ".")),
                        }
                      : null
                  }
                  onPick={(pickedLat, pickedLng) => {
                    setLat(pickedLat.toFixed(5));
                    setLon(pickedLng.toFixed(5));
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="spot-lat">Breitengrad</Label>
                <Input
                  id="spot-lat"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="46.6244"
                  inputMode="decimal"
                />
              </div>
              <div>
                <Label htmlFor="spot-lon">Längengrad</Label>
                <Input
                  id="spot-lon"
                  value={lon}
                  onChange={e => setLon(e.target.value)}
                  placeholder="8.0364"
                  inputMode="decimal"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={useCurrentLocation}
              disabled={locating}
              className="w-full"
            >
              <LocateFixed className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {locating
                ? "Standort wird ermittelt …"
                : "Aktuellen Standort übernehmen"}
            </Button>
            <div>
              <Label htmlFor="spot-note">Notiz (optional)</Label>
              <Input
                id="spot-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="z. B. Platz am Bach, schattig am Morgen"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={submit} disabled={addMutation.isPending}>
              {addMutation.isPending ? "Speichern …" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
