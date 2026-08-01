/**
 * Versand von Passwort-Reset-Codes.
 *
 * Reihenfolge der Zustellwege:
 * 1. SMTP (falls SMTP_HOST/SMTP_USER/SMTP_PASS gesetzt sind) – echter E-Mail-Versand,
 *    empfohlen beim Selbst-Hosting (z. B. auf einem eigenen Server).
 * 2. Manus-Benachrichtigung an die Konto-Inhaberin bzw. den Konto-Inhaber –
 *    Standard auf der Manus-Plattform, wenn kein SMTP konfiguriert ist.
 * 3. Server-Log als letzte Rückfallebene, damit Codes im Betrieb nachvollziehbar sind.
 */
export async function sendResetCode(
  email: string,
  code: string
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;

  if (host && user && pass && from) {
    try {
      // Dynamischer Import: nodemailer ist optional und nur beim Selbst-Hosting nötig.
      const nodemailer = await import("nodemailer");
      const port = Number(process.env.SMTP_PORT ?? 587);
      const transport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transport.sendMail({
        from,
        to: email,
        subject: "CampMesser: Passwort zurücksetzen",
        text: `Dein Bestätigungscode lautet: ${code}\n\nDer Code ist 15 Minuten gültig. Falls du das Zurücksetzen nicht angefordert hast, kannst du diese Nachricht ignorieren.`,
      });
      return;
    } catch (err) {
      console.error("[Mailer] SMTP-Versand fehlgeschlagen:", err);
    }
  }

  try {
    const { notifyOwner } = await import("./_core/notification");
    await notifyOwner({
      title: `CampMesser: Passwort-Code für ${email}`,
      content: `Bestätigungscode: ${code} (15 Minuten gültig). Falls du das nicht warst, ignoriere diese Nachricht.`,
    });
    return;
  } catch (err) {
    console.error("[Mailer] Benachrichtigung fehlgeschlagen:", err);
  }

  console.warn(
    `[Mailer] Kein Zustellweg verfügbar. Reset-Code für ${email}: ${code}`
  );
}
