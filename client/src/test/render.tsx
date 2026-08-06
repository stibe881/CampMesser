import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import superjson from "superjson";
import { LanguageProvider } from "@/i18n";
import { trpc } from "@/lib/trpc";

/**
 * Eine Komponente mit den Dingen rendern, die fast jede braucht (#340).
 *
 * DER SPRACH-PROVIDER IST PFLICHT, nicht Beiwerk: Seit #332 lädt er sein
 * Wörterbuch nach und zeigt bis dahin nichts. Ein Test muss darauf also
 * WARTEN – `findBy…` statt `getBy…`. Das ist keine Schikane, sondern
 * genau der Zustand, den auch die echte App durchläuft; wer ihn im Test
 * überspringt, prüft eine Anzeige, die es so nie gibt.
 *
 * DIE tRPC-HÜLLE MUSS AUCH MIT, obwohl kaum ein Test sie braucht: Der
 * Sprach-Provider gleicht die Sprache über das Konto ab und ruft dafür
 * `trpc.useUtils()`. Ohne Provider stirbt jeder Test an dieser Zeile –
 * und zwar mit einer Meldung, die nach einem Fehler in der geprüften
 * Komponente aussieht.
 *
 * Es wird NICHTS abgeschickt: `retry: false`, keine Wiederholungen, und
 * der Link zeigt auf eine Adresse, die es im Test nicht gibt. Wer echte
 * Daten braucht, gibt sie in seinem Test vor.
 */
export function renderWithI18n(
  ui: ReactElement,
  options: { trpc?: boolean } = {}
): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const inner = (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>{children}</LanguageProvider>
      </QueryClientProvider>
    );
    // Wer `trpc` als Ganzes durch Attrappen ersetzt, hat keinen echten
    // Provider mehr – und braucht auch keinen. Deshalb abschaltbar,
    // statt in jedem solchen Test um die Hülle herumzubauen.
    if (options.trpc === false) return inner;
    const client = trpc.createClient({
      links: [
        httpLink({ url: "http://localhost/api/trpc", transformer: superjson }),
      ],
    });
    return (
      <trpc.Provider client={client} queryClient={queryClient}>
        {inner}
      </trpc.Provider>
    );
  };
  return render(ui, { wrapper: Wrapper });
}

/**
 * Eine tRPC-Abfrage nachbilden.
 *
 * WARUM ATTRAPPEN UND KEIN ECHTER SERVER: Geprüft werden soll, was die
 * KOMPONENTE aus einem Zustand macht – lädt, leer, Fehler, Daten. Dafür
 * einen Server hochzufahren würde den Test langsam und wacklig machen,
 * ohne mehr über die Komponente zu sagen. Was der Server tatsächlich
 * liefert, prüfen die Tests unter `server/`.
 */
export function queryStub<T>(
  state: Partial<{
    data: T;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
  }> = {}
) {
  return {
    data: state.data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    isFetching: state.isFetching ?? false,
    refetch: () => Promise.resolve(),
  };
}
