import { useEffect, useState } from "react";
import {
  Phone,
  MapPin,
  Copy,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { emergencyCallGuide, emergencyNumbers } from "@/data/emergency";
import { useI18n } from "@/i18n";
import { formatDMS, wgs84ToLV95 } from "@/lib/sun";
import { LOCALE_TAGS, pick } from "@shared/i18n";

interface GeoState {
  status: "loading" | "ok" | "error";
  lat?: number;
  lng?: number;
  accuracy?: number;
  altitude?: number | null;
  timestamp?: number;
  errorKey?: "unsupported" | "denied" | "failed";
}

export default function SosPage() {
  const { lang, t } = useI18n();
  const [geo, setGeo] = useState<GeoState>({ status: "loading" });

  const locate = () => {
    if (!navigator.geolocation) {
      setGeo({ status: "error", errorKey: "unsupported" });
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
          errorKey: err.code === err.PERMISSION_DENIED ? "denied" : "failed",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    locate();
  }, []);

  const copyCoords = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.sos.coordsCopied);
    } catch {
      toast.error(t.sos.copyFailed);
    }
  };

  const geoErrorMessage =
    geo.errorKey === "unsupported"
      ? t.sos.geoUnsupported
      : geo.errorKey === "denied"
        ? t.sos.geoDenied
        : t.sos.geoFailed;

  const lv95 =
    geo.status === "ok" && geo.lat && geo.lng
      ? wgs84ToLV95(geo.lat, geo.lng)
      : null;
  const decimal =
    geo.status === "ok" && geo.lat !== undefined && geo.lng !== undefined
      ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`
      : null;

  return (
    <div className="container py-6">
      <PageHeader title={t.sos.title} subtitle={t.sos.subtitle} />

      {/* GPS-Koordinaten */}
      <Card className="mb-6 border-destructive/30">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <MapPin className="h-5 w-5 text-destructive" aria-hidden="true" />
              {t.sos.locationTitle}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={locate}
              aria-label={t.sos.refreshAria}
            >
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.sos.refresh}
            </Button>
          </div>

          {geo.status === "loading" && (
            <p className="text-muted-foreground">{t.sos.locating}</p>
          )}
          {geo.status === "error" && (
            <p className="text-destructive">{geoErrorMessage}</p>
          )}
          {geo.status === "ok" &&
            geo.lat !== undefined &&
            geo.lng !== undefined && (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.sos.decimalLabel}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-mono text-xl font-semibold">{decimal}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => decimal && copyCoords(decimal)}
                      aria-label={t.sos.copyDecimalAria}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t.sos.dmsLabel}
                    </p>
                    <p className="mt-1 font-mono text-sm">
                      {formatDMS(geo.lat, geo.lng)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t.sos.lv95Label}
                    </p>
                    <p className="mt-1 font-mono text-sm">
                      {lv95
                        ? `E ${lv95.east.toLocaleString(LOCALE_TAGS[lang])} / N ${lv95.north.toLocaleString(LOCALE_TAGS[lang])}`
                        : t.sos.outsideSwitzerland}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.sos.accuracy(Math.round(geo.accuracy ?? 0))}
                  {geo.altitude != null &&
                    t.sos.altitude(Math.round(geo.altitude))}
                  {geo.timestamp &&
                    t.sos.asOf(
                      new Date(geo.timestamp).toLocaleTimeString(
                        LOCALE_TAGS[lang]
                      )
                    )}
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Notfallnummern */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.sos.numbersTitle}
      </h2>
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
            aria-label={t.sos.callAria(pick(n.label, lang))}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-bold">
                {pick(n.label, lang)}
              </span>
              <span className="block text-sm text-muted-foreground">
                {pick(n.description, lang)}
              </span>
            </span>
          </a>
        ))}
      </div>

      {/* Rega-Hinweis */}
      <Card className="mb-6 bg-accent/50">
        <CardContent className="pt-6">
          <h2 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold">
            <Info className="h-5 w-5 text-primary" aria-hidden="true" />
            {t.sos.regaTitle}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t.sos.regaText}
          </p>
          <a
            href="https://www.rega.ch/rega-app"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            aria-label={t.sos.regaLinkAria}
          >
            {t.sos.regaLink}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </CardContent>
      </Card>

      {/* Notruf-Anleitung */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.sos.guideTitle}
      </h2>
      <ol className="space-y-3">
        {emergencyCallGuide.map((step, i) => (
          <li
            key={step.title.de}
            className="flex gap-3 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{pick(step.title, lang)}</p>
              <p className="text-sm text-muted-foreground">
                {pick(step.text, lang)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
