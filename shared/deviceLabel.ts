/**
 * Geräte-Beschriftung aus dem User-Agent (#423): kein Fingerprinting,
 * nur Wiedererkennen – «iPhone · Safari» sagt genug, um das fremde
 * Gerät vom eigenen zu unterscheiden. Bewusst eine Handvoll grober
 * Muster statt einer UA-Parser-Bibliothek: Die Liste zeigt eigene
 * Geräte, nicht das ganze Web.
 */

export interface DeviceLabel {
  /** Gerät bzw. Betriebssystem («iPhone», «Android», «Windows») oder null. */
  device: string | null;
  /** Browser («Safari», «Chrome», «Firefox», «Edge») oder null. */
  browser: string | null;
}

export function deviceLabel(userAgent: string | null): DeviceLabel {
  if (!userAgent) return { device: null, browser: null };
  const ua = userAgent.toLowerCase();

  const device = ua.includes("iphone")
    ? "iPhone"
    : ua.includes("ipad")
      ? "iPad"
      : ua.includes("android")
        ? "Android"
        : ua.includes("windows")
          ? "Windows"
          : ua.includes("mac os x") || ua.includes("macintosh")
            ? "Mac"
            : ua.includes("linux")
              ? "Linux"
              : null;

  // Reihenfolge zählt: Edge und Chrome nennen sich beide «Safari»,
  // Edge nennt sich zusätzlich «Chrome».
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("firefox/")
      ? "Firefox"
      : ua.includes("crios/") || ua.includes("chrome/")
        ? "Chrome"
        : ua.includes("safari/")
          ? "Safari"
          : null;

  return { device, browser };
}

/** «iPhone · Safari», «Windows · Firefox» – oder null, wenn nichts erkannt. */
export function deviceLabelText(userAgent: string | null): string | null {
  const { device, browser } = deviceLabel(userAgent);
  const parts = [device, browser].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}
