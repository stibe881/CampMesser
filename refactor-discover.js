import fs from "fs";

const file = "client/src/pages/MapView.tsx";
let code = fs.readFileSync(file, "utf-8");

// 1. Remove discoverOn state
code = code.replace("const [discoverOn, setDiscoverOn] = useState(false);", "");

// 2. Replace discoverOn with layerVisibility.campsites in searchHere
code = code.replace(
  "if (discoverOn) void searchCampsites();",
  "if (layerVisibility.campsites) void searchCampsites();"
);
code = code.replace(
  "discoverOn,\n    layerVisibility.firepits,",
  "layerVisibility.campsites,\n    layerVisibility.firepits,"
);

// 3. Replace toggleDiscover with clearCampsites
code = code.replace(
  /\/\*\* Toggle-Chip: Einschalten sucht sofort, Ausschalten räumt alles weg\. \*\/\n\s*const toggleDiscover = useCallback\(\(\) => \{\n\s*setDiscoverOn\(prev => \{\n\s*const next = !prev;\n\s*if \(next\) \{\n\s*void searchCampsites\(\);\n\s*\} else \{\n\s*abortRef\.current\?\.abort\(\);\n\s*setCampsites\(\[\]\);\n\s*setDiscoverLoading\(false\);\n\s*setDiscoverError\(false\);\n\s*setNeedsZoom\(false\);\n\s*setSearched\(false\);\n\s*setMoved\(false\);\n\s*\}\n\s*return next;\n\s*\}\);\n\s*\}, \[searchCampsites\]\);/,
  `const clearCampsites = useCallback(() => {
    abortRef.current?.abort();
    setCampsites([]);
    setDiscoverLoading(false);
    setDiscoverError(false);
    setNeedsZoom(false);
    setSearched(false);
    setMoved(false);
  }, []);`
);

// 4. Update toggleLayerChip
code = code.replace(
  /\} else if \(key === "family"\) \{\n\s*if \(willBeOn\) void searchFamilyPlaces\(\);\n\s*else clearFamilyPlaces\(\);\n\s*\}/,
  `} else if (key === "family") {
        if (willBeOn) void searchFamilyPlaces();
        else clearFamilyPlaces();
      } else if (key === "campsites") {
        if (willBeOn) void searchCampsites();
        else clearCampsites();
      }`
);
code = code.replace(
  "clearFirepits,\n      layerVisibility,",
  "clearCampsites,\n      clearFirepits,\n      layerVisibility,"
);
code = code.replace(
  "searchFirepits,\n      toggleLayer,",
  "searchCampsites,\n      searchFirepits,\n      toggleLayer,"
);

// 5. Replace discoverOn in useEffect for overpassLayersOn
code = code.replace(
  "discoverOn || layerVisibility.firepits || layerVisibility.family;",
  "layerVisibility.campsites || layerVisibility.firepits || layerVisibility.family;"
);

// 6. Remove the top-bar button for discoverOn
code = code.replace(
  /\s*<button\n\s*type="button"\n\s*onClick=\{toggleDiscover\}\n\s*aria-pressed=\{discoverOn\}\n\s*className=\{cn\(\n\s*"flex items-center gap-1\.5 rounded-full px-3 py-1\.5 text-xs font-medium transition-colors",\n\s*discoverOn\n\s*\? "bg-primary text-primary-foreground"\n\s*: "bg-muted text-muted-foreground hover:text-foreground"\n\s*\)\}\n\s*>\n\s*<Compass className="h-3\.5 w-3\.5" aria-hidden="true" \/>\n\s*\{t\.mapView\.discoverToggle\}\n\s*<\/button>/,
  ""
);

// 7. Fix render checks
code = code.replace(
  /\{discoverOn && \(\n\s*<Button/g,
  "{layerVisibility.campsites && (\n            <Button"
);

code = code.replace(
  /\{layerVisibility\.campsites &&\n\s*discoverOn &&\n\s*visibleCampsites\.length > 0 && \(/g,
  "{layerVisibility.campsites &&\n          visibleCampsites.length > 0 && ("
);

code = code.replace(
  /\{discoverOn && \(\n\s*<span/g,
  "{layerVisibility.campsites && (\n          <span"
);

code = code.replace(
  /discoverOn &&\n\s*<span/g,
  "layerVisibility.campsites &&\n            <span"
);

code = code.replace(/discoverOn &&/g, "layerVisibility.campsites &&");

fs.writeFileSync(file, code);
console.log("Done refactoring discoverOn.");
