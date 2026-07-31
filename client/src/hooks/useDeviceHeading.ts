import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Liest die Kompass-Ausrichtung des Geräts (0° = Norden, im Uhrzeigersinn).
 * - iOS: nutzt `webkitCompassHeading` und verlangt eine einmalige Berechtigungsabfrage
 *   (muss aus einer Nutzer-Interaktion heraus gestartet werden).
 * - Android/übrige: nutzt `deviceorientationabsolute` bzw. `alpha` (absolut).
 * - Desktop ohne Sensor: `supported` bleibt false.
 */
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

type PermissionState = "idle" | "granted" | "denied" | "unsupported";

export function useDeviceHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("idle");
  const listenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);
  const eventNameRef = useRef<string>("deviceorientation");

  const stop = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener(
        eventNameRef.current as "deviceorientation",
        listenerRef.current as EventListener,
      );
      listenerRef.current = null;
    }
    setActive(false);
    setHeading(null);
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
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

    const handler = (e: DeviceOrientationEvent) => {
      const ios = e as DeviceOrientationEventiOS;
      let h: number | null = null;
      if (typeof ios.webkitCompassHeading === "number") {
        // iOS: bereits Kompass-Richtung (0 = Nord, im Uhrzeigersinn)
        h = ios.webkitCompassHeading;
      } else if (e.absolute && e.alpha !== null) {
        // Android: alpha ist gegen den Uhrzeigersinn ab Nord
        h = (360 - e.alpha) % 360;
      } else if (e.alpha !== null) {
        h = (360 - e.alpha) % 360;
      }
      if (h !== null) setHeading(h);
    };

    // `deviceorientationabsolute` liefert auf Android verlässlichere Nordwerte
    const eventName =
      "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    eventNameRef.current = eventName;
    listenerRef.current = handler;
    window.addEventListener(eventName as "deviceorientation", handler as EventListener);
    setActive(true);
  }, []);

  useEffect(() => stop, [stop]);

  return { heading, active, permission, start, stop };
}
