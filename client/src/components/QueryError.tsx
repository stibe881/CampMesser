import { CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

/**
 * «Konnte nicht geladen werden» – der fehlende dritte Zustand.
 *
 * DAS PROBLEM: Fast alle Listenseiten prüften nur `isLoading` und zeigten
 * danach den Leer-Zustand. Antwortet der Server mit einem Fehler – ein
 * Deployment läuft, die Datenbank hakt, die Sitzung ist abgelaufen –, ist
 * `isLoading` false und `data` undefined. Die Seite behauptete dann
 * «Noch keine Zeltplätze gespeichert». Das ist keine Ungenauigkeit, das ist
 * eine falsche Aussage über die eigenen Daten, und sie lädt zum Neuanlegen
 * ein, was man gerade nicht will.
 *
 * Seit der Offline-Speicher (#302) leere Listen seltener macht, wiegt der
 * Unterschied noch schwerer: Eine leere Liste sieht heute genauso aus wie
 * eine echte.
 *
 * ZWEI FÄLLE, ZWEI TEXTE: Ohne Verbindung ist nichts kaputt – da wartet man
 * einfach, und das Band oben sagt es ohnehin schon. Antwortet dagegen der
 * Server nicht wie erwartet, gehört ein Knopf hin, der es nochmal versucht;
 * das genügt in der Mehrzahl der Fälle (Neustart nach Deployment).
 */
export default function QueryError({
  onRetry,
  retrying = false,
}: {
  onRetry: () => void;
  retrying?: boolean;
}) {
  const online = useOnlineStatus();
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-6 text-center"
    >
      {online ? (
        <TriangleAlert
          className="mx-auto mb-3 h-8 w-8 text-destructive/70"
          aria-hidden="true"
        />
      ) : (
        <CloudOff
          className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
          aria-hidden="true"
        />
      )}
      <p className="font-medium">
        {online ? t.queryError.title : t.queryError.offlineTitle}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {online ? t.queryError.text : t.queryError.offlineText}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={onRetry}
        disabled={retrying}
      >
        <RefreshCw
          className={`mr-1.5 h-4 w-4 ${retrying ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {t.queryError.retry}
      </Button>
    </div>
  );
}
