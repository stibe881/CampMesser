/**
 * Druck-Knopf für alle Druckseiten.
 *
 * Im Browser genügt window.print(). In der INSTALLIERTEN App (PWA) ist
 * das wirkungslos – der Knopf öffnet die Seite deshalb als echten Link
 * mit target="_blank" im Browser, angemeldet über ein kurzlebiges
 * Druck-Ticket (/api/print-login, dritter Anlauf 09.08.2026).
 *
 * VIERTER ANLAUF (09.08.2026, «Pass drucken funktioniert immer noch
 * nicht»): In der NATIVEN App (WebView der Expo-Hülle) griff KEINER der
 * bisherigen Fixe – isStandaloneApp() ist im WebView false (kein
 * display-mode: standalone, kein navigator.standalone), der Knopf rief
 * window.print() auf, und das tut dort schlicht nichts. Dazu hält
 * onShouldStartLoadWithRequest same-origin-Links IM WebView, ein
 * Ticket-Link hätte also nur die App-Ansicht ersetzt. Deshalb geht die
 * native App jetzt über die Brücke: OPEN_EXTERNAL_URL öffnet die
 * Ticket-Adresse in Safari – dort meldet /api/print-login den Tab an,
 * leitet auf die Druckseite weiter, und der Druckdialog funktioniert.
 */
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { isStandaloneApp } from "@/lib/standalone";
import { isNativeApp, openExternalUrl } from "@/lib/nativeBridge";

export default function PrintButton({
  label,
  size = "sm",
  variant = "default",
  className,
}: {
  label: string;
  size?: "sm" | "default";
  variant?: "default" | "outline";
  className?: string;
}) {
  const { isAuthenticated } = useAuth();
  const standalone = isStandaloneApp();
  const native = isNativeApp();
  // Das Ticket läuft nach 30 Minuten ab – alle 20 Minuten erneuern,
  // solange die Seite offen ist, dazu beim Fokuswechsel (Query-Standard).
  const ticketQuery = trpc.auth.printTicket.useQuery(undefined, {
    enabled: (standalone || native) && isAuthenticated,
    staleTime: 10 * 60_000,
    refetchInterval: 20 * 60_000,
  });

  const icon = <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />;

  /**
   * Absolute Ziel-Adresse für den Browser-Tab: mit Ticket angemeldet,
   * ohne Ticket (noch nicht geladen, abgemeldet) die nackte Seite als
   * Rückfall – dort steht der ehrliche Anmelde-Hinweis. Absolut, weil
   * Safari aus der nativen App eine volle Adresse braucht.
   */
  const browserHref = () => {
    const target = window.location.pathname + window.location.search;
    const ticket = ticketQuery.data?.ticket;
    return ticket
      ? `${window.location.origin}/api/print-login?ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent(target)}`
      : window.location.href;
  };

  // Native App: Safari über die Brücke öffnen – ein Link bliebe im WebView.
  if (native) {
    return (
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => openExternalUrl(browserHref())}
      >
        {icon}
        {label}
      </Button>
    );
  }

  if (standalone) {
    return (
      <Button asChild size={size} variant={variant} className={className}>
        <a href={browserHref()} target="_blank" rel="noopener noreferrer">
          {icon}
          {label}
        </a>
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={() => window.print()}
    >
      {icon}
      {label}
    </Button>
  );
}
