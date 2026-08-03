import nodemailer from "nodemailer";
import { l4, pick, type Language } from "@shared/i18n";

/**
 * E-Mail-Versand über SMTP (z. B. Hetzner-Postfach, Port 587 mit STARTTLS).
 * Konfiguriert über SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM.
 * Ohne vollständige Konfiguration meldet requestReset dem Client sauber,
 * dass der Passwort-Reset derzeit nicht verfügbar ist.
 */

/** Sind alle nötigen SMTP-Zugangsdaten gesetzt? */
export function mailConfigured(): boolean {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  return Boolean(
    SMTP_HOST && SMTP_USER && SMTP_PASS && (SMTP_FROM ?? SMTP_USER)
  );
}

const subject = l4(
  "CampMesser: Passwort zurücksetzen",
  "CampMesser : réinitialiser le mot de passe",
  "CampMesser: reimposta la password",
  "CampMesser: reset your password"
);

const intro = l4(
  "du (oder jemand anderes) hast angefordert, das Passwort deines CampMesser-Kontos zurückzusetzen.",
  "tu as (ou quelqu'un d'autre a) demandé à réinitialiser le mot de passe de ton compte CampMesser.",
  "tu (o qualcun altro) hai richiesto di reimpostare la password del tuo account CampMesser.",
  "you (or someone else) requested to reset the password of your CampMesser account."
);

const action = l4(
  "Öffne diesen Link, um ein neues Passwort zu setzen (60 Minuten gültig):",
  "Ouvre ce lien pour définir un nouveau mot de passe (valable 60 minutes) :",
  "Apri questo link per impostare una nuova password (valido 60 minuti):",
  "Open this link to set a new password (valid for 60 minutes):"
);

const outro = l4(
  "Falls du das nicht warst, kannst du diese E-Mail ignorieren – dein Passwort bleibt unverändert.",
  "Si ce n'était pas toi, tu peux ignorer cet e-mail – ton mot de passe reste inchangé.",
  "Se non sei stato tu, puoi ignorare questa e-mail – la tua password resta invariata.",
  "If this wasn't you, you can ignore this email – your password stays unchanged."
);

const salutation = l4("Hallo", "Salut", "Ciao", "Hello");

/** Betreff und Text der Reset-Mail erzeugen (reine Funktion, testbar). */
export function buildPasswordResetMail(
  resetUrl: string,
  lang: Language
): { subject: string; text: string } {
  return {
    subject: pick(subject, lang),
    text: [
      `${pick(salutation, lang)},`,
      "",
      pick(intro, lang),
      "",
      pick(action, lang),
      resetUrl,
      "",
      pick(outro, lang),
      "",
      "CampMesser",
    ].join("\n"),
  };
}

// --- E-Mail-Bestätigung nach Registrierung bzw. Adress-Änderung -----------

const verifySubject = l4(
  "CampMesser: E-Mail-Adresse bestätigen",
  "CampMesser : confirmer l'adresse e-mail",
  "CampMesser: conferma l'indirizzo e-mail",
  "CampMesser: confirm your email address"
);

const verifyIntro = l4(
  "schön, dass du dabei bist! Bitte bestätige, dass diese E-Mail-Adresse zu deinem CampMesser-Konto gehört.",
  "content de te compter parmi nous ! Confirme que cette adresse e-mail appartient bien à ton compte CampMesser.",
  "che bello averti con noi! Conferma che questo indirizzo e-mail appartiene al tuo account CampMesser.",
  "great to have you on board! Please confirm that this email address belongs to your CampMesser account."
);

const verifyAction = l4(
  "Öffne dazu diesen Link (48 Stunden gültig):",
  "Ouvre ce lien pour cela (valable 48 heures) :",
  "Apri questo link (valido 48 ore):",
  "Open this link to do so (valid for 48 hours):"
);

const verifyOutro = l4(
  "Falls du kein Konto bei CampMesser erstellt hast, kannst du diese E-Mail ignorieren.",
  "Si tu n'as pas créé de compte CampMesser, tu peux ignorer cet e-mail.",
  "Se non hai creato un account CampMesser, puoi ignorare questa e-mail.",
  "If you didn't create a CampMesser account, you can ignore this email."
);

/** Betreff und Text der Bestätigungs-Mail erzeugen (reine Funktion, testbar). */
export function buildVerificationMail(
  verifyUrl: string,
  lang: Language
): { subject: string; text: string } {
  return {
    subject: pick(verifySubject, lang),
    text: [
      `${pick(salutation, lang)},`,
      "",
      pick(verifyIntro, lang),
      "",
      pick(verifyAction, lang),
      verifyUrl,
      "",
      pick(verifyOutro, lang),
      "",
      "CampMesser",
    ].join("\n"),
  };
}

/** Fertige Mail per SMTP verschicken (Port 465 = TLS, sonst STARTTLS). */
async function sendMail(
  to: string,
  mail: { subject: string; text: string }
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  if (!host || !user || !pass || !from) {
    throw new Error("SMTP ist nicht konfiguriert");
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transport.sendMail({ from, to, ...mail });
}

/** Reset-Mail per SMTP verschicken. */
export async function sendPasswordResetMail(
  to: string,
  resetUrl: string,
  lang: Language
): Promise<void> {
  await sendMail(to, buildPasswordResetMail(resetUrl, lang));
}

/** Bestätigungs-Mail per SMTP verschicken. */
export async function sendVerificationMail(
  to: string,
  verifyUrl: string,
  lang: Language
): Promise<void> {
  await sendMail(to, buildVerificationMail(verifyUrl, lang));
}
