import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";

/**
 * Platzhalter-Zeilen, solange eine Liste lädt.
 *
 * Statt eines kreisenden Rädchens in der leeren Mitte: Der Aufbau der
 * Seite ist damit schon zu sehen, bevor die Daten da sind, und beim
 * Eintreffen springt nichts mehr – die Zeilen werden bloss gefüllt. Das
 * kreisende Rädchen sagte «es passiert etwas», die Balken sagen zusätzlich
 * «und zwar hier».
 *
 * `aria-busy` samt Beschriftung ersetzt die Rolle, die vorher das Rädchen
 * hatte: Eine Vorlesehilfe meldet weiterhin, dass geladen wird.
 */
export default function ListSkeleton({
  rows = 3,
  height = 72,
}: {
  rows?: number;
  height?: number;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3" aria-busy="true" aria-label={t.common.loading}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className="w-full rounded-xl"
          style={{ height }}
        />
      ))}
    </div>
  );
}
