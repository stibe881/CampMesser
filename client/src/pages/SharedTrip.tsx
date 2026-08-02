import { useMemo } from "react";
import { useParams } from "wouter";
import {
  CalendarDays,
  CloudSun,
  ListChecks,
  Loader2,
  MapPin,
  Moon,
  Phone,
  Star,
  Tent,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import SpotAttributeChips from "@/components/SpotAttributeChips";
import { parseSpotAttributes } from "@shared/spotAttributes";
import { recipes } from "@/data/recipes";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS, pick } from "@shared/i18n";
import { MEALS, MEAL_LABELS, tripDays } from "@shared/menuPlan";
import { tripNights } from "@shared/trips";
import { parseTripWeather } from "@shared/tripWeather";
import { cn } from "@/lib/utils";

/**
 * Öffentlicher Reise-Hub (/reise/:token): bündelt Reise-Infos, die
 * Platz-Basisdaten, den Menüplan und die verknüpfte Packliste einer geteilten
 * Reise – ohne Anmeldung erreichbar, nur lesend (Abhaken der Packliste läuft
 * über die bestehende geteilte-Listen-Mechanik packing.sharedToggle).
 * Bewusst ohne private Fotos.
 */
export default function SharedTripPage() {
  const { lang, t } = useI18n();
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const utils = trpc.useUtils();

  const query = trpc.trips.sharedGet.useQuery(
    { token },
    { enabled: token.length >= 8, retry: false, refetchInterval: 15000 }
  );
  const data = query.data;
  const listToken = data?.packList?.shareToken ?? null;

  // Abhaken über den Teil-Token der LISTE (bestehende Mechanik), optimistisch
  // im Hub-Cache gespiegelt – Rollback bei Serverfehlern.
  const toggleMutation = trpc.packing.sharedToggle.useMutation({
    onMutate: async input => {
      await utils.trips.sharedGet.cancel({ token });
      const prev = utils.trips.sharedGet.getData({ token });
      utils.trips.sharedGet.setData({ token }, old =>
        old?.packList
          ? {
              ...old,
              packList: {
                ...old.packList,
                items: old.packList.items.map(i =>
                  i.id === input.itemId ? { ...i, checked: input.checked } : i
                ),
              },
            }
          : old
      );
      return { prev };
    },
    onError: (_e, _i, ctx) => {
      utils.trips.sharedGet.setData({ token }, ctx?.prev);
      toast.error(t.sharedPackList.toggleFailed);
    },
    onSettled: () => utils.trips.sharedGet.invalidate({ token }),
  });

  const weather = useMemo(
    () => parseTripWeather(data?.trip.weatherJson ?? null),
    [data?.trip.weatherJson]
  );

  /** Statische Rezepte nach Id – für die Titel-Auflösung des Menüplans. */
  const staticById = useMemo(() => {
    const map = new Map<string, (typeof recipes)[number]>();
    recipes.forEach(r => map.set(r.id, r));
    return map;
  }, []);

  if (query.isLoading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <Tent
          className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
          aria-hidden="true"
        />
        <p className="font-medium">{t.sharedTrip.invalid}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.sharedTrip.invalidHint}
        </p>
      </div>
    );
  }

  const { trip, spot, menu, packList } = data;
  const placeName = spot?.name ?? trip.location ?? t.trips.unknownPlace;
  const title = trip.title || placeName;
  const nights = tripNights(trip.startDate, trip.endDate);
  const fmtDay = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  const formatRange = (startDate: string, endDate: string): string => {
    const fmt = (iso: string) =>
      new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    if (startDate === endDate) return fmt(startDate);
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  };

  /** Anzeigetitel eines Menü-Slots in der aktiven Sprache. */
  const entryTitle = (entry: (typeof menu)[number]): string => {
    if (entry.recipeId) {
      const recipe = staticById.get(entry.recipeId);
      return recipe ? pick(recipe.name, lang) : entry.recipeId;
    }
    if (entry.customRecipeName) return entry.customRecipeName;
    return entry.freeText ?? "–";
  };
  const menuDays = tripDays(trip.startDate, trip.endDate).filter(day =>
    menu.some(e => e.day === day)
  );
  const entryFor = (day: string, meal: (typeof MEALS)[number]) =>
    menu.find(e => e.day === day && e.meal === meal);

  // Packliste nach Person gruppieren: «Allgemein» zuerst (Muster SharedPackList)
  const items = packList?.items ?? [];
  const checkedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;
  const personKeys: (string | null)[] = [null, ...(packList?.persons ?? [])];
  for (const item of items) {
    const name = item.assignee?.trim();
    if (name && !personKeys.includes(name)) personKeys.push(name);
  }
  const sections = personKeys
    .map(person => {
      const sectionItems = items.filter(item =>
        person === null
          ? !item.assignee?.trim()
          : (item.assignee ?? "").trim() === person
      );
      const grouped = sectionItems.reduce<Record<string, typeof items>>(
        (acc, item) => {
          (acc[item.category] ??= []).push(item);
          return acc;
        },
        {}
      );
      return { person, items: sectionItems, grouped };
    })
    .filter(section => section.items.length > 0);
  const showPersonHeadings = !(
    sections.length <= 1 && sections[0]?.person == null
  );

  return (
    <div className="container max-w-2xl py-6">
      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <Tent className="h-3.5 w-3.5" aria-hidden="true" />
        {t.sharedTrip.badge}
      </p>
      <h1 className="font-serif text-2xl font-bold md:text-3xl">{title}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {trip.title && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {placeName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {formatRange(trip.startDate, trip.endDate)}
        </span>
        <span className="flex items-center gap-1">
          <Moon className="h-3.5 w-3.5" aria-hidden="true" />
          {t.trips.nightsCount(nights)}
        </span>
      </p>
      {trip.rating != null && (
        <p
          className="mt-1.5 flex items-center gap-0.5"
          aria-label={t.sharedTrip.ratingAria(trip.rating)}
        >
          {[1, 2, 3, 4, 5].map(n => (
            <Star
              key={n}
              className={cn(
                "h-4 w-4",
                n <= (trip.rating ?? 0)
                  ? "fill-chart-1 text-chart-1"
                  : "text-muted-foreground/40"
              )}
              aria-hidden="true"
            />
          ))}
        </p>
      )}
      {weather && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CloudSun className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">{t.trips.weatherTitle}: </span>
          {t.trips.weatherSummary(
            Math.round(weather.tMax),
            Math.round(weather.tMin)
          )}{" "}
          · {t.trips.weatherRainDays(weather.rainDays)}
        </p>
      )}
      {trip.notes && (
        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
          {trip.notes}
        </p>
      )}

      {/* Platz-Basisdaten (Muster SharedSpot – keine Fotos) */}
      {spot && (
        <Card className="mt-5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tent className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.sharedTrip.spotTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{spot.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {spot.latitude.toFixed(4)}°, {spot.longitude.toFixed(4)}°
            </p>
            {spot.note && (
              <p className="mt-2 text-sm text-muted-foreground">{spot.note}</p>
            )}
            <SpotAttributeChips
              attributes={parseSpotAttributes(spot.attributesJson)}
              lang={lang}
              className="mt-3"
            />
            {/* Kontakt & Check-in – nur wenn etwas hinterlegt ist */}
            {(spot.receptionPhone || spot.checkinInfo || spot.parcelNumber) && (
              <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
                {spot.receptionPhone && (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <dt className="flex w-36 shrink-0 items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {t.sharedTrip.contactPhone}
                    </dt>
                    <dd>
                      <a
                        href={`tel:${spot.receptionPhone.replace(/[^+\d]/g, "")}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {spot.receptionPhone}
                      </a>
                    </dd>
                  </div>
                )}
                {spot.checkinInfo && (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <dt className="w-36 shrink-0 text-muted-foreground">
                      {t.sharedTrip.contactCheckin}
                    </dt>
                    <dd>{spot.checkinInfo}</dd>
                  </div>
                )}
                {spot.parcelNumber && (
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <dt className="w-36 shrink-0 text-muted-foreground">
                      {t.sharedTrip.contactParcel}
                    </dt>
                    <dd>{spot.parcelNumber}</dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>
      )}

      {/* Menüplan als kompakte Tabelle (nur Tage mit Einträgen) */}
      {menuDays.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed
                className="h-4 w-4 text-primary"
                aria-hidden="true"
              />
              {t.sharedTrip.menuTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-border px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wide">
                      {t.sharedTrip.dayHeader}
                    </th>
                    {MEALS.map(meal => (
                      <th
                        key={meal}
                        className="border border-border px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wide"
                      >
                        {pick(MEAL_LABELS[meal], lang)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {menuDays.map(day => (
                    <tr key={day}>
                      <th className="border border-border px-2 py-1.5 text-left align-top text-xs font-semibold capitalize">
                        {fmtDay(day)}
                      </th>
                      {MEALS.map(meal => {
                        const entry = entryFor(day, meal);
                        return (
                          <td
                            key={meal}
                            className="border border-border px-2 py-1.5 align-top"
                          >
                            {entry ? (
                              <span className="break-words">
                                {entryTitle(entry)}
                              </span>
                            ) : (
                              <span
                                className="text-muted-foreground/40"
                                aria-hidden="true"
                              >
                                –
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verknüpfte Packliste – abhakbar über den Teil-Token der Liste */}
      {packList && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
              {t.sharedTrip.packListTitle}
              <span className="font-sans text-sm font-normal text-muted-foreground">
                {packList.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listToken === null && (
              <p className="mb-3 text-xs text-muted-foreground">
                {t.sharedTrip.packListNotShared}
              </p>
            )}
            <div className="mb-4">
              <Progress
                value={progress}
                aria-label={t.sharedPackList.progressAria(Math.round(progress))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t.sharedPackList.subtitle(checkedCount, items.length)}
              </p>
            </div>
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t.sharedPackList.emptyList}
              </p>
            )}
            <div className="space-y-6">
              {sections.map(section => (
                <section key={section.person ?? "__general__"}>
                  {showPersonHeadings && (
                    <h3 className="mb-2 flex items-center gap-1.5 border-b border-border pb-1.5 font-serif text-base font-semibold">
                      {section.person ? (
                        <UserRound
                          className="h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <Users
                          className="h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                      )}
                      {section.person ?? t.packListDetail.sectionGeneral}
                    </h3>
                  )}
                  <div className="space-y-4">
                    {Object.entries(section.grouped).map(
                      ([category, categoryItems]) => (
                        <div key={category}>
                          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {category}
                          </h4>
                          <ul className="space-y-1.5">
                            {categoryItems.map(item => (
                              <li
                                key={item.id}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2",
                                  item.checked && "bg-muted/60"
                                )}
                              >
                                <Checkbox
                                  id={`hub-item-${item.id}`}
                                  checked={item.checked}
                                  disabled={listToken === null}
                                  onCheckedChange={value => {
                                    if (listToken === null) return;
                                    toggleMutation.mutate({
                                      token: listToken,
                                      itemId: item.id,
                                      checked: value === true,
                                    });
                                  }}
                                  aria-label={t.sharedPackList.checkAria(
                                    item.name
                                  )}
                                />
                                <label
                                  htmlFor={`hub-item-${item.id}`}
                                  className={cn(
                                    "flex-1 cursor-pointer text-sm",
                                    item.checked &&
                                      "text-muted-foreground line-through"
                                  )}
                                >
                                  {item.name}
                                  {item.quantity > 1 && (
                                    <span className="ml-1.5 text-xs text-muted-foreground">
                                      × {item.quantity}
                                    </span>
                                  )}
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {t.sharedTrip.footer}
      </p>
    </div>
  );
}
