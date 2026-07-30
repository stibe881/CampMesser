import { useEffect, useState } from "react";
import { Phone, MapPin, Copy, RefreshCw, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { emergencyCallGuide, emergencyNumbers } from "@/data/emergency";
import { formatDMS, wgs84ToLV95 } from "@/lib/sun";

interface GeoState {
  status: "loading" | "ok" | "error";
  lat?: number;
  lng?: number;
  accuracy?: number;
  altitude?: number | null;
  timestamp?: number;
  errorMessage?: string;
}

export default function SosPage() {
  const [geo, setGeo] = useState<GeoState>({ status: "loading" });

  const locate = () => {
    if (!navigator.geolocation) {
      setGeo({ status: "error", errorMessage: "Dieses Gerät unterstützt keine Standortermittlung." });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      pos =>
        setGeo({
          status: "ok",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          timestamp: pos.timestamp,
        }),
      err =>
        setGeo({
          status: "error",
          errorMessage:
            err.code === err.PERMISSION_DENIED
              ? "Standortzugriff verweigert. Bitte in den Browser-Einstellungen erlauben."
              : "Standort konnte nicht ermittelt werden. Bitte erneut versuchen.",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    locate();
  }, []);

  const copyCoords = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Koordinaten kopiert");
    } catch {
      toast.error("Kopieren nicht möglich");
    }
  };

  const lv95 = geo.status === "ok" && geo.lat && geo.lng ? wgs84ToLV95(geo.lat, geo.lng) : null;
  const decimal =
    geo.status === "ok" && geo.lat !== undefined && geo.lng !== undefined
      ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`
      : null;

  return (
    <div className="container py-6">
      <PageHeader
        title="SOS & Notfall-Dashboard"
        subtitle="Dein Standort und alle wichtigen Notfallnummern – für den Fall der Fälle."
      />

      {/* GPS-Koordinaten */}
      <Card className="mb-6 border-destructive/30">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <MapPin className="h-5 w-5 text-destructive" aria-hidden="true" />
              Dein Standort
            </h2>
            <Button variant="outline" size="sm" onClick={locate} aria-label="Standort aktualisieren">
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Aktualisieren
            </Button>
          </div>

          {geo.status === "loading" && (
            <p className="text-muted-foreground">Standort wird ermittelt …</p>
          )}
          {geo.status === "error" && (
            <p className="text-destructive">{geo.errorMessage}</p>
          )}
          {geo.status === "ok" && geo.lat !== undefined && geo.lng !== undefined && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Dezimalgrad (WGS84) – für Rettungsdienste
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-xl font-semibold">{decimal}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => decimal && copyCoords(decimal)}
                    aria-label="Koordinaten in Dezimalgrad kopieren"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Grad / Minuten / Sekunden
                  </p>
                  <p className="mt-1 font-mono text-sm">{formatDMS(geo.lat, geo.lng)}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Schweizer Koordinaten (LV95)
                  </p>
                  <p className="mt-1 font-mono text-sm">
                    {lv95 ? `E ${lv95.east.toLocaleString("de-CH")} / N ${lv95.north.toLocaleString("de-CH")}` : "Ausserhalb der Schweiz"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Genauigkeit: ±{Math.round(geo.accuracy ?? 0)} m
                {geo.altitude != null && ` · Höhe: ${Math.round(geo.altitude)} m ü. M.`}
                {geo.timestamp && ` · Stand: ${new Date(geo.timestamp).toLocaleTimeString("de-CH")}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notfallnummern */}
      <h2 className="mb-3 font-serif text-lg font-semibold">Notfallnummern</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {emergencyNumbers.map(n => (
          <a
            key={n.id}
            href={`tel:${n.number}`}
            className={
              n.primary
                ? "flex items-center gap-4 rounded-xl border-2 border-destructive/50 bg-destructive/5 p-4 transition-all hover:bg-destructive/10 active:scale-[0.99]"
                : "flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-destructive/30 active:scale-[0.99]"
            }
            aria-label={`${n.label} anrufen`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-bold">{n.label}</span>
              <span className="block text-sm text-muted-foreground">{n.description}</span>
            </span>
          </a>
        ))}
      </div>

      {/* Rega-Hinweis */}
      <Card className="mb-6 bg-accent/50">
        <CardContent className="pt-6">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold">
            <Info className="h-5 w-5 text-primary" aria-hidden="true" />
            Rega-Alarmierung mit Standortübermittlung
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Die offizielle Rega-App übermittelt beim Alarmieren automatisch deine Position an die
            Einsatzzentrale – das beschleunigt die Rettung in den Bergen erheblich. Wir empfehlen,
            sie zusätzlich zu installieren. Alternativ kannst du beim Anruf auf 1414 die oben
            angezeigten Koordinaten durchgeben.
          </p>
          <a
            href="https://www.rega.ch/rega-app"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            aria-label="Offizielle Rega-App-Seite öffnen (externer Link)"
          >
            Zur offiziellen Rega-App
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </CardContent>
      </Card>

      {/* Notruf-Anleitung */}
      <h2 className="mb-3 font-serif text-lg font-semibold">So setzt du den Notruf richtig ab</h2>
      <ol className="space-y-3">
        {emergencyCallGuide.map((step, i) => (
          <li key={step.title} className="flex gap-3 rounded-xl border border-border bg-card p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

