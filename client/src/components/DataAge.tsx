import { History } from "lucide-react";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

/**
 * «Stand von …» – zeigt ohne Verbindung, wie alt die angezeigten Daten sind.
 *
 * Erscheint bewusst NUR offline: Online sind die Daten frisch, und eine
 * Zeitangabe an jeder Liste wäre bloss Rauschen. Ohne Empfang dagegen ist
 * es die entscheidende Auskunft – eine Packliste von heute Morgen ist
 * brauchbar, eine von letzter Woche nicht unbedingt.
 *
 * `updatedAt` ist `dataUpdatedAt` der Abfrage (0, solange nie geladen wurde).
 */
export default function DataAge({ updatedAt }: { updatedAt: number }) {
  const online = useOnlineStatus();
  const { lang, t } = useI18n();
  if (online || !updatedAt) return null;
  const stamp = new Date(updatedAt);
  const today = new Date();
  const sameDay = stamp.toDateString() === today.toDateString();
  const formatted = sameDay
    ? stamp.toLocaleTimeString(LOCALE_TAGS[lang], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : stamp.toLocaleString(LOCALE_TAGS[lang], {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
  return (
    <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {t.offline.dataAge(formatted)}
    </p>
  );
}
