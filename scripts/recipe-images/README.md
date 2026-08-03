# Rezept-Bildkarten

Erzeugt die Bilder für jene eingebauten Rezepte, für die es kein Foto gibt.
Alle Bilder teilen dieselbe Bildsprache (warmer Himmel, Hügel, Tischkante,
darauf das Gericht in flachen Formen) und sind bewusst textfrei, damit sie in
allen vier Sprachen passen.

```sh
cd scripts/recipe-images
npm install sharp --no-save
node render.mjs                      # schreibt nach ./img
cp img/*.webp ../../client/src/assets/
```

- `scene.mjs` – gemeinsamer Hintergrund und Bausteine (Schüssel, Pfanne,
  Teller, Feuerschale, Dampf).
- `dishes.mjs` – ein Eintrag pro Rezept-Id.
- `render.mjs` – rendert 800×600 WebP (gleiches Seitenverhältnis wie die
  Rezeptkarten, deshalb kein Beschnitt).

Die Streuung der Zutaten läuft über einen festen Startwert statt `Math.random`,
damit ein erneuter Lauf dieselben Bilder ergibt.
