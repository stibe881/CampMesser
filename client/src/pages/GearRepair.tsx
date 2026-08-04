import CareGuides from "@/components/CareGuides";
import { gearRepairGuides } from "@/data/gearRepair";
import { useT } from "@/i18n";

/** Reparatur-Ratgeber Ausrüstung (#266) – gleiche Anzeige wie die Zeltpflege. */
export default function GearRepairPage() {
  const t = useT();
  return (
    <CareGuides
      guides={gearRepairGuides}
      title={t.gearRepair.title}
      subtitle={t.gearRepair.subtitle}
    />
  );
}
