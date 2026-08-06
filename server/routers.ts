/**
 * Der tRPC-Router der App – nur noch das Inhaltsverzeichnis (#331).
 *
 * VORHER STAND HIER ALLES: 6959 Zeilen, 37 Router, 241 Prozeduren in
 * einer Datei. Wer eine Prozedur suchte, scrollte; wer eine änderte, las
 * die Nachbarschaft nicht mit, weil sie zufällig war – der Ämtli-Router
 * stand zwischen Schatzsuche und Kisten. Dasselbe Problem hatte
 * `Trips.tsx` (#322), und es ist auf dieselbe Weise gelöst: aufteilen,
 * ohne am Verhalten etwas zu ändern.
 *
 * DIE MODULE SIND NACH THEMEN GESCHNITTEN, nicht nach Grösse. Wer am
 * Einkauf arbeitet, hat Kühlbox, Vorrat, Rezepte und Menüplan in einer
 * Datei – das sind die, die zusammen kaputtgehen.
 *
 * Der gemeinsame Unterbau (tRPC-Bausteine, Datenbank, Zod-Schemata,
 * Hilfsfunktionen) steht in `routers/_shared.ts`.
 *
 * DIE PFADE ZUM CLIENT ÄNDERN SICH NICHT: `trpc.packing.items` heisst
 * weiterhin `trpc.packing.items`. Die Module liefern Objekte, die hier
 * zusammengelegt werden.
 */
import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { authRouters } from "./routers/auth";
import { packingRouters } from "./routers/packing";
import { gearRouters } from "./routers/gear";
import { foodRouters } from "./routers/food";
import { tripsRouters } from "./routers/trips";
import { spotsRouters } from "./routers/spots";
import { outdoorRouters } from "./routers/outdoor";
import { familyRouters } from "./routers/family";
import { accountRouters } from "./routers/account";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  ...authRouters,
  ...packingRouters,
  ...gearRouters,
  ...foodRouters,
  ...tripsRouters,
  ...spotsRouters,
  ...outdoorRouters,
  ...familyRouters,
  ...accountRouters,
});

export type AppRouter = typeof appRouter;
