import { useMemo, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { Link } from "wouter";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Gauge,
  Minus,
  Plus,
  Scale,
  Trash2,
  Truck,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVEL_PROFILES, type LevelProfile } from "@shared/level";
import {
  defaultVehicleRole,
  findVehicle,
  kgToInput,
  newVehicleId,
  parseKgInput,
  sanitizeVehicles,
  VEHICLE_ROLES,
  type VehicleProfile,
  type VehicleRole,
} from "@shared/vehicles";
import {
  evaluatePayload,
  formatKg,
  noseWeightRule,
  sanitizePayloadPlan,
  DEFAULT_PERSON_KG,
  MAX_PAYLOAD_ITEMS,
  MAX_PAYLOAD_LABEL_LENGTH,
  MAX_PERSON_COUNT,
  type LoadPosition,
  type PayloadCheck,
  type PayloadItem,
  type PayloadPlan,
  type PayloadStatus,
} from "@shared/payload";
import { computePackWeight } from "@shared/packWeight";
import { useI18n } from "@/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  acceptSyncedVehicles,
  loadPayloadPlan,
  loadVehicles,
  savePayloadPlan,
  saveVehicles,
} from "@/lib/vehicleStore";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import { cn } from "@/lib/utils";

/** Farben und Symbole der Ampel-Stufen. */
const STATUS_STYLES: Record<PayloadStatus, string> = {
  ok: "border-primary/50 bg-primary/10 text-primary",
  tight: "border-chart-4/60 bg-chart-4/15 text-chart-4",
  over: "border-destructive/60 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted text-muted-foreground",
};

function StatusIcon({ status }: { status: PayloadStatus }) {
  if (status === "over" || status === "tight")
    return <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />;
  if (status === "unknown")
    return <CircleHelp className="h-4 w-4 shrink-0" aria-hidden="true" />;
  return <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />;
}

export default function PayloadPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const { isAuthenticated } = useAuth();

  // Fahrzeug-Profile – dieselben wie in der Wasserwaage (#200)
  const initial = useState(() => loadVehicles(t.level.profileNames))[0];
  const [vehicles, setVehicles] = useState<VehicleProfile[]>(initial.vehicles);
  const vehiclesSync = useSyncedSetting<VehicleProfile[]>("vehicles", value => {
    const synced = acceptSyncedVehicles(value);
    if (synced.length > 0) setVehicles(synced);
  });
  const writeVehicles = (next: VehicleProfile[]) => {
    const clean = sanitizeVehicles(next);
    setVehicles(clean);
    saveVehicles(clean);
    vehiclesSync.push(clean);
  };

  const [plan, setPlan] = useState<PayloadPlan>(() => loadPayloadPlan());
  const planSync = useSyncedSetting<PayloadPlan>("payloadPlan", value =>
    setPlan(sanitizePayloadPlan(value))
  );
  const writePlan = (patch: Partial<PayloadPlan>) => {
    const next = sanitizePayloadPlan({ ...plan, ...patch });
    setPlan(next);
    savePayloadPlan(next);
    planSync.push(next);
  };

  const [editorOpen, setEditorOpen] = useState(false);
  const [itemLabel, setItemLabel] = useState("");
  const [itemKg, setItemKg] = useState("");
  const [itemWhere, setItemWhere] = useState<LoadPosition>("tow");

  const towVehicles = vehicles.filter(v => v.role === "tow");
  const trailerVehicles = vehicles.filter(v => v.role === "trailer");
  const towing = findVehicle(vehicles, plan.towVehicleId);
  const trailer = findVehicle(vehicles, plan.trailerVehicleId);

  // Packliste als Ladung: Gewicht über den Inventar-Abgleich (#87)
  const listsQuery = trpc.packing.lists.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const itemsQuery = trpc.packing.items.useQuery(
    { listId: plan.packListId ?? 0 },
    { enabled: isAuthenticated && plan.packListId !== null }
  );
  const packLists = (listsQuery.data ?? []).filter(l => l.archivedAt === null);
  const packWeight = useMemo(() => {
    const items = itemsQuery.data?.items ?? [];
    const inventory = inventoryQuery.data ?? [];
    if (plan.packListId === null || items.length === 0) return null;
    return computePackWeight(items, inventory);
  }, [itemsQuery.data, inventoryQuery.data, plan.packListId]);
  const packListKg = packWeight ? packWeight.totalGrams / 1000 : 0;

  const personsKg = plan.personCount * plan.personKg;
  const result = useMemo(
    () =>
      evaluatePayload({
        towing,
        trailer,
        loads: [
          { kg: personsKg, where: "tow" as LoadPosition },
          { kg: packListKg, where: plan.packListWhere },
          ...plan.items.map(i => ({ kg: i.kg, where: i.where })),
        ],
        measuredNoseKg: plan.measuredNoseKg,
      }),
    [towing, trailer, personsKg, packListKg, plan]
  );
  const rule = noseWeightRule(
    result.trailerTotalKg,
    result.checks.find(c => c.key === "noseWeight")?.limitKg ?? null
  );

  /** Ein Feld eines Fahrzeugs ändern und sofort sichern. */
  const patchVehicle = (id: string, patch: Partial<VehicleProfile>) => {
    writeVehicles(vehicles.map(v => (v.id === id ? { ...v, ...patch } : v)));
  };

  const addVehicle = () => {
    const id = newVehicleId();
    writeVehicles([
      ...vehicles,
      {
        id,
        name: t.payload.newVehicleName,
        kind: "bus",
        role: "tow",
        emptyKg: null,
        grossKg: null,
        towKg: null,
        noseKg: null,
        axleKg: null,
      },
    ]);
    setEditorOpen(true);
  };

  const removeVehicle = async (vehicle: VehicleProfile) => {
    if (!(await ask({ title: t.payload.deleteVehicleConfirm(vehicle.name) })))
      return;
    writeVehicles(vehicles.filter(v => v.id !== vehicle.id));
    // Gelöschte Fahrzeuge dürfen nicht als Auswahl stehen bleiben
    const patch: Partial<PayloadPlan> = {};
    if (plan.towVehicleId === vehicle.id) patch.towVehicleId = null;
    if (plan.trailerVehicleId === vehicle.id) patch.trailerVehicleId = null;
    if (
      patch.towVehicleId !== undefined ||
      patch.trailerVehicleId !== undefined
    )
      writePlan(patch);
  };

  const addItem = () => {
    const kg = parseKgInput(itemKg);
    const label = itemLabel.trim().slice(0, MAX_PAYLOAD_LABEL_LENGTH);
    if (!label || kg === null || plan.items.length >= MAX_PAYLOAD_ITEMS) return;
    const item: PayloadItem = {
      id: newVehicleId(),
      label,
      kg,
      where: itemWhere,
    };
    writePlan({ items: [...plan.items, item] });
    setItemLabel("");
    setItemKg("");
  };

  /** kg-Feld eines Fahrzeugs: erst beim Verlassen übernehmen (freies Tippen). */
  const kgField = (
    vehicle: VehicleProfile,
    field: "emptyKg" | "grossKg" | "towKg" | "noseKg" | "axleKg",
    label: string
  ) => (
    <div>
      <Label
        htmlFor={`veh-${vehicle.id}-${field}`}
        className="text-xs text-muted-foreground"
      >
        {label}
      </Label>
      <Input
        id={`veh-${vehicle.id}-${field}`}
        inputMode="decimal"
        className="mt-1 h-9"
        defaultValue={kgToInput(vehicle[field], lang)}
        onBlur={event =>
          patchVehicle(vehicle.id, {
            [field]: parseKgInput(event.target.value),
          })
        }
      />
    </div>
  );

  const checkLabel = (check: PayloadCheck) => t.payload.checkNames[check.key];

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title={t.payload.title} subtitle={t.payload.subtitle} />

      <p className="mb-5 rounded-lg border border-border bg-muted/60 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {t.payload.disclaimer}
      </p>

      {/* Gespann wählen */}
      <Card className="mb-4">
        <CardContent className="space-y-3 pt-6">
          <p className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
            {t.payload.rigTitle}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="payload-tow">{t.payload.towLabel}</Label>
              <Select
                value={plan.towVehicleId ?? "none"}
                onValueChange={value =>
                  writePlan({ towVehicleId: value === "none" ? null : value })
                }
              >
                <SelectTrigger id="payload-tow" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.payload.noneOption}</SelectItem>
                  {towVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payload-trailer">{t.payload.trailerLabel}</Label>
              <Select
                value={plan.trailerVehicleId ?? "none"}
                onValueChange={value =>
                  writePlan({
                    trailerVehicleId: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger id="payload-trailer" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t.payload.noTrailerOption}
                  </SelectItem>
                  {trailerVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditorOpen(open => !open)}
              aria-expanded={editorOpen}
            >
              <Gauge className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {editorOpen ? t.payload.hideVehicles : t.payload.showVehicles}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t.payload.vehiclesHint}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Fahrzeug-Profile bearbeiten */}
      {editorOpen && (
        <Card className="mb-4">
          <CardContent className="space-y-4 pt-6">
            <p className="text-xs text-muted-foreground">
              {t.payload.limitsHint}
            </p>
            {vehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className="space-y-3 rounded-lg border border-border p-3.5"
              >
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Label
                      htmlFor={`veh-${vehicle.id}-name`}
                      className="text-xs text-muted-foreground"
                    >
                      {t.payload.nameLabel}
                    </Label>
                    <Input
                      id={`veh-${vehicle.id}-name`}
                      className="mt-1 h-9"
                      defaultValue={vehicle.name}
                      onBlur={event => {
                        const name = event.target.value.trim();
                        if (name) patchVehicle(vehicle.id, { name });
                        else event.target.value = vehicle.name;
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground/70 hover:text-destructive"
                    onClick={() => removeVehicle(vehicle)}
                    aria-label={t.payload.deleteVehicleAria(vehicle.name)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor={`veh-${vehicle.id}-kind`}
                      className="text-xs text-muted-foreground"
                    >
                      {t.payload.kindLabel}
                    </Label>
                    <Select
                      value={vehicle.kind}
                      onValueChange={value =>
                        patchVehicle(vehicle.id, {
                          kind: value as LevelProfile,
                          role: defaultVehicleRole(value as LevelProfile),
                        })
                      }
                    >
                      <SelectTrigger
                        id={`veh-${vehicle.id}-kind`}
                        className="mt-1 h-9"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVEL_PROFILES.map(kind => (
                          <SelectItem key={kind} value={kind}>
                            {t.level.profileNames[kind]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor={`veh-${vehicle.id}-role`}
                      className="text-xs text-muted-foreground"
                    >
                      {t.payload.roleLabel}
                    </Label>
                    <Select
                      value={vehicle.role}
                      onValueChange={value =>
                        patchVehicle(vehicle.id, { role: value as VehicleRole })
                      }
                    >
                      <SelectTrigger
                        id={`veh-${vehicle.id}-role`}
                        className="mt-1 h-9"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {t.payload.roleNames[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {vehicle.role !== "none" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {kgField(vehicle, "emptyKg", t.payload.emptyKgLabel)}
                    {kgField(vehicle, "grossKg", t.payload.grossKgLabel)}
                    {vehicle.role === "tow" &&
                      kgField(vehicle, "towKg", t.payload.towKgLabel)}
                    {kgField(vehicle, "noseKg", t.payload.noseKgLabel)}
                    {kgField(vehicle, "axleKg", t.payload.axleKgLabel)}
                  </div>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addVehicle}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.payload.addVehicle}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ladung */}
      <Card className="mb-4">
        <CardContent className="space-y-4 pt-6">
          <p className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
            {t.payload.loadTitle}
          </p>

          {/* Personen */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {t.payload.personsLabel}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={plan.personCount <= 0}
                  onClick={() =>
                    writePlan({ personCount: plan.personCount - 1 })
                  }
                  aria-label={t.payload.personsDecreaseAria}
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <span className="w-6 text-center font-mono text-lg font-semibold">
                  {plan.personCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={plan.personCount >= MAX_PERSON_COUNT}
                  onClick={() =>
                    writePlan({ personCount: plan.personCount + 1 })
                  }
                  aria-label={t.payload.personsIncreaseAria}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="w-28">
              <Label
                htmlFor="payload-person-kg"
                className="text-xs text-muted-foreground"
              >
                {t.payload.personKgLabel}
              </Label>
              <Input
                id="payload-person-kg"
                inputMode="decimal"
                className="mt-1 h-9"
                defaultValue={kgToInput(plan.personKg, lang)}
                onBlur={event =>
                  writePlan({
                    personKg:
                      parseKgInput(event.target.value) ?? DEFAULT_PERSON_KG,
                  })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t.payload.personsHint(formatKg(personsKg, lang))}
            </p>
          </div>

          {/* Packliste als Ladung */}
          {isAuthenticated && packLists.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <Label htmlFor="payload-list">{t.payload.packListLabel}</Label>
                <Select
                  value={
                    plan.packListId === null ? "none" : String(plan.packListId)
                  }
                  onValueChange={value =>
                    writePlan({
                      packListId: value === "none" ? null : Number(value),
                    })
                  }
                >
                  <SelectTrigger id="payload-list" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t.payload.packListNone}
                    </SelectItem>
                    {packLists.map(list => (
                      <SelectItem key={list.id} value={String(list.id)}>
                        {list.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {plan.packListId !== null && (
                <div>
                  <Label htmlFor="payload-list-where">
                    {t.payload.positionLabel}
                  </Label>
                  <Select
                    value={plan.packListWhere}
                    onValueChange={value =>
                      writePlan({ packListWhere: value as LoadPosition })
                    }
                  >
                    <SelectTrigger id="payload-list-where" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tow">
                        {t.payload.positionNames.tow}
                      </SelectItem>
                      <SelectItem value="trailer">
                        {t.payload.positionNames.trailer}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {packWeight && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  {t.payload.packListWeight(formatKg(packListKg, lang))}
                  {packWeight.unmatchedCount > 0 && (
                    <>
                      {" · "}
                      {t.payload.packListMissing(packWeight.unmatchedCount)}
                    </>
                  )}
                </p>
              )}
            </div>
          )}
          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground">
              {t.payload.packListLoggedOut}
            </p>
          )}

          {/* Freie Posten */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t.payload.itemsTitle}</p>
            {plan.items.length > 0 && (
              <ul className="space-y-1.5">
                {plan.items.map(item => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    <span className="font-mono">{formatKg(item.kg, lang)}</span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                      {t.payload.positionNames[item.where]}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground/70 hover:text-destructive"
                      onClick={() =>
                        writePlan({
                          items: plan.items.filter(i => i.id !== item.id),
                        })
                      }
                      aria-label={t.payload.removeItemAria(item.label)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="h-9 min-w-40 flex-1"
                value={itemLabel}
                maxLength={MAX_PAYLOAD_LABEL_LENGTH}
                placeholder={t.payload.itemLabelPlaceholder}
                aria-label={t.payload.itemLabelPlaceholder}
                onChange={event => setItemLabel(event.target.value)}
              />
              <Input
                className="h-9 w-20"
                inputMode="decimal"
                value={itemKg}
                placeholder={t.payload.itemKgPlaceholder}
                aria-label={t.payload.itemKgPlaceholder}
                onChange={event => setItemKg(event.target.value)}
              />
              <Select
                value={itemWhere}
                onValueChange={value => setItemWhere(value as LoadPosition)}
              >
                <SelectTrigger
                  className="h-9 w-36"
                  aria-label={t.payload.positionLabel}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tow">
                    {t.payload.positionNames.tow}
                  </SelectItem>
                  <SelectItem value="trailer">
                    {t.payload.positionNames.trailer}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={addItem}
                disabled={!itemLabel.trim() || parseKgInput(itemKg) === null}
              >
                {t.payload.addItem}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.payload.itemsHint}
            </p>
          </div>

          {/* Gemessene Stützlast */}
          {trailer && (
            <div className="w-44">
              <Label
                htmlFor="payload-nose"
                className="text-xs text-muted-foreground"
              >
                {t.payload.noseMeasuredLabel}
              </Label>
              <Input
                id="payload-nose"
                inputMode="decimal"
                className="mt-1 h-9"
                defaultValue={kgToInput(plan.measuredNoseKg, lang)}
                onBlur={event =>
                  writePlan({
                    measuredNoseKg: parseKgInput(event.target.value),
                  })
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t.payload.noseMeasuredHint}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ergebnis */}
      <Card
        className={cn(
          "mb-4",
          result.worst === "over" && "border-destructive/50",
          result.worst === "ok" &&
            result.checks.length > 0 &&
            "border-primary/50"
        )}
      >
        <CardContent className="space-y-3 pt-6">
          <p className="font-serif text-lg font-semibold">
            {t.payload.resultTitle}
          </p>
          {result.checks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.payload.noVehicleHint}
            </p>
          ) : (
            <>
              <p
                className={cn(
                  "rounded-lg border px-3.5 py-2.5 text-sm font-semibold",
                  STATUS_STYLES[result.worst]
                )}
                role="status"
              >
                {t.payload.verdict[result.worst]}
              </p>
              <ul className="space-y-2">
                {result.checks.map(check => (
                  <li
                    key={check.key}
                    className={cn(
                      "rounded-lg border px-3.5 py-2.5",
                      STATUS_STYLES[check.status]
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <StatusIcon status={check.status} />
                      <span className="flex-1">{checkLabel(check)}</span>
                      <span className="text-xs font-medium">
                        {t.payload.statusNames[check.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-foreground/80">
                      {check.missing === "notComputable"
                        ? t.payload.notComputable
                        : check.missing === "limit"
                          ? t.payload.missingLimit
                          : check.missing === "value"
                            ? t.payload.missingValue
                            : t.payload.checkLine(
                                formatKg(check.actualKg ?? 0, lang),
                                formatKg(check.limitKg ?? 0, lang),
                                check.overKg && check.overKg > 0
                                  ? t.payload.overBy(
                                      formatKg(check.overKg, lang)
                                    )
                                  : t.payload.freeLeft(
                                      formatKg(check.freeKg ?? 0, lang)
                                    )
                              )}
                      {check.estimated && check.missing === null && (
                        <> · {t.payload.estimatedNote}</>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                {t.payload.totalsLine(
                  result.towTotalKg === null
                    ? "–"
                    : formatKg(result.towTotalKg, lang),
                  result.trailerTotalKg === null
                    ? "–"
                    : formatKg(result.trailerTotalKg, lang),
                  result.trainTotalKg === null
                    ? "–"
                    : formatKg(result.trainTotalKg, lang)
                )}
              </p>
              {rule && (
                <p className="rounded-lg bg-accent/50 px-3.5 py-2.5 text-xs leading-relaxed text-accent-foreground">
                  {t.payload.noseRule(
                    formatKg(rule.minKg, lang),
                    formatKg(rule.maxKg, lang),
                    formatKg(rule.recommendedKg, lang)
                  )}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {t.payload.levelHint}{" "}
        <Link
          href="/wasserwaage"
          className="font-medium text-primary hover:underline"
        >
          {t.payload.levelLink}
        </Link>
      </p>
    </div>
  );
}
