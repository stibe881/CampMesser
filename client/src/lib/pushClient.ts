/**
 * Web-Push im Browser: Abo anlegen/lösen für Unwetter-Warnungen.
 * Reine Browser-Helfer – die Server-Seite verwaltet der push-Router.
 */
import { l4, pick, type Language } from "@shared/i18n";

// Fehlertexte landen via error.message direkt im Toast – deshalb L4.
const ERRORS = {
  notAllowed: l4(
    "Benachrichtigungen wurden nicht erlaubt.",
    "Les notifications n'ont pas été autorisées.",
    "Le notifiche non sono state autorizzate.",
    "Notifications were not allowed."
  ),
  unreadable: l4(
    "Push-Abo konnte nicht gelesen werden.",
    "L'abonnement push n'a pas pu être lu.",
    "Impossibile leggere l'abbonamento push.",
    "Push subscription could not be read."
  ),
};

export function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  // Nativer Expo WebView-Wrapper unterstützt Push via Bridge
  if ("ReactNativeWebView" in window) return true;
  
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** VAPID-Schlüssel (Base64-URL) in das vom Push-API erwartete Format bringen. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export interface BrowserSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Bestehendes Push-Abo dieses Browsers lesen (null = keines). */
export async function getExistingSubscription(): Promise<BrowserSubscription | null> {
  if (!pushSupported()) return null;
  
  if ("ReactNativeWebView" in window) {
    const token = localStorage.getItem("expoPushToken");
    if (token) return { endpoint: token, p256dh: "expo", auth: "expo" };
    return null;
  }
  
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return null;
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  };
}

/** Berechtigung anfragen und Push-Abo im Browser anlegen. */
export async function subscribeBrowser(
  vapidPublicKey: string,
  lang: Language = "de"
): Promise<BrowserSubscription> {
  if ("ReactNativeWebView" in window) {
    return new Promise((resolve, reject) => {
      const handler = (e: any) => {
        window.removeEventListener("ExpoPushToken", handler);
        window.removeEventListener("ExpoPushTokenError", errorHandler);
        const token = e.detail;
        localStorage.setItem("expoPushToken", token);
        resolve({ endpoint: token, p256dh: "expo", auth: "expo" });
      };
      const errorHandler = () => {
        window.removeEventListener("ExpoPushToken", handler);
        window.removeEventListener("ExpoPushTokenError", errorHandler);
        reject(new Error(pick(ERRORS.notAllowed, lang)));
      };
      window.addEventListener("ExpoPushToken", handler);
      window.addEventListener("ExpoPushTokenError", errorHandler);
      
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: "REQUEST_PUSH_TOKEN" })
      );
    });
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(pick(ERRORS.notAllowed, lang));
  }
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      vapidPublicKey
    ) as unknown as BufferSource,
  });
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error(pick(ERRORS.unreadable, lang));
  }
  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  };
}

/** Push-Abo im Browser lösen (gibt den Endpoint des gelösten Abos zurück). */
export async function unsubscribeBrowser(): Promise<string | null> {
  if ("ReactNativeWebView" in window) {
    const token = localStorage.getItem("expoPushToken");
    localStorage.removeItem("expoPushToken");
    return token;
  }

  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}
