/**
 * ÖV-Verbindung zur Anreise (#491): die nächsten Verbindungen von
 * daheim zum Reiseziel aus dem offenen Schweizer Fahrplan
 * (transport.opendata.ch) – die Anreise-Navigation (#103) kennt bisher
 * nur das Auto. Gesucht wird erst beim Aufklappen; ohne hinterlegten
 * Heim-Standort erklärt der Kasten den Weg ins Profil, und ausserhalb
 * der Fahrplan-Abdeckung bleibt die Liste ehrlich leer.
 */
import { useCallback, useRef, useState } from "react";
import { ChevronDown, TrainFront } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { LOCALE_TAGS } from "@shared/i18n";
import {
  connectionsUrl,
  parseConnections,
  type TransitConnection,
} from "@shared/transport";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "ready" | "failed";

export default function TransitConnections({
  latitude,
  longitude,
  placeName,
  className,
}: {
  latitude: number;
  longitude: number;
  placeName?: string | null;
  className?: string;
}) {
  const { lang, t } = useI18n();
  const tc = t.connections;
  const { isAuthenticated } = useAuth();
  const homeQuery = trpc.home.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const home = homeQuery.data ?? null;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [connections, setConnections] = useState<TransitConnection[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async () => {
    if (!home) return;
    setStatus("loading");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(
        connectionsUrl(
          { lat: home.latitude, lon: home.longitude },
          { lat: latitude, lon: longitude }
        ),
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`connections ${res.status}`);
      setConnections(parseConnections(await res.json()));
      setStatus("ready");
    } catch {
      if (controller.signal.aborted) return;
      setStatus("failed");
    }
  }, [home, latitude, longitude]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && status === "idle" && home) void search();
  };

  const time = (sec: number) =>
    new Date(sec * 1000).toLocaleTimeString(LOCALE_TAGS[lang], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4", className)}
      aria-label={tc.title}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="transit-connections"
        className="flex w-full items-center gap-2 text-left"
      >
        <TrainFront className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold">{tc.title}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <p className="mt-1 text-sm text-muted-foreground">
        {placeName ? tc.subtitleAtPlace(placeName) : tc.subtitle}
      </p>

      {open && (
        <div id="transit-connections">
          {!home ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {tc.noHome}{" "}
              <Link
                href="/profil"
                className="font-medium text-primary hover:underline"
              >
                {tc.noHomeLink}
              </Link>
            </p>
          ) : status === "loading" ? (
            <div
              className="mt-3 space-y-2"
              role="status"
              aria-busy="true"
              aria-label={t.poi.loading}
            >
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : status === "failed" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t.poi.loadFailed}
            </p>
          ) : status === "ready" && connections.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{tc.empty}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {connections.map(connection => (
                <li
                  key={connection.key}
                  className="rounded-lg border border-border/70 bg-background p-3 text-sm"
                >
                  <p className="font-medium">
                    {time(connection.departureSec)} –{" "}
                    {time(connection.arrivalSec)}
                    {connection.durationMin != null &&
                      ` · ${tc.durationLine(connection.durationMin)}`}
                    {` · ${tc.transfersLine(connection.transfers)}`}
                  </p>
                  {(connection.fromName || connection.toName) && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[connection.fromName, connection.toName]
                        .filter(Boolean)
                        .join(" → ")}
                    </p>
                  )}
                  {connection.products.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {connection.products.join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{tc.source}</p>
    </section>
  );
}
