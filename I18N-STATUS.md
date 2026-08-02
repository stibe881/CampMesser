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

- [ ] shared/i18n.ts, Provider, Sprachwahl im Profil + Header, Sync-Schlüssel

### UI-Seiten (Wörterbuch + Umstellung)

- [ ] AppShell (Navigation, Gruppen, Konto-Menü)
- [ ] Home (Hero, Widgets, Suche, Sortier-Modus)
- [ ] Login, Profile
- [ ] PackLists, PackListDetail, SharedPackList, PackOptimizer, Inventory
- [ ] Sos, Weather, SunCompass, Energy, Water, Drying, Quiet, Lawn, Level
- [ ] Spots, SpotDetail, SharedSpot, Trips
- [ ] FirstAid, Knots (+Quiz), Nature, Recipes (+Editor), Food
- [ ] Family (+Editoren), HuntPrint
- [ ] NotFound, ErrorBoundary, LoginPrompt, PageHeader-Verwendungen

### Inhalts-Daten (L4)

- [ ] data/modules.ts (Titel/Beschreibungen)
- [ ] data/firstAid.ts (10 Themen)
- [ ] data/knots.ts (8 Knoten)
- [ ] data/nature.ts (16 Einträge + Kategorien)
- [ ] data/recipes.ts (18 Rezepte inkl. Zutaten/Schritte)
- [ ] data/familyActivities.ts (6 Jagden, Quizze)
- [ ] data/emergency.ts
- [ ] shared/packTemplates.ts (Szenarien + Einträge)

### Shared-Logik mit Nutzertexten (lang-Parameter)

- [ ] shared/weather.ts (describeWeatherCode, detectAlerts)
- [ ] shared/fireDanger.ts (Stufen + Regeln)
- [ ] shared/astro.ts (Namen ok, Tipps/Radiant)
- [ ] shared/moon.ts (Phasen-Labels, stargazingQuality)
- [ ] shared/level.ts (Unterleg-Tipps)
- [ ] shared/drying.ts (Material-Labels/Hinweise)
- [ ] shared/lawn.ts (Empfehlungen)
- [ ] shared/food.ts (MHD-Labels)
- [ ] shared/calculators.ts (prüfen)

### Abschluss

- [ ] Datums-Formatierungen auf LOCALE_TAGS umgestellt
- [ ] Tests angepasst/ergänzt, alles grün, Build ok
- [ ] Diese Datei löschen, todo.md nachführen
