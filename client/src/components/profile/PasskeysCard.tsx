/**
 * Profil-Karte «PasskeysCard» – aus Profile.tsx herausgelöst (#414).
 * Die Seite war nach #408 über 1600 Zeilen; die fünf grossen Karten
 * wohnen jetzt hier (Muster wie die Aufteilung von Trips.tsx, #322).
 */
import { useMemo, useState } from "react";
import { fmtMedium } from "@/lib/dateFormat";
import CollapsibleCard from "@/components/CollapsibleCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Trash2, Fingerprint, Plus } from "lucide-react";
import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

/**
 * Abschnitt «Sicherheit: Passkeys»: hinterlegte Passkeys auflisten (Name +
 * Datum), neue per WebAuthn-Zeremonie hinzufügen und einzeln entfernen –
 * die Anmeldung mit Passwort bleibt daneben immer möglich.
 */
export default function PasskeysCard() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const utils = trpc.useUtils();
  const supported = useMemo(() => browserSupportsWebAuthn(), []);
  const listQuery = trpc.auth.passkeyList.useQuery();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const optionsMutation = trpc.auth.passkeyRegisterOptions.useMutation();
  const verifyMutation = trpc.auth.passkeyRegisterVerify.useMutation();
  const removeMutation = trpc.auth.passkeyRemove.useMutation({
    onSuccess: () => {
      toast.success(t.profile.passkeyRemoved);
      void utils.auth.passkeyList.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  const addPasskey = async () => {
    if (adding) return;
    setAdding(true);
    try {
      const options = await optionsMutation.mutateAsync();
      const response = await startRegistration({ optionsJSON: options });
      await verifyMutation.mutateAsync({
        response,
        name: name.trim() || t.profile.passkeyDefaultName,
      });
      toast.success(t.profile.passkeyAdded);
      setName("");
      void utils.auth.passkeyList.invalidate();
    } catch (error) {
      const errorName = (error as { name?: string } | null)?.name;
      if (errorName === "InvalidStateError") {
        // Der Authenticator kennt das Konto schon (excludeCredentials)
        toast.error(t.profile.passkeyExists);
      } else if (
        errorName !== "NotAllowedError" &&
        errorName !== "AbortError"
      ) {
        toast.error(t.profile.passkeyAddFailed);
      }
    } finally {
      setAdding(false);
    }
  };

  const passkeys = listQuery.data ?? [];

  return (
    <CollapsibleCard
      className="mb-5"
      icon={<Fingerprint className="h-4 w-4 text-primary" aria-hidden="true" />}
      title={t.profile.passkeysTitle}
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {t.profile.passkeysIntro}
      </p>
      {passkeys.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {passkeys.map(passkey => (
            <li
              key={passkey.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <p className="min-w-0 text-sm">
                <span className="block truncate font-medium">
                  {passkey.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.profile.passkeyAddedOn(
                    fmtMedium(new Date(passkey.createdAt), lang)
                  )}
                </span>
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={removeMutation.isPending}
                onClick={async () => {
                  if (
                    await ask({
                      title: t.profile.passkeyRemoveConfirm(passkey.name),
                    })
                  ) {
                    removeMutation.mutate({ id: passkey.id });
                  }
                }}
                aria-label={t.profile.passkeyRemoveAria(passkey.name)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          {t.profile.passkeysEmpty}
        </p>
      )}
      {supported ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="passkey-name" className="mb-1.5 block text-xs">
              {t.profile.passkeyNameLabel}
            </Label>
            <Input
              id="passkey-name"
              value={name}
              maxLength={80}
              onChange={e => setName(e.target.value)}
              placeholder={t.profile.passkeyNamePlaceholder}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={adding}
              onClick={() => void addPasskey()}
            >
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {adding ? t.profile.passkeyAdding : t.profile.passkeyAddButton}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t.profile.passkeysUnsupported}
        </p>
      )}
    </CollapsibleCard>
  );
}

/** Profil-Seite: Konto verwalten und App-Einstellungen. */
