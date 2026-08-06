import { useEffect, useMemo, useState } from "react";
import { fmtMedium } from "@/lib/dateFormat";
import ClientErrorLog from "@/components/ClientErrorLog";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  UserRound,
  KeyRound,
  Mail,
  Trash2,
  LayoutGrid,
  Palette,
  Sun,
  Moon,
  MonitorSmartphone,
  LogOut,
  BellRing,
  House,
  LocateFixed,
  MapPin,
  Search,
  Fingerprint,
  Plus,
  Sparkles,
  SunMedium,
  MailWarning,
  Navigation,
  Backpack,
  ChevronDown,
  Clock,
  CloudLightning,
  History,
  TriangleAlert,
  Refrigerator,
  Tent,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { WhatsNewDialog } from "@/components/WhatsNewDialog";
import type { ChangelogBlock } from "@/data/changelogMeta";
import {
  loadMapsPreference,
  saveMapsPreference,
  type MapsPreference,
} from "@/lib/directions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushSubscription } from "@/lib/usePushSubscription";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  getThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "@/lib/themePreference";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { RETENTION_DAYS } from "@shared/trash";
import { PUSH_CHECK_STALE_HOURS, pushCheckHealth } from "@shared/pushHealth";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { modules } from "@/data/modules";
import { pick } from "@shared/i18n";
import {
  DEFAULT_QUICK_BAR,
  QUICK_BAR_SOS,
  QUICK_BAR_START,
  isDefaultQuickBar,
  sanitizeQuickBar,
  setQuickBarSlot,
} from "@shared/quickBar";
import {
  loadQuickBar,
  quickBarChoices,
  saveQuickBar,
} from "@/lib/quickBarStore";
import {
  RAIN_DANGER_MM,
  RAIN_THRESHOLD_MAX_MM,
  RAIN_THRESHOLD_MIN_MM,
  WIND_DANGER_KMH,
  WIND_THRESHOLD_MAX_KMH,
  WIND_THRESHOLD_MIN_KMH,
} from "@shared/weather";

type PushFlag =
  | "wantsWeather"
  | "wantsFood"
  | "wantsTrips"
  | "wantsAstro"
  | "wantsGear"
  | "wantsHeat";

/** Symbol je Mitteilungs-Art im Verlauf (unbekannte Arten: Glocke). */
const PUSH_KIND_ICONS: Record<string, LucideIcon> = {
  weather: CloudLightning,
  food: Refrigerator,
  trip: Tent,
  drying: Wind,
  astro: Sparkles,
  gear: Wrench,
  evepack: Backpack,
  heat: SunMedium,
};

/**
 * Benachrichtigungs-Verlauf (#201): aufklappbare Liste der letzten Meldungen
 * des KONTOS (nicht des Geräts) – Symbol je Art, Titel, Text und Zeitpunkt;
 * ein Klick öffnet die hinterlegte Route. Geladen wird erst beim Aufklappen.
 */
function PushHistory() {
  const { lang, t } = useI18n();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const logQuery = trpc.push.log.useQuery({}, { enabled: open });
  const entries = logQuery.data ?? [];

  /** Art-Bezeichnung, mit Rückfall auf den rohen Schlüssel. */
  const kindLabel = (kind: string) =>
    t.profile.historyKind[kind as keyof typeof t.profile.historyKind] ?? kind;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
        aria-label={t.profile.historyToggleAria}
        onClick={() => setOpen(value => !value)}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.profile.historyTitle}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="mt-3">
          {logQuery.isPending ? (
            <p className="text-xs text-muted-foreground">
              {t.common.loading} …
            </p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t.profile.historyEmpty}
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                {t.profile.historyHint}
              </p>
              <ul className="space-y-1.5">
                {entries.map(entry => {
                  const Icon = PUSH_KIND_ICONS[entry.kind] ?? BellRing;
                  const url = entry.url;
                  const content = (
                    <>
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {entry.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {entry.body}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {kindLabel(entry.kind)} ·{" "}
                          {new Date(entry.sentAt).toLocaleString(
                            LOCALE_TAGS[lang],
                            { dateStyle: "short", timeStyle: "short" }
                          )}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={entry.id}>
                      {url ? (
                        <button
                          type="button"
                          className="flex w-full gap-2 rounded-md border border-border p-2 text-left hover:bg-accent"
                          aria-label={t.profile.historyOpenAria(entry.title)}
                          onClick={() => navigate(url)}
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="flex w-full gap-2 rounded-md border border-border p-2">
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Abschnitt «Mitteilungen»: Push-Abo dieses Geräts (an/aus) plus
 * Feineinstellungen, welche Mitteilungs-Arten das Gerät erhalten soll,
 * und darunter der aufklappbare Benachrichtigungs-Verlauf des Kontos.
 */
function NotificationsCard() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const push = usePushSubscription();
  const prefsQuery = trpc.push.getPrefs.useQuery(
    { endpoint: push.endpoint ?? "" },
    { enabled: Boolean(push.enabled && push.endpoint) }
  );
  const setPrefsMutation = trpc.push.setPrefs.useMutation({
    onSuccess: () => utils.push.getPrefs.invalidate(),
    onError: () => {
      toast.error(t.common.saveFailed);
      void utils.push.getPrefs.invalidate();
    },
  });
  const prefs = prefsQuery.data?.prefs ?? null;

  // Eigene Warn-Schwellen: als Text im Feld, gespeichert wird beim Verlassen
  // bzw. mit Enter (leeres Feld = Standardwert).
  const [windInput, setWindInput] = useState("");
  const [rainInput, setRainInput] = useState("");
  const windThreshold = prefs?.windThresholdKmh ?? null;
  const rainThreshold = prefs?.rainThresholdMm ?? null;
  useEffect(() => {
    setWindInput(windThreshold === null ? "" : String(windThreshold));
  }, [windThreshold]);
  useEffect(() => {
    setRainInput(rainThreshold === null ? "" : String(rainThreshold));
  }, [rainThreshold]);

  /** Eingabe in einen gültigen Schwellenwert überführen (null = Standard). */
  const parseThreshold = (raw: string, min: number, max: number) => {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const value = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(value)) return null;
    return Math.min(max, Math.max(min, value));
  };

  const saveWindThreshold = (raw: string) => {
    if (!push.endpoint) return;
    const value = parseThreshold(
      raw,
      WIND_THRESHOLD_MIN_KMH,
      WIND_THRESHOLD_MAX_KMH
    );
    setWindInput(value === null ? "" : String(value));
    if (value === windThreshold) return;
    setPrefsMutation.mutate({
      endpoint: push.endpoint,
      windThresholdKmh: value,
    });
  };

  const saveRainThreshold = (raw: string) => {
    if (!push.endpoint) return;
    const value = parseThreshold(
      raw,
      RAIN_THRESHOLD_MIN_MM,
      RAIN_THRESHOLD_MAX_MM
    );
    setRainInput(value === null ? "" : String(value));
    if (value === rainThreshold) return;
    setPrefsMutation.mutate({
      endpoint: push.endpoint,
      rainThresholdMm: value,
    });
  };

  const setFlag = (flag: PushFlag, value: boolean) => {
    if (!push.endpoint) return;
    const patch =
      flag === "wantsWeather"
        ? { wantsWeather: value }
        : flag === "wantsFood"
          ? { wantsFood: value }
          : flag === "wantsTrips"
            ? { wantsTrips: value }
            : flag === "wantsAstro"
              ? { wantsAstro: value }
              : flag === "wantsGear"
                ? { wantsGear: value }
                : { wantsHeat: value };
    setPrefsMutation.mutate({ endpoint: push.endpoint, ...patch });
  };

  const rows: { flag: PushFlag; label: string; desc: string }[] = [
    {
      flag: "wantsWeather",
      label: t.profile.prefWeather,
      desc: t.profile.prefWeatherDesc,
    },
    {
      flag: "wantsFood",
      label: t.profile.prefFood,
      desc: t.profile.prefFoodDesc,
    },
    {
      flag: "wantsTrips",
      label: t.profile.prefTrips,
      desc: t.profile.prefTripsDesc,
    },
    {
      flag: "wantsAstro",
      label: t.profile.prefAstro,
      desc: t.profile.prefAstroDesc,
    },
    {
      flag: "wantsGear",
      label: t.profile.prefGear,
      desc: t.profile.prefGearDesc,
    },
    {
      flag: "wantsHeat",
      label: t.profile.prefHeat,
      desc: t.profile.prefHeatDesc,
    },
  ];

  return (
    <Card className="mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.profile.notificationsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!push.supported ? (
          <p className="text-sm text-muted-foreground">
            {t.profile.pushUnsupported}
          </p>
        ) : push.configLoaded && !push.configured ? (
          <p className="text-sm text-muted-foreground">
            {t.profile.pushNotConfigured}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {t.profile.pushDeviceTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.profile.pushDeviceDesc}
                </p>
              </div>
              <Switch
                checked={push.enabled ?? false}
                disabled={
                  push.busy || push.enabled === null || !push.configured
                }
                onCheckedChange={next =>
                  push.toggle(next, {
                    enabled: t.profile.pushOn,
                    disabled: t.profile.pushOff,
                  })
                }
                aria-label={t.profile.pushDeviceAria}
              />
            </div>
            {push.enabled && prefs && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {t.profile.prefsIntro}
                </p>
                {rows.map(row => (
                  <div
                    key={row.flag}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.desc}
                      </p>
                    </div>
                    <Switch
                      checked={prefs[row.flag]}
                      disabled={setPrefsMutation.isPending}
                      onCheckedChange={value => setFlag(row.flag, value)}
                      aria-label={t.profile.prefToggleAria(row.label)}
                    />
                  </div>
                ))}
                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium">
                    {t.profile.thresholdsTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.profile.thresholdsIntro}
                  </p>
                  <div className="mt-2.5 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label
                        htmlFor="wind-threshold"
                        className="min-w-32 flex-1 text-sm font-normal"
                      >
                        {t.profile.thresholdWind}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {t.profile.thresholdWindHint(
                            WIND_DANGER_KMH,
                            WIND_THRESHOLD_MIN_KMH,
                            WIND_THRESHOLD_MAX_KMH
                          )}
                        </span>
                      </Label>
                      <Input
                        id="wind-threshold"
                        type="number"
                        inputMode="numeric"
                        className="w-20"
                        min={WIND_THRESHOLD_MIN_KMH}
                        max={WIND_THRESHOLD_MAX_KMH}
                        placeholder={String(WIND_DANGER_KMH)}
                        value={windInput}
                        disabled={setPrefsMutation.isPending}
                        onChange={e => setWindInput(e.target.value)}
                        onBlur={e => saveWindThreshold(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={
                          windThreshold === null || setPrefsMutation.isPending
                        }
                        onClick={() => saveWindThreshold("")}
                      >
                        {t.profile.thresholdReset}
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Label
                        htmlFor="rain-threshold"
                        className="min-w-32 flex-1 text-sm font-normal"
                      >
                        {t.profile.thresholdRain}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {t.profile.thresholdRainHint(
                            RAIN_DANGER_MM,
                            RAIN_THRESHOLD_MIN_MM,
                            RAIN_THRESHOLD_MAX_MM
                          )}
                        </span>
                      </Label>
                      <Input
                        id="rain-threshold"
                        type="number"
                        inputMode="numeric"
                        className="w-20"
                        min={RAIN_THRESHOLD_MIN_MM}
                        max={RAIN_THRESHOLD_MAX_MM}
                        placeholder={String(RAIN_DANGER_MM)}
                        value={rainInput}
                        disabled={setPrefsMutation.isPending}
                        onChange={e => setRainInput(e.target.value)}
                        onBlur={e => saveRainThreshold(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={
                          rainThreshold === null || setPrefsMutation.isPending
                        }
                        onClick={() => saveRainThreshold("")}
                      >
                        {t.profile.thresholdReset}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <LastCheckLine enabled={push.enabled === true} />
          </>
        )}
        <PushHistory />
      </CardContent>
    </Card>
  );
}

/**
 * «Letzte Prüfung: vor 42 Minuten» (#314).
 *
 * WARUM DAS HIER STEHT: Die Mitteilungen entstehen nicht im Browser,
 * sondern in einem stündlichen Cronjob auf dem Server. Fällt der aus,
 * bleibt alles still – und Stille ist von «es gab nichts zu melden»
 * nicht zu unterscheiden. Man merkt es erst, wenn eine Erinnerung
 * gefehlt hat, die man gebraucht hätte.
 *
 * Die Zeile steht dort, wo man Mitteilungen ohnehin ein- und ausschaltet,
 * und bleibt unauffällig, solange alles läuft. Erst wenn seit Stunden
 * nichts mehr geprüft wurde, wird sie deutlich.
 */
function LastCheckLine({ enabled }: { enabled: boolean }) {
  const { lang, t } = useI18n();
  const query = trpc.push.lastCheck.useQuery(undefined, { enabled });
  if (!enabled || query.data === undefined) return null;
  const health = pushCheckHealth(query.data.at, Date.now());
  const warn = health.state !== "ok";
  const text =
    health.state === "never"
      ? t.profile.lastCheckNever
      : t.profile.lastCheckAgo(
          formatMinutesAgo(health.minutesAgo, LOCALE_TAGS[lang])
        );
  return (
    <p
      className={`mt-4 flex items-start gap-1.5 border-t border-border pt-3 text-xs ${
        warn ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {warn ? (
        <TriangleAlert
          className="mt-px h-3.5 w-3.5 shrink-0"
          aria-hidden="true"
        />
      ) : (
        <Clock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {text}
        {warn && ` ${t.profile.lastCheckStale(PUSH_CHECK_STALE_HOURS)}`}
      </span>
    </p>
  );
}

/**
 * «vor 42 Minuten» / «vor 3 Stunden» in der eingestellten Sprache.
 * Intl beugt und übersetzt selbst – eine eigene Tabelle wäre viermal
 * dieselbe Regel, nur handgeschrieben.
 */
function formatMinutesAgo(minutes: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

/**
 * Abschnitt «Heim-Standort»: ein Wohnort pro Konto für Unwetter-Warnungen
 * und Sternschnuppen-Tipps – gesetzt per aktueller Position oder Ortssuche
 * (Open-Meteo-Geocoding, Muster Wetter-Vergleich), Name frei wählbar.
 */
function HomeLocationCard() {
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
    <Card className="mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <House className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.profile.homeTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}

/**
 * Abschnitt «Sicherheit: Passkeys»: hinterlegte Passkeys auflisten (Name +
 * Datum), neue per WebAuthn-Zeremonie hinzufügen und einzeln entfernen –
 * die Anmeldung mit Passwort bleibt daneben immer möglich.
 */
function PasskeysCard() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const supported = useMemo(() => browserSupportsWebAuthn(), []);
  const listQuery = trpc.auth.passkeyList.useQuery();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const optionsMutation = trpc.auth.passkeyRegisterOptions.useMutation();
  const verifyMutation = trpc.auth.passkeyRegisterVerify.useMutation();
  const removeMutation = trpc.auth.passkeyRemove.useMutation({
    onSuccess: () => {
      toast.success(t.profile.passkeyRemoved);
      void utils.auth.passkeyList.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  const addPasskey = async () => {
    if (adding) return;
    setAdding(true);
    try {
      const options = await optionsMutation.mutateAsync();
      const response = await startRegistration({ optionsJSON: options });
      await verifyMutation.mutateAsync({
        response,
        name: name.trim() || t.profile.passkeyDefaultName,
      });
      toast.success(t.profile.passkeyAdded);
      setName("");
      void utils.auth.passkeyList.invalidate();
    } catch (error) {
      const errorName = (error as { name?: string } | null)?.name;
      if (errorName === "InvalidStateError") {
        // Der Authenticator kennt das Konto schon (excludeCredentials)
        toast.error(t.profile.passkeyExists);
      } else if (
        errorName !== "NotAllowedError" &&
        errorName !== "AbortError"
      ) {
        toast.error(t.profile.passkeyAddFailed);
      }
    } finally {
      setAdding(false);
    }
  };

  const passkeys = listQuery.data ?? [];

  return (
    <Card className="mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Fingerprint className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.profile.passkeysTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          {t.profile.passkeysIntro}
        </p>
        {passkeys.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {passkeys.map(passkey => (
              <li
                key={passkey.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <p className="min-w-0 text-sm">
                  <span className="block truncate font-medium">
                    {passkey.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t.profile.passkeyAddedOn(
                      fmtMedium(new Date(passkey.createdAt), lang)
                    )}
                  </span>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={removeMutation.isPending}
                  onClick={async () => {
                    if (
                      await ask({
                        title: t.profile.passkeyRemoveConfirm(passkey.name),
                      })
                    ) {
                      removeMutation.mutate({ id: passkey.id });
                    }
                  }}
                  aria-label={t.profile.passkeyRemoveAria(passkey.name)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">
            {t.profile.passkeysEmpty}
          </p>
        )}
        {supported ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="passkey-name" className="mb-1.5 block text-xs">
                {t.profile.passkeyNameLabel}
              </Label>
              <Input
                id="passkey-name"
                value={name}
                maxLength={80}
                onChange={e => setName(e.target.value)}
                placeholder={t.profile.passkeyNamePlaceholder}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={adding}
                onClick={() => void addPasskey()}
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {adding ? t.profile.passkeyAdding : t.profile.passkeyAddButton}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t.profile.passkeysUnsupported}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Profil-Seite: Konto verwalten und App-Einstellungen. */
/**
 * Schnellzugriff-Leiste frei belegen (#297).
 *
 * Vier Auswahlfelder für die vier freien Plätze; Start und SOS stehen
 * als unveränderliche Enden daneben, damit man sieht, WARUM es nur vier
 * sind. Die Begründung dazu steht in shared/quickBar.ts.
 */
function QuickBarCard() {
  const { lang, t } = useI18n();
  const qb = t.quickBar;
  const [custom, setCustom] = useState<string[]>(() => loadQuickBar());
  const sync = useSyncedSetting<unknown>("quickBar", value => {
    setCustom(sanitizeQuickBar(value, quickBarChoices()));
  });

  const apply = (next: string[]) => {
    setCustom(next);
    saveQuickBar(next);
    sync.push(next);
    // Die Leiste steckt im AppShell und liest beim Laden aus dem
    // localStorage – ein Ereignis erspart einen globalen Zustand.
    window.dispatchEvent(new Event("campmesser:quickbar"));
  };

  const choices = modules
    .filter(module => module.path !== QUICK_BAR_START)
    .filter(module => module.path !== QUICK_BAR_SOS)
    .slice()
    .sort((a, b) => pick(a.title, lang).localeCompare(pick(b.title, lang)));

  return (
    <Card className="mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LayoutGrid className="h-4 w-4 text-primary" aria-hidden="true" />
          {qb.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{qb.intro}</p>
        <div className="mt-3 space-y-2">
          {custom.map((path, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-xs text-muted-foreground">
                {index + 1}.
              </span>
              <Select
                value={path}
                onValueChange={value =>
                  apply(setQuickBarSlot(custom, index, value))
                }
              >
                <SelectTrigger aria-label={qb.slotAria(index + 1)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {choices.map(module => (
                    <SelectItem key={module.path} value={module.path}>
                      {pick(module.title, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{qb.fixed}</p>
        {!isDefaultQuickBar(custom) && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-muted-foreground"
            onClick={() => apply([...DEFAULT_QUICK_BAR])}
          >
            {qb.reset}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { lang, t } = useI18n();
  const { user, isAuthenticated, loading, logout, refresh } = useAuth();
  const { setPreference } = useTheme();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [deletePw, setDeletePw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [themePref, setThemePref] = useState<ThemePreference | null>(() =>
    getThemePreference()
  );
  // «Was ist neu»: Dialog mit ALLEN Changelog-Blöcken (unabhängig vom Marker)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  /**
   * Alle Changelog-Blöcke – erst beim Klick geholt. Die Datei ist mit vier
   * Sprachen gegen 280 kB gross und gehört darum nicht ins Haupt-Bundle
   * (siehe data/changelog.ts).
   */
  const [changelogBlocks, setChangelogBlocks] = useState<ChangelogBlock[]>([]);
  const openWhatsNew = () => {
    void import("@/data/changelog")
      .then(({ changelog }) => {
        setChangelogBlocks(changelog);
        setWhatsNewOpen(true);
      })
      .catch(() => {
        /* Offline und nicht im Cache: der Eintrag bleibt einfach wirkungslos */
      });
  };

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const nameMutation = trpc.auth.updateName.useMutation({
    onSuccess: () => {
      toast.success(t.profile.nameUpdated);
      void utils.auth.me.invalidate();
      void refresh?.();
    },
    onError: e => toast.error(e.message),
  });
  // Bestätigungs-Mail erneut anfordern (nur sichtbar, wenn SMTP aktiv ist
  // und die Adresse des Kontos noch unbestätigt ist)
  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => toast.success(t.profile.verifySent),
    onError: e => {
      if (e.data?.code === "TOO_MANY_REQUESTS")
        toast.error(t.profile.verifyTooMany);
      else if (e.data?.code === "PRECONDITION_FAILED")
        toast.error(t.profile.verifyUnavailable);
      else toast.error(e.message);
    },
  });
  const emailMutation = trpc.auth.updateEmail.useMutation({
    onSuccess: () => {
      toast.success(t.profile.emailUpdated);
      setNewEmail("");
      setEmailPw("");
      void utils.auth.me.invalidate();
      void refresh?.();
    },
    onError: e => toast.error(e.message),
  });
  const pwMutation = trpc.auth.updatePassword.useMutation({
    onSuccess: () => {
      toast.success(t.profile.passwordUpdated);
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
    },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success(t.profile.accountDeleted);
      window.location.href = "/";
    },
    onError: e => toast.error(e.message),
  });

  /** Karten-App für Routen (lib/directions.ts): «ask» fragt wieder. */
  const [mapsPref, setMapsPref] = useState<MapsPreference>(() =>
    loadMapsPreference()
  );
  const chooseMapsApp = (value: MapsPreference) => {
    setMapsPref(value);
    saveMapsPreference(value);
  };

  /** Design-Präferenz speichern und sofort anwenden. */
  const chooseTheme = (pref: ThemePreference) => {
    saveThemePreference(pref);
    setThemePref(pref);
    setPreference?.(pref);
    toast.success(
      pref === "dark"
        ? t.profile.themeSavedDark
        : pref === "auto"
          ? t.profile.themeSavedAuto
          : t.profile.themeSavedLight
    );
  };

  if (loading) return null;
  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl py-6">
        <PageHeader
          title={t.profile.title}
          subtitle={t.profile.manageSubtitle}
        />
        <LoginPrompt feature={t.profile.loginFeature} />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title={t.profile.title}
        subtitle={t.profile.loggedInAs(user?.email ?? user?.name ?? "")}
      />

      {/* Dezenter Hinweis: E-Mail-Adresse noch unbestätigt (nur mit SMTP) */}
      {user?.verifyMailEnabled && user.email && !user.emailVerified && (
        <Card className="mb-5 border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <p className="flex flex-1 items-start gap-2 text-sm">
              <MailWarning
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              {t.profile.verifyHint}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={resendMutation.isPending}
              onClick={() => resendMutation.mutate({ lang })}
            >
              {resendMutation.isPending
                ? t.profile.verifySending
                : t.profile.verifyResend}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.profile.themeTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.profile.themeIntro}
          </p>
          <div
            className="flex gap-2"
            role="group"
            aria-label={t.profile.themeGroupAria}
          >
            <Button
              type="button"
              variant={themePref === "light" ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseTheme("light")}
            >
              <Sun className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
              {t.profile.themeLight}
            </Button>
            <Button
              type="button"
              variant={themePref === "dark" ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseTheme("dark")}
            >
              <Moon className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
              {t.profile.themeDark}
            </Button>
            <Button
              type="button"
              variant={themePref === "auto" ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseTheme("auto")}
            >
              <MonitorSmartphone
                className="mr-1.5 h-4 w-4"
                aria-hidden="true"
              />{" "}
              {t.profile.themeAuto}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Karten-App für Routen: Die Frage beim ersten Routen-Klick lässt
          sich hier nachträglich beantworten oder zurücksetzen. */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.directions.settingLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.directions.settingHint}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t.directions.settingLabel}
          >
            {(
              [
                ["ask", t.directions.settingAsk],
                ["apple", t.directions.apple],
                ["google", t.directions.google],
              ] as [MapsPreference, string][]
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={mapsPref === value ? "default" : "outline"}
                className="flex-1"
                onClick={() => chooseMapsApp(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <NotificationsCard />

      {/* Statistik: auf Nutzerwunsch im Profil statt als Startseiten-Kachel */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.stats.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t.stats.subtitle}</p>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/statistik">
              {t.stats.title}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Schnellzugriff-Leiste (#297) */}
      <QuickBarCard />

      {/* Papierkorb (#295): gehört zum Konto, nicht auf die Startseite */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.trash.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t.trash.intro(RETENTION_DAYS)}
          </p>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/papierkorb">
              {t.trash.profileLink}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <HomeLocationCard />

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.profile.nameTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              if (name.trim()) nameMutation.mutate({ name: name.trim() });
            }}
          >
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              aria-label={t.profile.nameAria}
              placeholder={t.profile.namePlaceholder}
            />
            <Button
              type="submit"
              disabled={nameMutation.isPending || !name.trim()}
            >
              {t.common.save}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.profile.emailTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.profile.emailCurrentPrefix}{" "}
            <span className="font-medium text-foreground">
              {user?.email ?? "–"}
            </span>
            {t.profile.emailCurrentSuffix}
          </p>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              emailMutation.mutate({
                newEmail: newEmail.trim(),
                currentPassword: emailPw,
                // Sprache für die neue Bestätigungs-Mail (falls SMTP aktiv)
                lang,
              });
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="email-new" className="mb-1.5 block text-xs">
                  {t.profile.newEmailLabel}
                </Label>
                <Input
                  id="email-new"
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email-pw" className="mb-1.5 block text-xs">
                  {t.profile.confirmWithPasswordLabel}
                </Label>
                <Input
                  id="email-pw"
                  type="password"
                  autoComplete="current-password"
                  value={emailPw}
                  onChange={e => setEmailPw(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={emailMutation.isPending || !newEmail.trim() || !emailPw}
              className="w-full sm:w-auto"
            >
              {t.profile.changeEmail}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.profile.passwordTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              if (newPw !== newPw2) {
                toast.error(t.profile.newPasswordsMismatch);
                return;
              }
              pwMutation.mutate({
                currentPassword: currentPw,
                newPassword: newPw,
              });
            }}
          >
            <div>
              <Label htmlFor="pw-current" className="mb-1.5 block text-xs">
                {t.profile.currentPasswordLabel}
              </Label>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="pw-new" className="mb-1.5 block text-xs">
                  {t.profile.newPasswordLabel}
                </Label>
                <Input
                  id="pw-new"
                  type="password"
                  autoComplete="new-password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                />
                <PasswordStrengthMeter password={newPw} />
              </div>
              <div>
                <Label htmlFor="pw-new2" className="mb-1.5 block text-xs">
                  {t.profile.repeatPasswordLabel}
                </Label>
                <Input
                  id="pw-new2"
                  type="password"
                  autoComplete="new-password"
                  value={newPw2}
                  onChange={e => setNewPw2(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={pwMutation.isPending || !currentPw || !newPw || !newPw2}
              className="w-full sm:w-auto"
            >
              {t.profile.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PasskeysCard />

      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t.profile.deleteTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.profile.deleteIntro}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
                {t.profile.deleteButton}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t.profile.deleteConfirmTitle}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t.profile.deleteConfirmDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-1">
                <Label htmlFor="pw-delete" className="mb-1.5 block text-xs">
                  {t.profile.passwordLabel}
                </Label>
                <Input
                  id="pw-delete"
                  type="password"
                  autoComplete="current-password"
                  value={deletePw}
                  onChange={e => setDeletePw(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={!deletePw || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ password: deletePw })}
                >
                  {t.profile.deleteFinal}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="mt-5">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => logout()}
        >
          <LogOut className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
          {t.shell.logout}
        </Button>
      </div>

      {/* «Was ist neu»: alle bisherigen Neuerungen nachlesen */}
      <div className="mt-6 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={openWhatsNew}
        >
          <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.whatsNew.title}
        </Button>
      </div>
      <WhatsNewDialog
        open={whatsNewOpen}
        onOpenChange={setWhatsNewOpen}
        blocks={changelogBlocks}
        intro={t.whatsNew.allIntro}
      />

      {/* Absturzmeldungen (#352) – nur für Admin-Konten sichtbar */}
      <ClientErrorLog />

      {/* Versions-Anzeige: welcher Build läuft gerade? */}
      <p className="mt-2 text-center text-xs text-muted-foreground/70">
        {t.profile.versionLine(__APP_VERSION__)}
        {__APP_VERSION__ !== "dev" &&
          t.profile.buildDate(fmtMedium(new Date(__APP_BUILT_AT__), lang))}
      </p>
    </div>
  );
}
