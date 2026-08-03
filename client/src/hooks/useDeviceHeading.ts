import { useCallback, useEffect, useRef, useState } from "react";
import { HEADING_SMOOTHING_ALPHA, smoothHeading } from "@/lib/heading";
import { deviceViewAltitude } from "@shared/skyPosition";

/**
 * Liest die Kompass-Ausrichtung des Geräts (0° = Norden, im Uhrzeigersinn).
 * - iOS: nutzt `webkitCompassHeading` und verlangt eine einmalige Berechtigungsabfrage
 *   (muss aus einer Nutzer-Interaktion heraus gestartet werden).
 * - Android/übrige: nutzt `deviceorientationabsolute` bzw. `alpha` (absolut).
 * - Desktop ohne Sensor: `supported` bleibt false.
 *
 * Die rohen Sensor-Werte zappeln stark; der Hook glättet sie deshalb mit
 * einem exponentiellen Mittel über Winkel (wrap-around-sicher, lib/heading).
 * Davon profitieren ALLE Konsumenten (Zelt-Finder und Sonnen-Kompass) an
 * einer Stelle, ohne dass die Seiten selbst etwas tun müssen.
 *
 * Zusätzlich liefert der Hook `viewAltitude`: die HÖHE der Richtung, in die
 * die Geräterückseite zeigt (−90° Boden, 0° Horizont, +90° Zenit). Der
 * Sternbild-Finder braucht sie, um zu wissen, wie hoch man ans Firmament
 * hält; Seiten ohne Neigungsbedarf ignorieren das Feld einfach. Sie bleibt
 * `null`, solange kein Ereignis beta/gamma mitliefert.
 */
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

type PermissionState = "idle" | "granted" | "denied" | "unsupported";

export function useDeviceHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [viewAltitude, setViewAltitude] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("idle");
  // Ein einziger, stabiler Handler für die gesamte Hook-Lebensdauer: Events werden
  // nur verarbeitet, wenn `enabledRef` gesetzt ist. So kann «Aus» nie an einer
  // falschen Listener-Referenz scheitern.
  const enabledRef = useRef(false);
  const attachedRef = useRef(false);
  // Zuletzt geglätteter Wert für das exponentielle Mittel (null = noch keiner)
  const smoothedRef = useRef<number | null>(null);
  const smoothedAltitudeRef = useRef<number | null>(null);
  const handlerRef = useRef((e: DeviceOrientationEvent) => {
    if (!enabledRef.current) return;
    const ios = e as DeviceOrientationEventiOS;
    let h: number | null = null;
    if (typeof ios.webkitCompassHeading === "number") {
      // iOS: bereits Kompass-Richtung (0 = Nord, im Uhrzeigersinn)
      h = ios.webkitCompassHeading;
    } else if (e.alpha !== null) {
      // Android: alpha ist gegen den Uhrzeigersinn ab Nord
      h = (360 - e.alpha) % 360;
    }
    if (h !== null) {
      // Zappelige Sensor-Werte glätten (wrap-around-sicher über Vektoren)
      const smoothed = smoothHeading(smoothedRef.current, h);
      smoothedRef.current = smoothed;
      setHeading(smoothed);
    }
    if (e.beta !== null && e.gamma !== null) {
      // Neigung: die Höhe läuft nur von −90 bis 90 und kennt keinen
      // Umschlag – hier genügt das schlichte exponentielle Mittel.
      const raw = deviceViewAltitude(e.beta, e.gamma);
      const prev = smoothedAltitudeRef.current;
      const smoothed =
        prev === null ? raw : prev + HEADING_SMOOTHING_ALPHA * (raw - prev);
      smoothedAltitudeRef.current = smoothed;
      setViewAltitude(smoothed);
    }
  });

  const stop = useCallback(() => {
    enabledRef.current = false;
    if (attachedRef.current) {
      // Beide Varianten entfernen – schadet nicht, falls nur eine registriert war
      window.removeEventListener(
        "deviceorientationabsolute" as "deviceorientation",
        handlerRef.current as EventListener
      );
      window.removeEventListener(
        "deviceorientation",
        handlerRef.current as EventListener
      );
      attachedRef.current = false;
    }
    smoothedRef.current = null;
    smoothedAltitudeRef.current = null;
    setActive(false);
    setHeading(null);
    setViewAltitude(null);
  }, []);

  const start = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      setPermission("unsupported");
      return;
    }

    // iOS 13+: explizite Berechtigung nötig
    const doe = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof doe.requestPermission === "function") {
      try {
        const result = await doe.requestPermission();
        if (result !== "granted") {
          setPermission("denied");
          return;
        }
      } catch {
        setPermission("denied");
        return;
      }
    }
    setPermission("granted");

    enabledRef.current = true;
    if (!attachedRef.current) {
      // `deviceorientationabsolute` liefert auf Android verlässlichere Nordwerte
      const eventName =
        "ondeviceorientationabsolute" in window
          ? "deviceorientationabsolute"
          : "deviceorientation";
      window.addEventListener(
        eventName as "deviceorientation",
        handlerRef.current as EventListener
      );
      attachedRef.current = true;
    }
    setActive(true);
  }, []);

  useEffect(() => stop, [stop]);

  return { heading, viewAltitude, active, permission, start, stop };
}
