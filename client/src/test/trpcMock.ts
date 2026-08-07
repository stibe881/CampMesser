/**
 * Eine tRPC-Attrappe, die JEDEN Pfad beantwortet (#378).
 *
 * DER ANLASS: Die Logik ist mit über zweitausend Tests abgedeckt, die
 * ANZEIGE mit sieben Komponenten und keiner einzigen Seite. Genau dort
 * lagen aber alle Fehler der letzten Runden: eine leere Mini-Karte, ein
 * fehlender Abstand, eine unübersichtliche Liste, ein Zähler, der
 * stehenblieb. Gefunden hat sie jedes Mal ein Mensch auf einem
 * Bildschirmfoto.
 *
 * WARUM ES DIESE ATTRAPPE BRAUCHT: Eine Seite wie «Meine Reisen» ruft
 * zwei Dutzend Prozeduren auf. Sie einzeln nachzubauen wäre eine
 * halbe Serverkopie in jedem Test – und jede neue Abfrage in der Seite
 * würde einen Test kaputtmachen, der mit ihr nichts zu tun hat. Ein
 * Proxy beantwortet stattdessen jeden Pfad mit einem leeren, gültigen
 * Ergebnis; wer für seinen Test etwas Bestimmtes braucht, gibt genau das
 * vor.
 *
 * WAS DIESE TESTS PRÜFEN, damit die Erwartung stimmt: dass die Seite
 * ÜBERHAUPT rendert, dass ihre Kernelemente da sind und dass axe nichts
 * findet. Kein Aussehen, keine Abstände – das sieht man nur am
 * Bildschirm. Aber jedes «ist ganz weg», jeder Absturz beim Umbau und
 * jede fehlende Beschriftung fällt damit auf, bevor jemand ein
 * Bildschirmfoto schicken muss.
 */

/** Ein Abfrage-Ergebnis, wie TanStack Query es liefert. */
function queryResult(data: unknown) {
  return {
    data,
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: data !== undefined,
    isFetching: false,
    error: null,
    refetch: () => Promise.resolve({ data }),
    fetchNextPage: () => Promise.resolve(),
    hasNextPage: false,
  };
}

function mutationResult() {
  return {
    mutate: () => {},
    mutateAsync: () => Promise.resolve(undefined),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    reset: () => {},
    data: undefined,
  };
}

/** `utils` – jede Methode auf jedem Pfad tut nichts und gelingt. */
function utilsProxy(): unknown {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (typeof prop !== "string") return undefined;
      if (
        prop === "invalidate" ||
        prop === "reset" ||
        prop === "cancel" ||
        prop === "refetch" ||
        prop === "prefetch"
      ) {
        return () => Promise.resolve();
      }
      if (prop === "setData" || prop === "getData") return () => undefined;
      return new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

/**
 * Attrappe des `trpc`-Objekts.
 *
 * `data` bildet Pfade auf Ergebnisse ab, mit Punkten geschrieben – genau
 * so, wie die Seite sie aufruft:
 *
 *     trpcMock({ "trips.list": [ … ], "spots.list": [] })
 *
 * Ein Pfad ohne Eintrag liefert `undefined` als Daten. Das ist Absicht:
 * Seiten schreiben `query.data ?? []`, und genau dieser Zweig soll im
 * Test mitgeprüft werden.
 */
export function trpcMock(data: Record<string, unknown> = {}) {
  const build = (path: string[]): unknown =>
    new Proxy(() => {}, {
      get(_target, prop) {
        if (typeof prop !== "string") return undefined;
        if (prop === "useQuery" || prop === "useSuspenseQuery") {
          return () => queryResult(data[path.join(".")]);
        }
        if (prop === "useInfiniteQuery") {
          return () => queryResult(data[path.join(".")]);
        }
        if (prop === "useMutation") return () => mutationResult();
        if (prop === "useUtils" || prop === "useContext") {
          return () => utilsProxy();
        }
        return build([...path, prop]);
      },
    });
  return build([]);
}
