export const ENV = {
  appId: process.env.VITE_APP_ID || "campmesser",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
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
  /**
   * Google-Maps-Karte im Browser. ZWEI GETRENNTE SCHLÜSSEL, und das mit
   * Absicht: Der obere (`googleMapsApiKey`) wird nur serverseitig benutzt
   * und darf den Server nie verlassen. Dieser hier MUSS in den Browser –
   * anders kann die Karte nicht laden. Er ist deshalb kein Geheimnis,
   * sondern wird über die Herkunfts-Sperre (HTTP-Referrer) geschützt und
   * auf die Maps JavaScript API eingeschränkt.
   *
   * Die Karten-Id (Map ID) gehört zum Kartenstil und wird für die
   * HTML-Pins gebraucht. Fehlt eines von beidem, zeigt die App weiter die
   * OpenStreetMap-Karte – kein Fehler, nur eine andere Karte.
   */
  googleMapsBrowserKey: process.env.GOOGLE_MAPS_BROWSER_KEY ?? "",
  googleMapsMapId: process.env.GOOGLE_MAPS_MAP_ID ?? "",
};
