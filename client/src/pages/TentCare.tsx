import CareGuides from "@/components/CareGuides";
import { tentCareGuides } from "@/data/tentCare";
import { useT } from "@/i18n";

/** Zeltpflege-Ratgeber (#265) – Inhalte und Anzeige sind bewusst getrennt. */
export default function TentCarePage() {
  const t = useT();
  return (
    <CareGuides
      guides={tentCareGuides}
      title={t.tentCare.title}
      subtitle={t.tentCare.subtitle}
    />
  );
}
