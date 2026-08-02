/**
 * Rücksprung-Ziel nach dem Anmelden: Seiten wie die Reise-Einladung merken
 * sich ihren Pfad, die Anmeldeseite springt nach erfolgreichem Login dorthin
 * zurück. Nur interne Pfade (beginnend mit «/») werden akzeptiert.
 */
const LOGIN_RETURN_KEY = "campmesser.loginReturnTo";

/** Rücksprung-Pfad merken – ungültige/externe Ziele werden ignoriert. */
export function rememberLoginReturn(path: string) {
  try {
    if (path.startsWith("/") && !path.startsWith("//")) {
      sessionStorage.setItem(LOGIN_RETURN_KEY, path);
    }
  } catch {
    // Speicher blockiert – dann eben ohne Rücksprung
  }
}

/** Gemerkten Rücksprung-Pfad einmalig einlösen (Default: Startseite). */
export function consumeLoginReturn(): string {
  try {
    const stored = sessionStorage.getItem(LOGIN_RETURN_KEY);
    sessionStorage.removeItem(LOGIN_RETURN_KEY);
    if (stored && stored.startsWith("/") && !stored.startsWith("//")) {
      return stored;
    }
  } catch {
    // Speicher blockiert – zur Startseite
  }
  return "/";
}
