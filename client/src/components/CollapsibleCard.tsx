/**
 * Ein-/ausklappbare Karte (#408, Nutzerwunsch 07.08.2026).
 *
 * FÜRS PROFIL GEBAUT: Die Seite war ein Stapel aus fünfzehn offenen
 * Karten – wer das Design umstellen wollte, scrollte an Passkeys und
 * Kalender-Abo vorbei. Eingeklappt ist jede Karte eine Zeile, und die
 * Seite liest sich wie ein Inhaltsverzeichnis. STANDARD ZU: Eine
 * Einstellung stellt man selten um; der eine Handgriff zum Aufklappen
 * ist billiger als das ewige Scrollen.
 */
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CollapsibleCard({
  title,
  icon,
  children,
  className,
  titleClassName,
  defaultOpen = false,
}: {
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className={cn("text-base", titleClassName)}>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            className="flex w-full items-center gap-2 text-left"
          >
            {icon}
            {title}
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        </CardTitle>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}
