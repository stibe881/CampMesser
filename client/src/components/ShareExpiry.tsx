/**
 * Gültigkeitsdauer eines Teil-Links: kompakte Auswahl «unbegrenzt / 7 / 30 /
 * 90 Tage» plus die Anzeige «Läuft ab am …» für bereits erzeugte Links.
 * Wird von allen Teilen-Dialogen benutzt (Packliste, Platz-Dossier,
 * Packvorlagen, Reise-Hub, Familien-Quiz, Rezepte, Einkaufsliste), damit
 * Wortwahl und Bedienung überall gleich sind.
 */
import { SHARE_EXPIRY_DAYS, type ShareExpiryDays } from "@shared/sharing";
import { LOCALE_TAGS } from "@shared/i18n";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function ShareExpirySelect({
  value,
  onChange,
  className,
}: {
  /** Gewählte Dauer in Tagen; null = unbegrenzt. */
  value: ShareExpiryDays | null;
  onChange: (value: ShareExpiryDays | null) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const options: (ShareExpiryDays | null)[] = [null, ...SHARE_EXPIRY_DAYS];
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="group"
      aria-label={t.sharing.validityAria}
    >
      <span className="text-xs text-muted-foreground">
        {t.sharing.validityLabel}
      </span>
      {options.map(option => (
        <button
          key={option ?? "unlimited"}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            value === option
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {option === null
            ? t.sharing.validityUnlimited
            : t.sharing.validityDays(option)}
        </button>
      ))}
    </div>
  );
}

/**
 * «Läuft ab am …» – rendert nichts, solange kein Ablauf gesetzt ist
 * (unbegrenzt gültige Links brauchen keinen Hinweis).
 */
export function ShareExpiryNote({
  expiresAt,
  className,
}: {
  expiresAt: Date | string | null | undefined;
  className?: string;
}) {
  const { lang, t } = useI18n();
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {t.sharing.expiresOn(
        date.toLocaleDateString(LOCALE_TAGS[lang], {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      )}
    </p>
  );
}
