/**
 * Druck-Knopf für alle Druckseiten.
 *
 * Im Browser genügt window.print(). In der INSTALLIERTEN App (PWA) ist
 * das wirkungslos – und auch window.open() wird dort von iOS teils
 * verschluckt (Nutzermeldung 09.08.2026: «Pass drucken funktioniert
 * nicht», trotz Browser-Öffnen-Weiche). Ein ECHTER Link mit
 * target="_blank" ist der zuverlässige Weg aus dem Standalone-Fenster
 * hinaus nach Safari, wo der Druckdialog («Als PDF sichern»)
 * funktioniert. Deshalb rendert der Knopf im Standalone-Modus einen Link
 * auf die eigene Adresse statt eines onClick.
 */
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const icon = <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />;
  if (isStandaloneApp()) {
    return (
      <Button asChild size={size} variant={variant} className={className}>
        <a
          href={window.location.href}
          target="_blank"
          rel="noopener noreferrer"
        >
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
