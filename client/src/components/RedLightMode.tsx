/**
 * Rotlicht-Modus für Sternengucker: legt einen roten Nachtsicht-Filter über
 * die ganze App (multiply-Overlay in Rot plus leichte Abdunkelung), damit die
 * Augen dunkeladaptiert bleiben. Die Overlays sind klick-durchlässig
 * (pointer-events: none) – die App bleibt voll bedienbar. Nur der schwebende
 * «Rotlicht aus»-Knopf fängt Klicks; er ist selbst dunkelrot gehalten, um die
 * Nachtsicht nicht zu stören. Escape beendet den Modus ebenfalls.
 *
 * Bewusst NICHT persistiert – nach einem Neuladen ist der Modus aus.
 */
import { useEffect } from "react";
import { useT } from "@/i18n";

export default function RedLightMode({ onExit }: { onExit: () => void }) {
  const t = useT();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExit]);

  return (
    <>
      {/* Rotfilter: multiply löscht Grün-/Blauanteile der ganzen App */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9990]"
        style={{ backgroundColor: "#ff2000", mixBlendMode: "multiply" }}
      />
      {/* Zusätzliche Abdunkelung – rotes Licht allein wäre noch zu hell */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9990] bg-black/40"
      />
      <button
        type="button"
        onClick={onExit}
        aria-label={t.nature.redLightOffAria}
        className="fixed bottom-6 left-1/2 z-[9991] -translate-x-1/2 rounded-full border-2 border-[#b32a12] bg-[#2b0700] px-5 py-2.5 text-sm font-semibold text-[#ff6a45] shadow-lg"
      >
        {t.nature.redLightOff}
      </button>
    </>
  );
}
