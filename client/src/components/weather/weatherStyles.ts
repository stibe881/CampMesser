/**
 * Farbstile der Unwetter-Schweregrade (#438, aus Weather.tsx
 * herausgelöst) – von der Seite und «Deine Plätze» gemeinsam genutzt.
 */
export const severityStyles = {
  gefahr: "border-destructive/50 bg-destructive/10 text-destructive",
  warnung: "border-chart-4/50 bg-chart-4/10 text-foreground",
  info: "border-border bg-secondary/60 text-foreground",
} as const;
