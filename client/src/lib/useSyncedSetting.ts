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
): { push: (value: T) => void } {
  const { isAuthenticated } = useAuth();
  const query = trpc.settings.all.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const setMutation = trpc.settings.set.useMutation();

  // Callback in einer Ref halten, damit der Effekt nicht bei jedem Render feuert
  const applied = useRef(false);
  const callbackRef = useRef(onServerValue);
  callbackRef.current = onServerValue;

  useEffect(() => {
    if (applied.current || !query.data) return;
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
