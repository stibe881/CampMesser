import { useEffect, useRef, useState } from "react";

/**
 * Einen zugeklappten Abschnitt über die Adresse ansteuern (#344).
 *
 * Die Reise-Seite ist eine lange Liste zugeklappter Abschnitte: Tagebuch,
 * Reisekasse, Pinnwand, Verlauf, Gästebuch. Ein Link auf die Seite bringt
 * einen zwar hin, aber der gesuchte Abschnitt liegt zugeklappt irgendwo
 * unter einem Dutzend anderer – gefunden hätte man ihn durch Suchen.
 *
 * `/tagebuch/12#pinnwand` klappt ihn stattdessen auf und scrollt hin.
 *
 * ZWEI FEINHEITEN, die beide schon schiefgingen:
 *
 * 1. Der Hash wird EINMAL beim Aufbau gelesen und nicht überwacht. Wer den
 *    Abschnitt danach von Hand zuklappt, soll ihn zubleiben sehen – ein
 *    Effekt, der auf den Hash hört, würde ihn wieder aufreissen.
 * 2. Gescrollt wird erst zwei Bilder später. Die App-Hülle scrollt bei
 *    jedem Seitenwechsel nach oben, und ihr Effekt läuft NACH dem hier
 *    (React führt Kind-Effekte vor Eltern-Effekten aus). Ohne das Warten
 *    wäre unser Scrollen sofort wieder überschrieben.
 */
export function useHashSection<T extends HTMLElement = HTMLDivElement>(
  hash: string
) {
  const [matched] = useState(
    () => typeof window !== "undefined" && window.location.hash === hash
  );
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!matched) return;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [matched]);

  return { matched, ref };
}
