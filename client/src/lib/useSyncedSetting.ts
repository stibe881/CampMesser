/**
 * Geräte-Sync für lokale Einstellungen: localStorage bleibt die schnelle,
 * offlinefähige Quelle – bei angemeldeten Nutzer*innen gewinnt einmal pro
 * Seitenaufruf der Server-Stand, und jede lokale Änderung wird per push()
 * ans Konto geschrieben. Ohne Anmeldung ist der Hook wirkungslos.
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import type { SyncedSettingKey } from "@shared/settings";

export function useSyncedSetting<T>(
  key: SyncedSettingKey,
  onServerValue: (value: T) => void,
  options: {
    /**
     * Den Server-Stand übernehmen? Standard ja.
     *
     * `false` braucht, wer nur SENDEN will, weil eine andere Stelle schon
     * empfängt (#360): Design und Karten-App werden app-weit in
     * `SettingsSync` übernommen – auf einem zweiten Gerät soll das Design
     * stimmen, ohne dass man erst ins Profil geht. Die Profil-Seite
     * schickt nur noch, was man dort umstellt. Zwei Empfänger für
     * denselben Schlüssel wären kein Fehler, aber eine Einladung dazu.
     */
    receive?: boolean;
  } = {}
): { push: (value: T) => void } {
  const receive = options.receive !== false;
  const { isAuthenticated } = useAuth();
  const query = trpc.settings.all.useQuery(undefined, {
    enabled: isAuthenticated && receive,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const setMutation = trpc.settings.set.useMutation();

  // Callback in einer Ref halten, damit der Effekt nicht bei jedem Render feuert
  const applied = useRef(false);
  const callbackRef = useRef(onServerValue);
  callbackRef.current = onServerValue;

  useEffect(() => {
    if (!receive || applied.current || !query.data) return;
    applied.current = true;
    const raw = query.data[key];
    if (raw === undefined) return;
    try {
      callbackRef.current(JSON.parse(raw) as T);
    } catch {
      // Kaputter Server-Wert: lokalen Stand behalten, nächster push repariert ihn
    }
  }, [query.data, key]);

  const authRef = useRef(isAuthenticated);
  authRef.current = isAuthenticated;
  const mutateRef = useRef(setMutation.mutate);
  mutateRef.current = setMutation.mutate;

  const pushRef = useRef((value: T) => {
    if (!authRef.current) return;
    try {
      mutateRef.current({ key, value: JSON.stringify(value) });
    } catch {
      // Nicht serialisierbar oder Netzfehler: lokale Speicherung reicht
    }
  });

  return { push: pushRef.current };
}
