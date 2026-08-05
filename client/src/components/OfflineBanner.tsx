import { CloudOff } from "lucide-react";
import { useI18n } from "@/i18n";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

/**
 * Schmales Band unter der Kopfzeile, solange keine Verbindung besteht.
 *
 * Ohne diesen Hinweis war der Zustand nicht erkennbar: Seit die eigenen
 * Daten aus dem Offline-Speicher kommen (lib/queryPersistence.ts), sieht
 * eine Liste ohne Empfang genauso aus wie eine frisch geladene – nur dass
 * eine Änderung von jemand anderem fehlen könnte. Das Band sagt genau das,
 * und die betroffenen Seiten ergänzen darunter den Stand der Daten.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useI18n();
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-amber-500/15 px-4 py-1.5 text-center text-xs text-amber-900 dark:text-amber-200"
    >
      <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{t.offline.banner}</span>
    </div>
  );
}
