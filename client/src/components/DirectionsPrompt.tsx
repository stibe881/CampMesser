import { useEffect, useState } from "react";
import { Apple, MapPin, Navigation } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DIRECTIONS_EVENT,
  defaultProvider,
  openInMaps,
  saveMapsPreference,
  type DirectionsRequest,
  type MapsProvider,
} from "@/lib/directions";

/**
 * «Womit navigieren?» – fragt einmal, ob Apple Karten oder Google Maps.
 *
 * Sitzt im AppShell und lauscht auf das Ereignis aus `openDirections`.
 * So braucht kein einziger Routen-Knopf einen eigenen Dialog, und auch die
 * von Hand gebauten Sprechblasen der Karte kommen damit aus.
 *
 * DIE WAHL WIRD NUR AUF WUNSCH BEHALTEN: Das Häkchen ist vorangekreuzt,
 * denn wer zum zweiten Mal dieselbe App wählt, will die Frage nicht mehr
 * sehen. Wer es abwählt, wird beim nächsten Mal wieder gefragt – etwa im
 * Ausland, wo die Karten-Abdeckung den Ausschlag gibt. Umstellen geht
 * später im Profil.
 *
 * REIHENFOLGE der beiden Knöpfe: Die vom Gerät nahegelegte App steht oben.
 * Auf dem iPhone ist das Apple Karten, sonst Google Maps.
 */
export default function DirectionsPrompt() {
  const { t } = useI18n();
  const [target, setTarget] = useState<DirectionsRequest | null>(null);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<DirectionsRequest>).detail;
      if (!detail) return;
      setRemember(true);
      setTarget(detail);
    };
    window.addEventListener(DIRECTIONS_EVENT, onRequest);
    return () => window.removeEventListener(DIRECTIONS_EVENT, onRequest);
  }, []);

  const choose = (provider: MapsProvider) => {
    if (!target) return;
    if (remember) saveMapsPreference(provider);
    // Erst schliessen, dann öffnen: Der Klick gilt weiterhin als
    // Nutzer-Aktion, das Fenster wird also nicht als Popup abgefangen.
    setTarget(null);
    openInMaps(target.lat, target.lon, provider);
  };

  const suggested = defaultProvider();
  const order: MapsProvider[] =
    suggested === "apple" ? ["apple", "google"] : ["google", "apple"];

  return (
    <Dialog open={target !== null} onOpenChange={() => setTarget(null)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.directions.title}
          </DialogTitle>
          <DialogDescription>{t.directions.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {order.map(provider => (
            <Button
              key={provider}
              type="button"
              variant={provider === suggested ? "default" : "outline"}
              className="justify-start"
              onClick={() => choose(provider)}
            >
              {provider === "apple" ? (
                <Apple className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {provider === "apple" ? t.directions.apple : t.directions.google}
            </Button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={remember}
            onCheckedChange={value => setRemember(value === true)}
          />
          {t.directions.remember}
        </label>
        <p className="text-xs text-muted-foreground/80">
          {t.directions.changeHint}
        </p>
      </DialogContent>
    </Dialog>
  );
}
