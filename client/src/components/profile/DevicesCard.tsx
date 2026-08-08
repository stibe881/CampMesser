/**
 * Angemeldete Geräte (#423): Bis hierher war eine Anmeldung ein
 * Jahres-Cookie, das sich durch nichts widerrufen liess – wer das Handy
 * verlor, konnte nur das Passwort ändern und hoffen. Jetzt ist jede
 * Anmeldung eine Server-Zeile: Sie hier zu beenden macht das Cookie des
 * Geräts sofort wertlos.
 */
import CollapsibleCard from "@/components/CollapsibleCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtNumeric } from "@/lib/dateFormat";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { deviceLabelText } from "@shared/deviceLabel";

export default function DevicesCard() {
  const { lang, t } = useI18n();
  const dv = t.devices;
  const ask = useConfirm();
  const utils = trpc.useUtils();
  const listQuery = trpc.devices.list.useQuery();
  const revokeMutation = trpc.devices.revoke.useMutation({
    onSuccess: () => {
      toast.success(dv.revoked);
      void utils.devices.list.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });
  const revokeOthersMutation = trpc.devices.revokeOthers.useMutation({
    onSuccess: result => {
      toast.success(dv.othersRevoked(result.removed));
      void utils.devices.list.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  const devices = listQuery.data ?? [];
  const others = devices.filter(device => !device.current);

  return (
    <CollapsibleCard
      className="mb-5"
      icon={
        <MonitorSmartphone
          className="h-4 w-4 text-primary"
          aria-hidden="true"
        />
      }
      title={dv.title}
    >
      <p className="mb-3 text-sm text-muted-foreground">{dv.intro}</p>
      {listQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t.common.loading}
        </p>
      ) : devices.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dv.empty}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {devices.map(device => (
              <li
                key={device.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {deviceLabelText(device.userAgent) ?? dv.unknownDevice}
                    {device.current && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {dv.currentBadge}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dv.lastSeen(fmtNumeric(new Date(device.lastSeenAt), lang))}
                    {" · "}
                    {dv.signedInAt(
                      fmtNumeric(new Date(device.createdAt), lang)
                    )}
                  </p>
                </div>
                {!device.current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={revokeMutation.isPending}
                    onClick={async () => {
                      if (
                        !(await ask({
                          title: dv.revokeConfirm,
                          confirmLabel: dv.revokeButton,
                        }))
                      )
                        return;
                      revokeMutation.mutate({ id: device.id });
                    }}
                  >
                    {dv.revokeButton}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {others.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={revokeOthersMutation.isPending}
                onClick={async () => {
                  if (
                    !(await ask({
                      title: dv.revokeOthersConfirm,
                      confirmLabel: dv.revokeOthersButton,
                    }))
                  )
                    return;
                  revokeOthersMutation.mutate();
                }}
              >
                {dv.revokeOthersButton}
              </Button>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{dv.legacyHint}</p>
        </>
      )}
    </CollapsibleCard>
  );
}
