/**
 * Cookie-Hinweis (#409) – NUR IM WEB, und bewusst ein HINWEIS, kein
 * Einwilligungs-Banner: CampMesser setzt ausschliesslich technisch
 * notwendige Cookies (Anmelde-Sitzung) und lokale Speicherung, kein
 * Tracking. Dafür verlangen revDSG und DSGVO keine Einwilligung – ein
 * «Alle akzeptieren»-Theater wäre eine Zumutung ohne Rechtsgrund. In der
 * nativen App entfällt der Hinweis: Dort gibt es keine Cookies im Sinn
 * der Browser-Welt, und der App-Store-Rahmen regelt die Information.
 */
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { isNativeApp } from "@/lib/nativeBridge";

const SEEN_KEY = "campmesser.cookieNoticeSeen";

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    // Ohne localStorage (strikter Privatmodus) lieber gar kein Banner,
    // das bei jedem Seitenwechsel wiederkäme.
    return true;
  }
}

export default function CookieNotice() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(
    () => !isNativeApp() && !alreadySeen()
  );
  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* Sitzung reicht */
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label={t.legal.cookieAria}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-3 backdrop-blur"
    >
      <div className="container flex max-w-3xl flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          {t.legal.cookieText}{" "}
          <Link
            href="/datenschutz"
            className="font-medium text-primary hover:underline"
          >
            {t.legal.privacyTitle}
          </Link>
        </p>
        <Button size="sm" onClick={dismiss}>
          {t.legal.cookieOk}
        </Button>
      </div>
    </div>
  );
}
