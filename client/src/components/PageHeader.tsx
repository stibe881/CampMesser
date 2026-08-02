import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/i18n";

/** Einheitlicher Seitenkopf mit Zurück-Link zur Startseite. */
export default function PageHeader({
  title,
  subtitle,
  backHref = "/",
  backLabel,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const t = useT();
  const label = backLabel ?? t.pageHeader.overview;
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t.pageHeader.backAria(label)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label}
      </Link>
      <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 max-w-2xl text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
