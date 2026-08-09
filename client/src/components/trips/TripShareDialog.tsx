import { useEffect, useMemo, useRef, useState } from "react";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import { relativeAge, type ShareExpiryDays } from "@shared/sharing";
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
import { Link, useRoute, useSearch } from "wouter";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useI18n, useT } from "@/i18n";

export default function TripShareDialog({
  trip,
  onClose,
}: {
  trip: {
    id: number;
    name: string;
    shareToken: string | null;
    shareExpiresAt: Date | null;
  } | null;
  onClose: () => void;
}) {
  const t = useT();
  const utils = trpc.useUtils();
  const open = trip !== null;
  /** Im Dialog gewählte Gültigkeit; null = unbegrenzt. */
  const [expiresIn, setExpiresIn] = useState<ShareExpiryDays | null>(null);
  const shareUrl = trip?.shareToken
    ? `${window.location.origin}/reise/${trip.shareToken}`
    : null;

  // QR-Code zum Hub-Link: am Lagerfeuer einfach abscannen lassen
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(shareUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [shareUrl]);

  const shareMutation = trpc.trips.share.useMutation({
    onSuccess: async ({ token }) => {
      utils.trips.list.invalidate();
      // Link direkt in die Zwischenablage – der Dialog zeigt ihn zusätzlich an
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/reise/${token}`
        );
        toast.success(t.common.linkCopied);
      } catch {
        toast.success(t.trips.hubLinkCreated);
      }
    },
    onError: () => toast.error(t.trips.hubCreateFailed),
  });
  const unshareMutation = trpc.trips.unshare.useMutation({
    onSuccess: () => {
      utils.trips.list.invalidate();
      toast.success(t.trips.hubStopped);
    },
    onError: () => toast.error(t.trips.hubStopFailed),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {t.trips.hubDialogTitle}
            {trip ? ` – ${trip.name}` : ""}
          </DialogTitle>
          <DialogDescription>{t.trips.hubDialogDesc}</DialogDescription>
        </DialogHeader>
        {trip &&
          (shareUrl ? (
            <div>
              <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                {shareUrl}
              </p>
              {/* Bericht-Link (#629): derselbe Token, andere Ansicht –
                  Journal und Fotos als Erinnerungs-Seite für Verwandte */}
              <p className="mt-2 text-xs text-muted-foreground">
                {t.trips.reportLinkHint}
              </p>
              <p className="mt-1 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                {`${window.location.origin}/bericht/${trip.shareToken}`}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/bericht/${trip.shareToken}`
                    );
                    toast.success(t.common.linkCopied);
                  } catch {
                    toast.error(t.common.copyFailed);
                  }
                }}
              >
                <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.trips.reportLinkCopy}
              </Button>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success(t.common.linkCopied);
                    } catch {
                      toast.error(t.common.copyFailed);
                    }
                  }}
                >
                  <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.common.copy}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={unshareMutation.isPending}
                  onClick={() => unshareMutation.mutate({ tripId: trip.id })}
                >
                  {t.trips.hubStopShare}
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                <ShareExpirySelect
                  value={expiresIn}
                  onChange={days => {
                    setExpiresIn(days);
                    shareMutation.mutate({
                      tripId: trip.id,
                      expiresInDays: days,
                    });
                  }}
                />
                <ShareExpiryNote expiresAt={trip.shareExpiresAt} />
              </div>
              {qrDataUrl && (
                <div className="mt-3 text-center">
                  {/* Weisser Rahmen, damit der QR-Code auch im Dark Mode lesbar bleibt */}
                  <img
                    src={qrDataUrl}
                    alt={t.trips.hubQrAlt(trip.name)}
                    className="mx-auto w-40 rounded-lg bg-white p-2"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.trips.hubQrHint}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <ShareExpirySelect value={expiresIn} onChange={setExpiresIn} />
              <Button
                size="sm"
                disabled={shareMutation.isPending}
                onClick={() =>
                  shareMutation.mutate({
                    tripId: trip.id,
                    expiresInDays: expiresIn,
                  })
                }
              >
                <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.trips.hubCreate}
              </Button>
            </div>
          ))}
      </DialogContent>
    </Dialog>
  );
}

/** Vorschlags-Abstand der Kopie: Anreise heute + 30 Tage. */
