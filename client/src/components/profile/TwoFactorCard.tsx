/**
 * Zwei-Faktor per TOTP (#453): Einrichtung mit QR-Code für die
 * Authenticator-App, Bestätigung mit dem ersten Code, einmalige Anzeige
 * der Wiederherstellungs-Codes und Abschalten mit Code.
 *
 * Schützt die PASSWORT-Anmeldung; Passkeys (#122) sind gerätgebunden
 * und laufen unverändert daneben.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Copy, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import CollapsibleCard from "@/components/CollapsibleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

export default function TwoFactorCard() {
  const { t } = useI18n();
  const tf = t.twoFactor;
  const utils = trpc.useUtils();
  const statusQuery = trpc.auth.twoFactor.status.useQuery();

  // Laufende Einrichtung: Geheimnis + QR-Bild + eingetippter Code
  const [setup, setSetup] = useState<{
    secret: string;
    url: string;
    qrDataUrl: string | null;
  } | null>(null);
  const [code, setCode] = useState("");
  // Die Wiederherstellungs-Codes gibt es genau EINMAL zu sehen
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState("");

  const beginMutation = trpc.auth.twoFactor.beginSetup.useMutation({
    onSuccess: async data => {
      let qrDataUrl: string | null = null;
      try {
        qrDataUrl = await QRCode.toDataURL(data.url, { width: 220, margin: 1 });
      } catch {
        // Ohne QR bleibt das Geheimnis zum Abtippen
      }
      setSetup({ secret: data.secret, url: data.url, qrDataUrl });
      setCode("");
    },
    onError: e => toast.error(e.message || t.common.actionFailed),
  });
  const enableMutation = trpc.auth.twoFactor.enable.useMutation({
    onSuccess: data => {
      setSetup(null);
      setCode("");
      setRecoveryCodes(data.recoveryCodes);
      void utils.auth.twoFactor.status.invalidate();
      toast.success(tf.enabled);
    },
    onError: e => toast.error(e.message || t.common.actionFailed),
  });
  const disableMutation = trpc.auth.twoFactor.disable.useMutation({
    onSuccess: () => {
      setDisableCode("");
      setRecoveryCodes(null);
      void utils.auth.twoFactor.status.invalidate();
      toast.success(tf.disabled);
    },
    onError: e => toast.error(e.message || t.common.actionFailed),
  });

  const enabled = statusQuery.data?.enabled ?? false;

  const copyRecovery = async () => {
    if (!recoveryCodes) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast.success(tf.recoveryCopied);
    } catch {
      toast.error(t.common.actionFailed);
    }
  };

  return (
    <CollapsibleCard
      className="mb-5"
      icon={<ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />}
      title={tf.title}
    >
      <p className="mb-3 text-sm text-muted-foreground">{tf.intro}</p>

      {/* Frisch erzeugte Wiederherstellungs-Codes – einmalige Anzeige */}
      {recoveryCodes && (
        <div className="mb-4 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <p className="text-sm font-semibold">{tf.recoveryTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {tf.recoveryHint}
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-sm">
            {recoveryCodes.map(recovery => (
              <li key={recovery}>{recovery}</li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => void copyRecovery()}
          >
            <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {tf.recoveryCopy}
          </Button>
        </div>
      )}

      {statusQuery.isLoading ? null : enabled ? (
        <div>
          <p className="mb-2 text-sm font-medium text-primary">{tf.statusOn}</p>
          <Label htmlFor="totp-disable">{tf.disableLabel}</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="totp-disable"
              className="max-w-40"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={disableCode}
              onChange={e => setDisableCode(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={
                disableCode.trim().length < 6 || disableMutation.isPending
              }
              onClick={() =>
                disableMutation.mutate({ code: disableCode.trim() })
              }
            >
              {tf.disableButton}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{tf.disableHint}</p>
        </div>
      ) : setup ? (
        <div>
          <p className="mb-2 text-sm">{tf.scanHint}</p>
          {setup.qrDataUrl && (
            <img
              src={setup.qrDataUrl}
              alt={tf.qrAlt}
              className="mb-2 h-52 w-52 rounded-lg border border-border bg-white p-2"
            />
          )}
          <p className="mb-3 break-all font-mono text-xs text-muted-foreground">
            {tf.secretLine} {setup.secret}
          </p>
          <Label htmlFor="totp-code">{tf.codeLabel}</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="totp-code"
              className="max-w-40"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value)}
            />
            <Button
              type="button"
              disabled={code.trim().length < 6 || enableMutation.isPending}
              onClick={() =>
                enableMutation.mutate({
                  secret: setup.secret,
                  code: code.trim(),
                })
              }
            >
              {tf.confirmButton}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSetup(null);
                setCode("");
              }}
            >
              {t.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          disabled={beginMutation.isPending}
          onClick={() => beginMutation.mutate()}
        >
          {tf.enableButton}
        </Button>
      )}
    </CollapsibleCard>
  );
}
