import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Liest die Neigung des Geräts (beta = vor/zurück, gamma = links/rechts) für
 * die Wasserwaage. iOS 13+ verlangt eine Berechtigungsabfrage aus einer
 * Nutzer-Interaktion; auf Geräten ohne Lagesensor bleibt `permission`
 * auf "unsupported".
 */
type PermissionState = "idle" | "granted" | "denied" | "unsupported";

export function useDeviceTilt() {
  const [reading, setReading] = useState<{
    beta: number;
    gamma: number;
  } | null>(null);
  const [active, setActive] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("idle");
  const enabledRef = useRef(false);
  const attachedRef = useRef(false);
  const handlerRef = useRef((e: DeviceOrientationEvent) => {
    if (!enabledRef.current) return;
    if (e.beta === null || e.gamma === null) return;
    setReading({ beta: e.beta, gamma: e.gamma });
  });

  const stop = useCallback(() => {
    enabledRef.current = false;
    if (attachedRef.current) {
      window.removeEventListener(
        "deviceorientation",
        handlerRef.current as EventListener
      );
      attachedRef.current = false;
    }
    setActive(false);
    setReading(null);
  }, []);

  const start = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("DeviceOrientationEvent" in window)
    ) {
      setPermission("unsupported");
      return;
    }
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
        // Aufruf ohne Nutzer-Interaktion (Auto-Start): Button anbieten
        setPermission("denied");
        return;
      }
    }
    setPermission("granted");
    enabledRef.current = true;
    if (!attachedRef.current) {
      window.addEventListener(
        "deviceorientation",
        handlerRef.current as EventListener
      );
      attachedRef.current = true;
    }
    setActive(true);
  }, []);

  useEffect(() => stop, [stop]);

  return { reading, active, permission, start, stop };
}
