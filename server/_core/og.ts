/**
 * OpenGraph-Vorschau für geteilte Links (/liste/:token, /platz/:token).
 * Messenger und soziale Netzwerke laden das SPA-HTML ohne JavaScript –
 * deshalb injiziert der Server für bekannte Teil-Token OG-Meta-Tags in den
 * <head>, bevor das HTML ausgeliefert wird. Unbekannte Token bekommen das
 * normale SPA-HTML (kein Unterschied nach aussen).
 * Beschreibungstexte deutsch, weil der Server die Sprache der Betrachter*innen
 * nicht kennt.
 */

export interface OgMeta {
  title: string;
  description: string;
  /** Absolute URL der geteilten Seite */
  url: string;
  /** Absolute URL eines Vorschau-Bilds */
  image: string;
}

/** HTML-Sonderzeichen escapen (Namen stammen von Nutzer*innen → XSS-Schutz). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** OG- und Twitter-Meta-Tags als HTML-Schnipsel rendern (alle Werte escaped). */
export function renderOgTags(meta: OgMeta): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const image = escapeHtml(meta.image);
  return [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join("\n    ");
}

/**
 * Meta-Tags vor </head> in das SPA-HTML einfügen.
 * Findet sich kein </head>, bleibt das HTML unverändert (robust gegen
 * künftige Umbauten des Templates).
 */
export function injectOgTags(html: string, meta: OgMeta): string {
  const marker = "</head>";
  const idx = html.indexOf(marker);
  if (idx === -1) return html;
  return `${html.slice(0, idx)}${renderOgTags(meta)}\n  ${html.slice(idx)}`;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,32}$/;

/**
 * OG-Metadaten für einen Teil-Link ermitteln.
 * `path` ist der Request-Pfad (z. B. /liste/abc123), `origin` das absolute
 * Origin (https://host). Gibt null zurück, wenn der Pfad kein Teil-Link ist
 * oder der Token nicht (mehr) existiert – dann wird das normale SPA-HTML
 * ausgeliefert.
 */
export async function ogMetaForShareRequest(
  path: string,
  origin: string
): Promise<OgMeta | null> {
  const match = /^\/(liste|platz)\/([^/]+)$/.exec(path);
  if (!match) return null;
  const [, kind, token] = match;
  if (!TOKEN_PATTERN.test(token)) return null;

  const url = `${origin}${path}`;
  const image = `${origin}/icons/icon-512.png`;
  // DB erst hier laden, damit die reinen Funktionen oben ohne DB testbar sind
  const db = await import("../db");

  if (kind === "liste") {
    const list = await db.getPackListByToken(token);
    if (!list) return null;
    const items = await db.getPackItems(list.id);
    const count = items.length === 1 ? "1 Eintrag" : `${items.length} Einträge`;
    return {
      title: `${list.name} – CampMesser`,
      description: `Geteilte Packliste mit ${count} – zum Mitpacken und Abhaken.`,
      url,
      image,
    };
  }

  const spot = await db.getCampSpotByToken(token);
  if (!spot) return null;
  return {
    title: `${spot.name} – CampMesser`,
    description: `Geteiltes Platz-Dossier (${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}) mit Sonnenzeiten und 3-Tage-Wetter.`,
    url,
    image,
  };
}
