import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  Clock,
  CalendarDays,
  ChevronDown,
  CloudSun,
  Copy,
  Eye,
  EyeOff,
  CopyPlus,
  Download,
  Fuel,
  Gauge,
  GraduationCap,
  LayoutGrid,
  List,
  ListChecks,
  Loader2,
  LogOut,
  MapPin,
  MapPinned,
  MessageSquare,
  Moon,
  Pencil,
  Pin,
  Plus,
  Printer,
  Share2,
  ShoppingBasket,
  Signpost,
  Sparkles,
  Star,
  Tent,
  Trash2,
  Trophy,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n, useT } from "@/i18n";

export default function TripPitchDetails({
  trip,
}: {
  trip: {
    pitchNumber: string | null;
    wifiName: string | null;
    wifiPassword: string | null;
    pitchNotes: string | null;
  };
}) {
  const t = useT();
  const [showPassword, setShowPassword] = useState(false);
  const has =
    trip.pitchNumber || trip.wifiName || trip.wifiPassword || trip.pitchNotes;
  if (!has) return null;
  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
      <p className="flex items-center gap-1.5 font-medium">
        <MapPinned className="h-4 w-4 text-primary" aria-hidden="true" />
        {t.trips.pitchSectionTitle}
      </p>
      <dl className="mt-1.5 space-y-1">
        {trip.pitchNumber && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">
              {t.trips.pitchNumberLabel}
            </dt>
            <dd className="font-medium">{trip.pitchNumber}</dd>
          </div>
        )}
        {trip.wifiName && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-muted-foreground">{t.trips.wifiNameLabel}</dt>
            <dd className="font-medium">{trip.wifiName}</dd>
          </div>
        )}
        {trip.wifiPassword && (
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-muted-foreground">
              {t.trips.wifiPasswordLabel}
            </dt>
            <dd className="font-mono font-medium">
              {showPassword ? trip.wifiPassword : "••••••••"}
            </dd>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowPassword(v => !v)}
              aria-label={
                showPassword
                  ? t.trips.wifiPasswordHide
                  : t.trips.wifiPasswordShow
              }
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(trip.wifiPassword ?? "")
                  .then(() => toast.success(t.common.linkCopied))
                  .catch(() => toast.error(t.common.copyFailed));
              }}
              aria-label={t.trips.wifiPasswordCopy}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </dl>
      {trip.pitchNotes && (
        <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground">
          {trip.pitchNotes}
        </p>
      )}
    </div>
  );
}

/** Pack-Fortschritt einer verknüpften Liste, z. B. «12 von 19 gepackt». */
