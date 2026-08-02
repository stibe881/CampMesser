# Mehrsprachigkeit DE/FR/IT/EN – Arbeitsstand

Ziel (User-Auftrag): **komplett alles** übersetzen – UI und sämtliche Inhalte.
Diese Datei trackt den Fortschritt und wird nach Abschluss gelöscht.

## Architektur

- `shared/i18n.ts`: Sprachen, `L4`-Typ (erzwingt alle 4 Sprachen), `pick()`, `l4()`
- `client/src/i18n/index.tsx`: LanguageProvider, `useLanguage()`, `useT()`;
  Sprache in localStorage `campmesser.language` + Geräte-Sync-Schlüssel `language`
- UI-Wörterbücher: `client/src/i18n/de.ts` (kanonisch, Typ `Translation`),
  `fr.ts`, `it.ts`, `en.ts` (Typ-geprüft gegen de)
- Inhalts-Daten: Felder von `string` auf `L4` umgestellt, Anzeige via `pick(...)`
- Shared-Logik mit Nutzertexten: Funktionen erhalten `lang: Language = "de"`

## Checkliste

### Infrastruktur

- [x] shared/i18n.ts, Provider, Sprachwahl im Profil + Header, Sync-Schlüssel

### UI-Seiten (Wörterbuch + Umstellung)

- [x] AppShell (Navigation, Gruppen, Konto-Menü)
- [x] Home (Hero, Widgets, Suche, Sortier-Modus)
- [x] Login, Profile
- [x] PackLists, PackListDetail, SharedPackList, PackOptimizer, Inventory
- [x] Weather, Water
- [x] SunCompass, Level
- [x] Sos, Energy, Drying, Quiet, Lawn
- [ ] Spots, SpotDetail, SharedSpot, Trips
- [ ] FirstAid, Knots (+Quiz), Nature, Recipes (+Editor), Food
- [ ] Family (+Editoren), HuntPrint
- [x] NotFound, ErrorBoundary, LoginPrompt, PageHeader-Verwendungen

### Inhalts-Daten (L4)

- [x] data/modules.ts (Titel/Beschreibungen)
- [ ] data/firstAid.ts (10 Themen)
- [ ] data/knots.ts (8 Knoten)
- [ ] data/nature.ts (16 Einträge + Kategorien)
- [ ] data/recipes.ts (18 Rezepte inkl. Zutaten/Schritte)
- [ ] data/familyActivities.ts (6 Jagden, Quizze)
- [x] data/emergency.ts
- [x] shared/packTemplates.ts (Szenarien + Einträge)

### Shared-Logik mit Nutzertexten (lang-Parameter)

- [x] shared/weather.ts (describeWeatherCode, detectAlerts)
- [x] shared/fireDanger.ts (Stufen + Regeln)
- [x] shared/astro.ts (Namen, Tipps, Radiant als L4; Nature.tsx picked bereits)
- [x] shared/moon.ts (Phasen-Labels, stargazingQuality; lang-Parameter)
- [x] shared/level.ts (Unterleg-Tipps; lang-Parameter)
- [x] shared/solar.ts (compassDirection mit lang; Energy.tsx reicht lang durch)
- [x] shared/drying.ts (Material-Labels als L4, sunsetVerdict/formatHours mit
      lang-Parameter)
- [x] shared/lawn.ts (formatHours mit lang-Parameter; Verdict-/Options-Texte
      liegen im lawn-Namespace des Wörterbuchs)
- [ ] shared/food.ts (MHD-Labels)
- [x] shared/calculators.ts (Transport-Profile als L4, analyzePack-Hinweise mit
      lang-Parameter; PackOptimizer reicht lang durch)

### Abschluss

- [ ] Datums-Formatierungen auf LOCALE_TAGS umgestellt
- [ ] Tests angepasst/ergänzt, alles grün, Build ok
- [ ] Diese Datei löschen, todo.md nachführen
