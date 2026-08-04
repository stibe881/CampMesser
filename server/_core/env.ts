export const ENV = {
  appId: process.env.VITE_APP_ID || "campmesser",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /**
   * Ausflugfinder-Anbindung (#271): Supabase-Projekt der eigenen
   * Ausflugfinder-App, aus der die Ausflugsziele kommen. Fehlt eine der
   * beiden Angaben, bleibt das Feature in der Oberfläche ausgeblendet.
   */
  excursionsUrl: process.env.AUSFLUGFINDER_SUPABASE_URL ?? "",
  excursionsAnonKey: process.env.AUSFLUGFINDER_SUPABASE_ANON_KEY ?? "",
  /**
   * Fahrzeiten mit Verkehrslage (Google Routes API). Fehlt der Schlüssel,
   * rechnen alle Ansichten weiter mit der Fahrzeit von OSRM – das Feature
   * ist dann einfach nicht eingerichtet, nicht kaputt. Der Schlüssel gehört
   * in die Server-`.env` und NIE ins Repository oder ins Browser-Bundle.
   */
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
};
