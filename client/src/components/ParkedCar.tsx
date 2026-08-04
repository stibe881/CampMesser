/**
 * Auto-Standort merken (#283): ein Knopf, eine Parkuhr, eine Notiz.
 *
 * Die Peilung zurück zum Auto macht der Zelt-Finder selbst – das Auto ist
 * für ihn ein Ziel wie jedes andere. Dieses Bauteil kümmert sich nur um
 * das, was am Auto anders ist: Es speichert mit EINEM Tipp (kein Formular,
 * kein Name – man steigt aus und geht), zeigt, wie lange es schon steht,
 * und nimmt eine Notiz auf. Im Parkhaus ist GPS wertlos; was hilft, ist
 * «Ebene 3, Reihe C».
 *
 * Die Parkuhr ist bewusst eine ANZEIGE und keine Benachrichtigung: Eine
 * verlässliche Erinnerung bräuchte einen Push mit Zeitpunkt, und ein Push,
 * der im Funkloch nicht ankommt, wäre gefährlicher als gar keiner.
 */
import { useEffect, useState } from "react";
import { Car, Clock, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  PARKING_LIMITS,
  PARKING_NOTE_MAX_LENGTH,
  parkingStatus,
  splitDuration,
  type ParkingLimit,
} from "@shared/parking";
import type { TentFinderTarget } from "@/lib/tentFinderTargets";
import { cn } from "@/lib/utils";

export default function ParkedCar({
  car,
  onPark,
  onChange,
  onForget,
  onSelect,
  saving,
  className,
}: {
  car: TentFinderTarget | undefined;
  onPark: () => void;
  onChange: (changes: {
    note?: string;
    parkingLimitMinutes?: number | null;
  }) => void;
  onForget: () => void;
  onSelect: () => void;
  saving: boolean;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const pk = t.parking;
  const [note, setNote] = useState(car?.note ?? "");
  // Die Parkuhr läuft weiter, während die Seite offen bleibt
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNote(car?.note ?? "");
  }, [car?.id, car?.savedAt, car?.note]);

  useEffect(() => {
    if (!car) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [car]);

  const status = car
    ? parkingStatus(car.savedAt, car.parkingLimitMinutes, now)
    : null;

  /** «2 h 05 min» bzw. «45 min» – die Wortwahl kommt aus der Sprachdatei. */
  const duration = (minutes: number) => {
    const parts = splitDuration(minutes);
    return parts.hours > 0
      ? pk.durationHours(parts.hours, parts.minutes)
      : pk.durationMinutes(parts.minutes);
  };

  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-3", className)}
    >
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Car className="h-4 w-4 text-primary" aria-hidden="true" />
        {pk.title}
      </p>

      {!car ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">{pk.empty}</p>
          <Button size="sm" className="mt-2" onClick={onPark} disabled={saving}>
            {pk.park}
          </Button>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-sm">
            {pk.parkedSince(
              new Date(car.savedAt).toLocaleTimeString(LOCALE_TAGS[lang], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              duration(status?.elapsedMinutes ?? 0)
            )}
          </p>

          {status && status.state !== "none" && (
            <p
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm",
                status.state === "expired"
                  ? "bg-destructive/10 text-destructive"
                  : status.state === "soon"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-accent/50 text-muted-foreground"
              )}
            >
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {status.state === "expired"
                ? pk.expired
                : pk.remaining(duration(status.remainingMinutes ?? 0))}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{pk.limit}</span>
            <Button
              size="sm"
              variant={
                car.parkingLimitMinutes === undefined ? "default" : "outline"
              }
              onClick={() => onChange({ parkingLimitMinutes: null })}
            >
              {pk.limitNone}
            </Button>
            {PARKING_LIMITS.map(minutes => (
              <Button
                key={minutes}
                size="sm"
                variant={
                  car.parkingLimitMinutes === minutes ? "default" : "outline"
                }
                onClick={() =>
                  onChange({ parkingLimitMinutes: minutes as ParkingLimit })
                }
              >
                {pk.limitLabel(minutes)}
              </Button>
            ))}
          </div>

          <div>
            <Input
              value={note}
              maxLength={PARKING_NOTE_MAX_LENGTH}
              placeholder={pk.notePlaceholder}
              onChange={e => setNote(e.target.value)}
              onBlur={() => {
                if ((car.note ?? "") !== note.trim()) onChange({ note });
              }}
              aria-label={pk.noteLabel}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onSelect}>
              <MapPin className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {pk.navigate}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onPark}
              disabled={saving}
            >
              {pk.reparked}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onForget();
                toast.success(pk.forgotten);
              }}
              aria-label={pk.forgetAria}
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
