import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./trpc";
import {
  CLIENT_ERROR_LIMIT,
  countByMessage,
  parseClientErrorLog,
} from "@shared/clientErrorLog";

/**
 * Was von der Projektvorlage übrig ist (#351).
 *
 * `notifyOwner` hing an der «Forge»-API der Vorlage und brauchte
 * BUILT_IN_FORGE_API_URL/-KEY. Auf dem eigenen Server sind die nie
 * gesetzt, die Prozedur konnte also nur `false` zurückgeben. Entfernt.
 */
export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  /**
   * Die letzten Abstürze im Browser (#352).
   *
   * Seit #36 landen sie in `logs/client-errors.log` – und wurden dort nie
   * wieder gelesen. Eine Absturzschleife fiel erst auf, wenn sich jemand
   * beschwerte.
   *
   * NUR FÜR ADMIN-KONTEN: In den Meldungen stehen Aufrufpfade und
   * Stapelspuren fremder Geräte. Das geht niemanden ausser die Person an,
   * die den Server betreibt.
   *
   * Fehlt die Datei, ist das kein Fehler, sondern die gute Nachricht:
   * Dann ist noch nichts abgestürzt.
   */
  clientErrors: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const file = path.join(process.cwd(), "logs", "client-errors.log");
      let text = "";
      try {
        text = await fs.readFile(file, "utf8");
      } catch {
        return { entries: [], byMessage: [], missing: true } as const;
      }
      const entries = parseClientErrorLog(
        text,
        input?.limit ?? CLIENT_ERROR_LIMIT
      );
      return {
        entries,
        byMessage: countByMessage(entries),
        missing: false,
      } as const;
    }),
});
