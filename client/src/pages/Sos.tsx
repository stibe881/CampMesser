import { useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  Phone,
  MapPin,
  Copy,
  QrCode,
  RefreshCw,
  ExternalLink,
  Info,
  Share2,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { emergencyCallGuide, emergencyNumbers } from "@/data/emergency";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { formatDMS, wgs84ToLV95 } from "@/lib/sun";
import { EMERGENCY_COUNTRIES } from "@shared/emergencyNumbers";
import { guessCountryCode } from "@/data/roadRules";
import { isTripActiveOn } from "@shared/trips";
import { useTodayIso } from "@/lib/useTodayIso";
import NearbyPoints from "@/components/NearbyPoints";
import {
  defibrillatorsQuery,
  parseDefibrillators,
  parsePharmacies,
  pharmaciesQuery,
} from "@/lib/overpass";
import { HeartPulse, Pill } from "lucide-react";
import { LANGUAGES, LANGUAGE_LABELS, LOCALE_TAGS, pick } from "@shared/i18n";
import { emergencyPhrase } from "@shared/emergencyPhrase";
import {
  DEFAULT_LOCATION_SHARE_HOURS,
  LOCATION_SHARE_EXPIRY_HOURS,
  relativeAge,
  type LocationShareExpiryHours,
} from "@shared/sharing";
import { cn } from "@/lib/utils";

interface GeoState {
  status: "loading" | "ok" | "error";
  lat?: number;
  lng?: number;
  accuracy?: number;
  altitude?: number | null;
  timestamp?: number;
  errorKey?: "unsupported" | "denied" | "failed";
}

/** Flaggen-Emoji aus dem ISO-Code (Regional-Indicator-Zeichen). */
function flagEmoji(code: string): string {
  return String.fromCodePoint(
    0x1f1e6 + code.toUpperCase().charCodeAt(0) - 65,
    0x1f1e6 + code.toUpperCase().charCodeAt(1) - 65
  );
}

/** Frische Position holen – bewusst ohne gecachten Wert (maximumAge 0). */
function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

/**
 * «Hier bin ich» (#221): Teil-Link mit dem eigenen Standort.
 *
 * Der Abschnitt sitzt bewusst im SOS-Modul – hier landet man, wenn es
 * darauf ankommt, den eigenen Standort loszuwerden, und die Koordinaten
 * stehen gleich darüber. Es gibt IMMER nur einen aktiven Link pro Konto:
 * «Standort aktualisieren» führt denselben Link nach, statt einen zweiten
 * zu erzeugen, und «Link deaktivieren» beendet ihn sofort.
 */
function LocationShareCard() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const currentQuery = trpc.location.current.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const shareMutation = trpc.location.share.useMutation();
  const stopMutation = trpc.location.stop.useMutation();
  const [hours, setHours] = useState<LocationShareExpiryHours>(
    DEFAULT_LOCATION_SHARE_HOURS
  );
  const [busy, setBusy] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const share = currentQuery.data ?? null;
  const url = share
    ? `${window.location.origin}/standort/${share.token}`
    : null;

  // QR-Code zum Link: am Lagerfeuer abscannen statt Link tippen
  useEffect(() => {
    if (!url) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: "M" })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [url]);

  /**
   * Standort holen und teilen bzw. nachführen (derselbe Weg für beides).
   * `hoursOverride` braucht der Gültigkeits-Umschalter: der React-State ist
   * im selben Klick noch der alte Wert.
   */
  const publish = async (
    isRefresh: boolean,
    hoursOverride?: LocationShareExpiryHours
  ) => {
    setBusy(true);
    try {
      const pos = await currentPosition();
      const result = await shareMutation.mutateAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracyM: pos.coords.accuracy ?? null,
        capturedAt: pos.timestamp,
        expiresInHours: hoursOverride ?? hours,
      });
      await utils.location.current.invalidate();
      const link = `${window.location.origin}/standort/${result.token}`;
      if (isRefresh) {
        toast.success(t.locationShare.refreshed);
        return;
      }
      try {
        await navigator.clipboard.writeText(link);
        toast.success(t.locationShare.createdCopied);
      } catch {
        toast.success(t.locationShare.created);
      }
    } catch {
      toast.error(t.locationShare.failed);
    } finally {
      setBusy(false);
    }
  };

  /** Systemweites Teilen mit Rückfall aufs Kopieren. */
  const shareLink = async () => {
    if (!url) return;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t.locationShare.shareTitle, url });
        return;
      } catch {
        // Abgebrochen oder nicht erlaubt – dann eben kopieren
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.common.linkCopied);
    } catch {
      toast.error(t.common.copyFailed);
    }
  };

  const expiryChips = (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label={t.locationShare.validityAria}
    >
      <span className="text-xs text-muted-foreground">
        {t.locationShare.validityLabel}
      </span>
      {LOCATION_SHARE_EXPIRY_HOURS.map(option => (
        <button
          key={option}
          type="button"
          disabled={busy}
          onClick={() => {
            setHours(option);
            // Bei einem aktiven Link wirkt die neue Dauer sofort – sonst
            // stünde daneben ein Ablauf, der nicht zur Auswahl passt.
            if (share) void publish(true, option);
          }}
          aria-pressed={hours === option}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            hours === option
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {t.locationShare.validityHours(option)}
        </button>
      ))}
    </div>
  );

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="mb-2 flex items-center gap-2 font-serif text-lg font-semibold">
          <Share2 className="h-5 w-5 text-primary" aria-hidden="true" />
          {t.locationShare.title}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.locationShare.desc}
        </p>

        {!authLoading && !isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            {t.locationShare.loginHint}
          </p>
        ) : share && url ? (
          <div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-xs">{url}</code>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success(t.common.linkCopied);
                  } catch {
                    toast.error(t.common.copyFailed);
                  }
                }}
              >
                {t.common.copy}
              </button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {t.locationShare.updatedAgo(
                new Intl.RelativeTimeFormat(LOCALE_TAGS[lang], {
                  numeric: "auto",
                }).format(
                  relativeAge(share.capturedAt).value,
                  relativeAge(share.capturedAt).unit
                )
              )}
              {share.accuracyM !== null &&
                ` · ${t.locationShare.accuracy(share.accuracyM)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.locationShare.expiresAt(
                new Date(share.expiresAt).toLocaleString(LOCALE_TAGS[lang], {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              )}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={shareLink}>
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.locationShare.share}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void publish(true)}
              >
                <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {busy ? t.locationShare.locating : t.locationShare.refresh}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={stopMutation.isPending}
                onClick={async () => {
                  if (
                    !(await ask({
                      title: t.locationShare.stopConfirm,
                      confirmLabel: t.common.confirmStop,
                    }))
                  )
                    return;
                  stopMutation.mutate(undefined, {
                    onSuccess: async () => {
                      await utils.location.current.invalidate();
                      toast.success(t.locationShare.stopped);
                    },
                    onError: () => toast.error(t.common.actionFailed),
                  });
                }}
              >
                {t.locationShare.stop}
              </Button>
            </div>

            <div className="mt-3">{expiryChips}</div>

            {qrDataUrl && (
              <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                {/* Weisser Rahmen, damit der Code auch im Dark Mode scannbar bleibt */}
                <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
                  <img
                    src={qrDataUrl}
                    alt={t.locationShare.qrAlt}
                    className="h-32 w-32"
                  />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <QrCode
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    {t.locationShare.qrTitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.locationShare.qrText}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {expiryChips}
            <Button disabled={busy} onClick={() => void publish(false)}>
              <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {busy ? t.locationShare.locating : t.locationShare.createButton}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SosPage() {
  const { lang, t } = useI18n();
  const [geo, setGeo] = useState<GeoState>({ status: "loading" });
  // Reiseland (#521): Läuft gerade eine Auslandsreise, gehören deren
  // Notrufnummern nach oben – im Notfall klappt niemand Länder auf.
  const { isAuthenticated } = useAuth();
  const todayIso = useTodayIso();
  const tripsQuery = trpc.trips.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const tripCountry = useMemo(() => {
    for (const trip of tripsQuery.data ?? []) {
      if (!isTripActiveOn(trip, todayIso)) continue;
      const code = guessCountryCode(
        [trip.location, trip.title, trip.spotName].filter(Boolean).join(" ")
      );
      if (code && code !== "CH") {
        const entry = EMERGENCY_COUNTRIES.find(
          c => c.code === code.toLowerCase()
        );
        if (entry) return entry;
      }
    }
    return null;
  }, [tripsQuery.data, todayIso]);

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

                {/* Satz zum Vorlesen (#448): die Position in der Sprache
                    der Notrufzentrale – vorlesen statt formulieren */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t.sos.phraseTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.sos.phraseHint}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {LANGUAGES.map(phraseLang => {
                      const phrase = emergencyPhrase(
                        phraseLang,
                        geo.lat!,
                        geo.lng!
                      );
                      return (
                        <li
                          key={phraseLang}
                          className="flex items-center gap-2 rounded-lg bg-muted p-3"
                        >
                          <span className="w-7 shrink-0 text-xs font-bold uppercase text-muted-foreground">
                            {phraseLang}
                          </span>
                          <span className="min-w-0 flex-1 text-sm">
                            {phrase}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyCoords(phrase)}
                            aria-label={t.sos.phraseCopyAria(
                              LANGUAGE_LABELS[phraseLang]
                            )}
                          >
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* «Hier bin ich»: Standort-Link für Mitreisende */}
      <LocationShareCard />

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

      {/* Defibrillatoren in der Nähe (#494): Im Herznotfall zählt der
          nächste Defi – die Suche braucht den Standort von oben und
          bleibt darum weg, solange er fehlt. Erst 144 anrufen, dann
          holen (der Hinweis steht in der Karte). */}
      {geo.status === "ok" &&
        geo.lat !== undefined &&
        geo.lng !== undefined && (
          <NearbyPoints
            latitude={geo.lat}
            longitude={geo.lng}
            icon={HeartPulse}
            texts={t.poi.defis}
            query={defibrillatorsQuery}
            parse={parseDefibrillators}
            radii={[500, 1000, 2000]}
            defaultRadiusM={1000}
            profile="foot"
            sectionId="sos-defis"
            className="mb-6"
          />
        )}

      {/* Apotheken (#529): nach den Defis – das zweithäufigste «wo ist
          das nächste …?» im Ernstfall. */}
      {geo.status === "ok" &&
        geo.lat !== undefined &&
        geo.lng !== undefined && (
          <NearbyPoints
            latitude={geo.lat}
            longitude={geo.lng}
            icon={Pill}
            texts={t.poi.pharmacies}
            query={pharmaciesQuery}
            parse={parsePharmacies}
            radii={[1000, 2000, 5000]}
            defaultRadiusM={2000}
            profile="foot"
            sectionId="sos-pharmacies"
            className="mb-6"
          />
        )}

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

      {/* Reiseland (#521): laufende Auslandsreise → Nummern prominent */}
      {tripCountry && (
        <div className="mb-6 rounded-xl border-2 border-destructive/40 bg-card p-4">
          <p className="font-semibold">
            <span aria-hidden="true">{flagEmoji(tripCountry.code)}</span>{" "}
            {t.sos.tripCountryTitle(pick(tripCountry.name, lang))}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t.sos.tripCountryHint}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {tripCountry.numbers.map(entry => (
              <a
                key={`${tripCountry.code}-${entry.number}-${entry.label.de}`}
                href={`tel:${entry.number}`}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 transition-colors hover:border-destructive/30"
                aria-label={t.sos.callAria(pick(entry.label, lang))}
              >
                <Phone
                  className="h-3.5 w-3.5 text-destructive"
                  aria-hidden="true"
                />
                <span className="text-sm">{pick(entry.label, lang)}</span>
                <span className="font-mono text-sm font-bold">
                  {entry.number}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notrufnummern im Ausland (#432) – die Schweiz steht schon oben */}
      <h2 className="mb-3 font-serif text-lg font-semibold">
        {t.sos.abroadTitle}
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">{t.sos.abroadHint}</p>
      <div className="mb-6 space-y-2">
        {EMERGENCY_COUNTRIES.filter(country => country.code !== "ch").map(
          country => (
            <details
              key={country.code}
              className="rounded-xl border border-border bg-card"
            >
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-semibold marker:text-muted-foreground">
                <span aria-hidden="true">{flagEmoji(country.code)}</span>
                {pick(country.name, lang)}
              </summary>
              <div className="flex flex-wrap gap-2 px-4 pb-4">
                {country.numbers.map(entry => (
                  <a
                    key={`${country.code}-${entry.number}-${entry.label.de}`}
                    href={`tel:${entry.number}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 transition-colors hover:border-destructive/30"
                    aria-label={t.sos.callAria(pick(entry.label, lang))}
                  >
                    <Phone
                      className="h-3.5 w-3.5 text-destructive"
                      aria-hidden="true"
                    />
                    <span className="text-sm">{pick(entry.label, lang)}</span>
                    <span className="font-mono text-sm font-bold">
                      {entry.number}
                    </span>
                  </a>
                ))}
              </div>
            </details>
          )
        )}
      </div>

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
