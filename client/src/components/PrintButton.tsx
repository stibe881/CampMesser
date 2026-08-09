/**
 * Druck-Knopf für alle Druckseiten.
 *
 * Im Browser genügt window.print(). In der INSTALLIERTEN App (PWA) ist
 * das wirkungslos – der Knopf öffnet die Seite deshalb als echten Link
 * mit target="_blank" im Browser. DER HAKEN (dritter Anlauf «Pass
 * drucken», 09.08.2026): Der so geöffnete Tab teilt die Cookies der
 * installierten App nicht – er zeigte «Anmeldung erforderlich» statt der
 * Druckseite. Deshalb hängt am Link jetzt ein kurzlebiges Druck-Ticket:
 * /api/print-login meldet den Tab an und leitet auf die Druckseite
 * weiter. Ohne Ticket (noch nicht geladen, abgemeldet) bleibt der nackte
 * Link als Rückfall.
 */
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { isStandaloneApp } from "@/lib/standalone";

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
  // Das Ticket läuft nach 30 Minuten ab – alle 20 Minuten erneuern,
  // solange die Seite offen ist, dazu beim Fokuswechsel (Query-Standard).
  const ticketQuery = trpc.auth.printTicket.useQuery(undefined, {
    enabled: standalone && isAuthenticated,
    staleTime: 10 * 60_000,
    refetchInterval: 20 * 60_000,
  });

  const icon = <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />;
  if (standalone) {
    const target = window.location.pathname + window.location.search;
    const ticket = ticketQuery.data?.ticket;
    const href = ticket
      ? `/api/print-login?ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent(target)}`
      : window.location.href;
    return (
      <Button asChild size={size} variant={variant} className={className}>
        <a href={href} target="_blank" rel="noopener noreferrer">
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
