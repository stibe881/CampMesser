/**
 * Anreise-Navigation: baut den Karten-Link für die Route zu einem Punkt.
 * iPhone/iPad öffnen Apple Karten (maps.apple.com), alle anderen Geräte
 * Google Maps. Der User-Agent ist injizierbar, damit die Logik testbar bleibt.
 */
export function directionsUrl(
  lat: number,
  lon: number,
  userAgent: string = typeof navigator === "undefined"
    ? ""
    : navigator.userAgent
): string {
  const destination = `${lat},${lon}`;
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  return isIos
    ? `https://maps.apple.com/?daddr=${destination}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
