/**
 * OpenGraph-Vorschau für geteilte Links (/liste/:token, /platz/:token,
 * /vorlage/:token, /einkaufsliste/:token, /reise/:token, /quiz/:token,
 * /rezept/:token).
 * Messenger und soziale Netzwerke laden das SPA-HTML ohne JavaScript –
 * deshalb injiziert der Server für bekannte Teil-Token OG-Meta-Tags in den
 * <head>, bevor das HTML ausgeliefert wird. Unbekannte Token bekommen das
 * normale SPA-HTML (kein Unterschied nach aussen). Abgelaufene Teil-Links
 * verhalten sich dabei wie unbekannte: die db.get*ByToken-Funktionen prüfen
 * shareExpiresAt (shared/sharing.ts) und liefern nichts mehr zurück.
 * Beschreibungstexte deutsch, weil der Server die Sprache der Betrachter*innen
 * nicht kennt.
 */
import { parseStringList } from "@shared/customRecipes";
import { parseCustomTemplateItems } from "@shared/packTemplates";
import { parseQuizQuestions } from "@shared/quizzes";

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

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

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
  const match =
    /^\/(liste|platz|vorlage|einkaufsliste|reise|quiz|rezept)\/([^/]+)$/.exec(
      path
    );
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

  if (kind === "vorlage") {
    const template = await db.getPackTemplateByToken(token);
    if (!template) return null;
    const items = parseCustomTemplateItems(template.itemsJson);
    const count = items.length === 1 ? "1 Eintrag" : `${items.length} Einträge`;
    return {
      title: `${template.name} – CampMesser`,
      description: `Geteilte Packvorlage mit ${count} – zum Übernehmen als eigene Vorlage.`,
      url,
      image,
    };
  }

  if (kind === "einkaufsliste") {
    const share = await db.getShoppingShareByToken(token);
    if (!share) return null;
    const items = await db.getShoppingItems(share.userId);
    const open = items.filter(i => !i.checked).length;
    const count =
      open === 1 ? "1 offenem Eintrag" : `${open} offenen Einträgen`;
    return {
      title: "Einkaufsliste – CampMesser",
      description: `Geteilte Einkaufsliste mit ${count} – zum Mitbringen und Abhaken.`,
      url,
      image,
    };
  }

  if (kind === "quiz") {
    const quiz = await db.getCustomQuizByToken(token);
    if (!quiz) return null;
    const count = parseQuizQuestions(quiz.questionsJson).length;
    const countText = count === 1 ? "1 Frage" : `${count} Fragen`;
    return {
      title: `${quiz.title} – CampMesser`,
      description: `Geteiltes Quiz mit ${countText} – zum Übernehmen und Mitspielen.`,
      url,
      image,
    };
  }

  if (kind === "rezept") {
    const recipe = await db.getCustomRecipeByToken(token);
    if (!recipe) return null;
    const count = parseStringList(recipe.ingredientsJson).length;
    const countText = count === 1 ? "1 Zutat" : `${count} Zutaten`;
    return {
      title: `${recipe.name} – CampMesser`,
      description: `Geteiltes Campingrezept mit ${countText} · ${recipe.timeMinutes} Min. – zum Nachkochen und Übernehmen.`,
      url,
      image,
    };
  }

  if (kind === "reise") {
    const trip = await db.getTripLogByShareToken(token);
    if (!trip) return null;
    let place = trip.location;
    if (!place && trip.spotId != null) {
      const spot = await db.getCampSpot(trip.spotId, trip.userId);
      place = spot?.name ?? null;
    }
    const name = trip.title || place || "Reise";
    return {
      title: `${name} – CampMesser`,
      description:
        "Geteilter Reise-Hub mit Reise-Infos, Platz, Menüplan und Packliste – zum Mitlesen und Mitpacken.",
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
