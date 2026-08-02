import { LogIn } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

/** Freundlicher Hinweis mit Anmelde-Button für geschützte Funktionen. */
export default function LoginPrompt({ feature }: { feature: string }) {
  const t = useT();
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <LogIn
        className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
        aria-hidden="true"
      />
      <p className="font-medium">{t.loginPrompt.required}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {t.loginPrompt.body(feature)}
      </p>
      <Button asChild className="mt-4">
        <Link href="/anmelden" aria-label={t.loginPrompt.cta}>
          {t.loginPrompt.cta}
        </Link>
      </Button>
    </div>
  );
}
