import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

/** Einheitlicher Seitenkopf mit Zurück-Link zur Startseite. */
export default function PageHeader({
  title,
  subtitle,
  backHref = "/",
  backLabel = "Übersicht",
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-label={`Zurück zur ${backLabel}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 max-w-2xl text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
