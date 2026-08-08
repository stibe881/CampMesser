/**
 * Dossier teilen (#45, QR #61, Ablauf #189): Teil-Link erzeugen, kopieren
 * und wieder zurückziehen, dazu der QR-Code zum Abscannen am Platz. Aus
 * SpotDetail.tsx herausgelöst (#458) – der Block braucht von der Seite
 * nur Id und Name des Platzes; Link, Ablauf und QR sind eigener Zustand.
 */
import { useEffect, useState } from "react";
import { QrCode, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { ShareExpiryNote, ShareExpirySelect } from "@/components/ShareExpiry";
import type { ShareExpiryDays } from "@shared/sharing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

export default function SpotShareCard({
  spotId,
  spotName,
  className,
}: {
  spotId: number;
  spotName: string;
  className?: string;
}) {
  const { t } = useI18n();
  const shareMutation = trpc.spots.share.useMutation();
  const unshareMutation = trpc.spots.unshare.useMutation();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<ShareExpiryDays | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // QR-Code zum Teil-Link erzeugen: am Platz einfach abscannen lassen statt Link verschicken
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

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.spotDetail.shareTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          {t.spotDetail.shareDesc}
        </p>
        {shareUrl ? (
          <div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <code className="min-w-0 flex-1 truncate text-xs">
                {shareUrl}
              </code>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success(t.common.linkCopied);
                  } catch {
                    toast.error(t.common.copyFailed);
                  }
                }}
              >
                {t.common.copy}
              </button>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive"
                onClick={() =>
                  unshareMutation.mutate(
                    { id: spotId },
                    {
                      onSuccess: () => {
                        setShareUrl(null);
                        toast.success(t.spotDetail.stopShared);
                      },
                    }
                  )
                }
              >
                {t.spotDetail.stopShare}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <ShareExpirySelect
                value={expiresIn}
                onChange={days => {
                  setExpiresIn(days);
                  shareMutation.mutate(
                    { id: spotId, expiresInDays: days },
                    {
                      onSuccess: ({ expiresAt: at }) => setExpiresAt(at),
                      onError: () => toast.error(t.spotDetail.shareFailed),
                    }
                  );
                }}
              />
              <ShareExpiryNote expiresAt={expiresAt} />
            </div>
            {qrDataUrl && (
              <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                {/* Weisser Rahmen, damit der Code auch im Dark Mode zuverlässig scannbar bleibt */}
                <div className="shrink-0 rounded-md bg-white p-2 shadow-sm">
                  <img
                    src={qrDataUrl}
                    alt={t.spotDetail.qrAlt(spotName)}
                    className="h-36 w-36"
                  />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <QrCode
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                    {t.spotDetail.qrTitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.spotDetail.qrText}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <ShareExpirySelect value={expiresIn} onChange={setExpiresIn} />
            <Button
              variant="outline"
              size="sm"
              disabled={shareMutation.isPending}
              onClick={() =>
                shareMutation.mutate(
                  { id: spotId, expiresInDays: expiresIn },
                  {
                    onSuccess: async ({ token, expiresAt: at }) => {
                      const url = `${window.location.origin}/platz/${token}`;
                      setShareUrl(url);
                      setExpiresAt(at);
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success(t.spotDetail.shareLinkCopied);
                      } catch {
                        toast.success(t.spotDetail.shareLinkCreated);
                      }
                    },
                    onError: () => toast.error(t.spotDetail.shareFailed),
                  }
                )
              }
            >
              <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {t.spotDetail.shareButton}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
