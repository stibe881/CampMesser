import { useEffect, useMemo, useRef, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
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

export default function TripMembersDialog({
  trip,
  onClose,
}: {
  trip: { id: number; name: string } | null;
  onClose: () => void;
}) {
  const ask = useConfirm();
  const t = useT();
  const utils = trpc.useUtils();
  const open = trip !== null;
  const membersQuery = trpc.trips.members.list.useQuery(
    { tripId: trip?.id ?? 0 },
    { enabled: open }
  );
  const inviteToken = membersQuery.data?.inviteToken ?? null;
  const inviteUrl = inviteToken
    ? `${window.location.origin}/reise-einladung/${inviteToken}`
    : null;

  // QR-Code zum Einladungs-Link: am Lagerfeuer einfach abscannen lassen
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!inviteUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(inviteUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [inviteUrl]);

  const copyInviteUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.common.linkCopied);
    } catch {
      toast.error(t.common.copyFailed);
    }
  };

  const createMutation = trpc.trips.invite.create.useMutation({
    onSuccess: async ({ token }) => {
      utils.trips.members.list.invalidate();
      // Link direkt in die Zwischenablage – der Dialog zeigt ihn zusätzlich an
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/reise-einladung/${token}`
        );
        toast.success(t.common.linkCopied);
      } catch {
        // Kein Zwischenablage-Zugriff – der Link steht ja im Dialog
      }
    },
    onError: () => toast.error(t.trips.inviteCreateFailed),
  });
  const revokeMutation = trpc.trips.invite.revoke.useMutation({
    onSuccess: () => {
      utils.trips.members.list.invalidate();
      toast.success(t.trips.inviteRevoked);
    },
    onError: () => toast.error(t.trips.inviteRevokeFailed),
  });
  const removeMemberMutation = trpc.trips.members.remove.useMutation({
    onSuccess: () => {
      utils.trips.members.list.invalidate();
      utils.trips.list.invalidate();
      toast.success(t.trips.memberRemoved);
    },
    onError: () => toast.error(t.trips.memberRemoveFailed),
  });

  const memberDisplayName = (m: {
    name: string | null;
    email: string | null;
    userId: number;
  }): string => m.name || m.email || `#${m.userId}`;

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
            {t.trips.membersButton}
            {trip ? ` – ${trip.name}` : ""}
          </DialogTitle>
          <DialogDescription>{t.trips.membersDialogDesc}</DialogDescription>
        </DialogHeader>
        {trip && (
          <>
            {/* Mitglieder-Liste */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                {t.trips.membersListTitle}
              </h3>
              <ul className="space-y-1.5">
                {(membersQuery.data?.members ?? []).map(m => (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {memberDisplayName(m)}
                      </p>
                      {m.name && m.email && (
                        <p className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      )}
                    </div>
                    {m.role === "owner" ? (
                      <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {t.trips.membersOwnerBadge}
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                        aria-label={t.trips.memberRemoveAria(
                          memberDisplayName(m)
                        )}
                        disabled={removeMemberMutation.isPending}
                        onClick={async () => {
                          if (
                            await ask({
                              title: t.trips.memberRemoveConfirm(
                                memberDisplayName(m)
                              ),
                            })
                          ) {
                            removeMemberMutation.mutate({
                              tripId: trip.id,
                              userId: m.userId,
                            });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* Einladungs-Link */}
            <div>
              <h3 className="mb-1 text-sm font-semibold">
                {t.trips.inviteSectionTitle}
              </h3>
              <p className="mb-2 text-xs text-muted-foreground">
                {t.trips.inviteHint}
              </p>
              {inviteUrl ? (
                <>
                  <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                    {inviteUrl}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyInviteUrl(inviteUrl)}
                    >
                      <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {t.common.copy}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={revokeMutation.isPending}
                      onClick={() => revokeMutation.mutate({ tripId: trip.id })}
                    >
                      {t.trips.inviteRevoke}
                    </Button>
                  </div>
                  {qrDataUrl && (
                    <div className="mt-3 text-center">
                      {/* Weisser Rahmen, damit der QR-Code auch im Dark Mode lesbar bleibt */}
                      <img
                        src={qrDataUrl}
                        alt={t.trips.inviteQrAlt(trip.name)}
                        className="mx-auto w-40 rounded-lg bg-white p-2"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.trips.inviteQrHint}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  disabled={createMutation.isPending}
                  onClick={() => createMutation.mutate({ tripId: trip.id })}
                >
                  <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.trips.inviteCreate}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dialog «Reise-Hub teilen» (nur für eigene Reisen): erzeugt den öffentlichen
 * Read-only-Link (Reise-Infos, Platz, Menüplan, Packliste – ohne Fotos),
 * zeigt ihn samt QR-Code und beendet das Teilen (Muster der Teilen-Dialoge).
 */
