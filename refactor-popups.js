import fs from "fs";

const file = "client/src/pages/MapView.tsx";
let code = fs.readFileSync(file, "utf-8");

// Container
code = code.replaceAll(
  'popup.className = "space-y-1 overflow-y-auto max-h-[50vh] pr-1";',
  'popup.className = "flex flex-col gap-1.5 overflow-y-auto max-h-[50vh] pr-1 pb-1";'
);

// Title
code = code.replaceAll(
  'name.className = "font-semibold";',
  'name.className = "text-[15px] font-bold leading-tight text-slate-800";'
);

// Image
code = code.replaceAll(
  'image.className = "mb-1 h-24 w-full rounded-md object-cover";',
  'image.className = "mb-2 h-28 w-full rounded-lg object-cover shadow-sm";'
);

// Excursion cost
code = code.replaceAll(
  'cost.className = "text-xs";\n        cost.textContent = `${te.costLabel}: ${',
  'cost.className = "mt-0.5 w-fit rounded-md bg-slate-100 px-1.5 py-0.5 text-[12px] font-medium text-slate-600";\n        cost.textContent = `${te.costLabel}: ${'
);

// Facts / Meta (excursions, etc.)
code = code.replaceAll(
  'meta.className = "text-xs";',
  'meta.className = "text-[13px] font-medium text-slate-500 leading-snug";'
);
code = code.replaceAll(
  'desc.className = "text-xs";',
  'desc.className = "text-[13px] font-medium text-slate-500 leading-snug";'
);
code = code.replaceAll(
  'time.className = "text-xs text-muted-foreground";',
  'time.className = "text-[12px] font-medium text-slate-400";'
);

// Primary buttons
const primaryButtonClass =
  '"mt-1.5 flex w-full items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors no-underline"';

code = code.replaceAll(
  'link.className = "block text-sm font-medium underline";',
  "link.className = " + primaryButtonClass + ";"
);
code = code.replaceAll(
  'route.className = "block text-sm font-medium underline";',
  "route.className = " + primaryButtonClass + ";"
);
code = code.replaceAll(
  'button.className = "block text-sm font-medium text-primary hover:underline";',
  "button.className = " + primaryButtonClass + ";"
);
code = code.replaceAll(
  'button.className = "block w-full text-left text-sm font-medium text-primary hover:underline";',
  "button.className = " + primaryButtonClass + ";"
);

// Secondary buttons (Waldbrandgefahr, Dossier anlegen)
const secondaryButtonClass =
  '"mt-1 flex w-full items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors no-underline"';

code = code.replaceAll(
  'danger.className = "block text-sm font-medium text-red-600 underline";',
  'danger.className = "mt-1 flex w-full items-center justify-center rounded-md bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-200 transition-colors no-underline";'
);
code = code.replaceAll(
  'create.className = "block text-sm font-medium text-primary hover:underline";',
  "create.className = " + secondaryButtonClass + ";"
);
code = code.replaceAll(
  'site.className = "block font-medium underline";',
  "site.className = " + secondaryButtonClass + ";"
);

// Toggle (Details)
code = code.replaceAll(
  'toggle.className = "block text-sm font-medium underline";',
  'toggle.className = "mt-1 text-[13px] font-semibold text-primary hover:underline transition-colors text-left";'
);

fs.writeFileSync(file, code);
console.log("Done refactoring map popups.");
