/**
 * Profil-Karte «NotificationsCard» – aus Profile.tsx herausgelöst (#414).
 * Die Seite war nach #408 über 1600 Zeilen; die fünf grossen Karten
 * wohnen jetzt hier (Muster wie die Aufteilung von Trips.tsx, #322).
 */
import { useEffect, useState } from "react";
import CollapsibleCard from "@/components/CollapsibleCard";
import { toast } from "sonner";
import { BellRing, Clock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushSubscription } from "@/lib/usePushSubscription";
import { clearAppBadge, isAppBadgeSupported } from "@/lib/appBadge";
import {
  loadAppBadgeEnabled,
  saveAppBadgeEnabled,
} from "@/lib/appBadgeSetting";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { PUSH_CHECK_STALE_HOURS, pushCheckHealth } from "@shared/pushHealth";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
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

/**
 * Abschnitt «Mitteilungen»: Push-Abo dieses Geräts (an/aus), welche
 * Mitteilungs-Arten es erhalten soll, und die Zahl am App-Icon.
 *
 * DER VERLAUF IST HIER WEG (#374): Er stand unten in dieser Karte hinter
 * einem Aufklapper. Ins Profil geht man aber, um Einstellungen zu ändern
 * – wer NACHSCHAUEN will, was gemeldet wurde, sucht nicht hier. Er hängt
 * jetzt an der Glocke in der Kopfzeile (`NotificationBell`), samt Punkt
 * für alles, was seit dem letzten Blick dazukam.
 */
export default function NotificationsCard() {
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
    <CollapsibleCard
      className="mb-5"
      icon={<BellRing className="h-4 w-4 text-primary" aria-hidden="true" />}
      title={t.profile.notificationsTitle}
    >
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
              <p className="text-sm font-medium">{t.profile.pushDeviceTitle}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t.profile.pushDeviceDesc}
              </p>
            </div>
            <Switch
              checked={push.enabled ?? false}
              disabled={push.busy || push.enabled === null || !push.configured}
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
      <AppBadgeRow />
    </CollapsibleCard>
  );
}

/**
 * «Zahl am App-Icon» (#373).
 *
 * WARUM DIESER SCHALTER HIER STEHT: Die Zahl am Icon sieht aus wie eine
 * ungelesene Mitteilung, ist aber keine – sie zählt heute und morgen
 * ablaufende Kühlbox-Einträge und fällige Pflege-Aufgaben. Eine
 * Pflege-Aufgabe bleibt fällig, bis man sie abhakt, notfalls monatelang.
 * Am Icon steht dann eine «1», die man nirgends wegtippen kann, weil in
 * der App nichts Ungelesenes liegt.
 *
 * Er steht bewusst AUSSERHALB der Push-Bedingungen darüber: Die Zahl hat
 * mit Mitteilungen nichts zu tun und funktioniert auch ohne Push-Abo.
 * Angezeigt wird er nur dort, wo es das App-Icon überhaupt gibt – im
 * Browser-Tab wäre er ohne Wirkung.
 */
function AppBadgeRow() {
  const { t } = useI18n();
  const [enabled, setEnabled] = useState(() => loadAppBadgeEnabled());
  // Nur SENDEN – empfangen tut der Zähler selbst in AppShell (#360-Muster).
  const sync = useSyncedSetting<boolean>("appBadge", () => {}, {
    receive: false,
  });
  if (!isAppBadgeSupported()) return null;

  const change = (next: boolean) => {
    setEnabled(next);
    saveAppBadgeEnabled(next);
    sync.push(next);
    // Sofort weg, nicht erst beim nächsten Rechnen – genau das ist der
    // Grund, warum jemand diesen Schalter sucht.
    if (!next) clearAppBadge();
  };

  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{t.profile.appBadgeTitle}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t.profile.appBadgeDesc}
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={change}
        aria-label={t.profile.appBadgeAria}
      />
    </div>
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
