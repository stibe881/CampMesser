import { useState } from "react";
import { Bug, ChevronDown, Loader2 } from "lucide-react";
import { fmtMedium } from "@/lib/dateFormat";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

/**
 * Die letzten Abstürze im Browser – sichtbar statt nur protokolliert (#352).
 *
 * SEIT #36 melden Abstürze an `/api/log`, und der Server hängt sie an
 * `logs/client-errors.log`. Gelesen hat diese Datei nie jemand: Man hätte
 * sich dafür per SSH auf den Server verbinden müssen. Eine Absturzschleife
 * fiel damit erst auf, wenn sich jemand beschwerte. Genau diese Lücke hat
 * #314 beim Cron-Lauf geschlossen – hier dieselbe Antwort.
 *
 * NUR FÜR ADMIN-KONTEN, und zwar zweifach abgesichert: Der Endpunkt ist
 * eine `adminProcedure`, und die Karte erscheint gar nicht erst, wenn die
 * Rolle nicht stimmt. In den Meldungen stehen Pfade und Stapelspuren
 * fremder Geräte; das geht nur die Person etwas an, die den Server
 * betreibt.
 *
 * GELADEN WIRD ERST BEIM AUFKLAPPEN. Das Profil ist keine Werkstatt –
 * wer bloss sein Passwort ändert, soll dafür keine Protokolldatei lesen.
 */
export default function ClientErrorLog() {
  const { t } = useI18n();
  const { lang } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ce = t.clientErrors;

  const isAdmin = user !== null && (user as { role?: string }).role === "admin";

  const query = trpc.system.clientErrors.useQuery(undefined, {
    enabled: open && isAdmin,
    staleTime: 30_000,
  });

  if (!isAdmin) return null;

  const entries = query.data?.entries ?? [];
  const byMessage = query.data?.byMessage ?? [];

  return (
    <div className="mt-4 rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={ce.toggleAria}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm"
      >
        <Bug className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {ce.title}
        </span>
        {open && !query.isLoading && entries.length > 0 && (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {ce.count(entries.length)}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2.5">
          <p className="mb-2 text-xs text-muted-foreground">{ce.hint}</p>
          {query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : query.isError ? (
            <p className="text-sm text-muted-foreground">{ce.loadFailed}</p>
          ) : entries.length === 0 ? (
            // Kein Protokoll ist keine Panne, sondern die gute Nachricht.
            <p className="text-sm text-muted-foreground">{ce.empty}</p>
          ) : (
            <>
              {/* Häufigste Meldung zuerst: Eine Absturzschleife sieht in
                  einer reinen Liste aus wie dreissig verschiedene
                  Probleme. */}
              {byMessage.length > 1 && (
                <ul className="mb-3 space-y-1">
                  {byMessage.slice(0, 3).map(row => (
                    <li key={row.message} className="flex gap-2 text-xs">
                      <span className="shrink-0 font-semibold">
                        {row.count}×
                      </span>
                      <span className="min-w-0 break-words">{row.message}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="space-y-2">
                {entries.map((entry, index) => (
                  <li
                    key={`${entry.at}-${index}`}
                    className="rounded border border-border/70 px-2.5 py-2"
                  >
                    <p className="text-xs text-muted-foreground">
                      {fmtMedium(new Date(entry.at), lang)}
                      {entry.url ? ` · ${entry.url}` : ""}
                    </p>
                    <p className="mt-0.5 break-words text-sm font-medium">
                      {entry.message || "—"}
                    </p>
                    {entry.stack && (
                      <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-tight text-muted-foreground">
                        {entry.stack}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
