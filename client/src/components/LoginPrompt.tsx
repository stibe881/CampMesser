import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";

/** Freundlicher Hinweis mit Anmelde-Button für geschützte Funktionen. */
export default function LoginPrompt({ feature }: { feature: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <LogIn className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
      <p className="font-medium">Anmeldung erforderlich</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Melde dich an, um {feature} zu speichern und auf allen Geräten zu synchronisieren.
      </p>
      <Button className="mt-4" onClick={() => startLogin()} aria-label="Jetzt anmelden">
        Jetzt anmelden
      </Button>
    </div>
  );
}
