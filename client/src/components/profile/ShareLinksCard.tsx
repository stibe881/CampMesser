/**
 * Teil-Link-Übersicht (#422): alle aktiven Teil-Links des Kontos an einem
 * Ort. Neun Arten von Links entstehen verstreut in der App (Platz-Dossier,
 * Packliste, Vorlage, Reise-Hub, Rezept, Quiz, Einkaufsliste, Wanderung,
 * Standort) – wer wissen will, was alles offen ist, musste bisher alle
 * neun Orte abklappern. Beendet wird hier mit derselben Wirkung wie am
 * jeweiligen Ort; erzeugt wird weiterhin dort.
 */
import CollapsibleCard from "@/components/CollapsibleCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { Copy, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtNumeric } from "@/lib/dateFormat";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";
import { shareLinkPath, type ShareLinkKind } from "@shared/shareLinks";

export default function ShareLinksCard() {
  const { lang, t } = useI18n();
  const sl = t.shareLinks;
  const ask = useConfirm();
  const utils = trpc.useUtils();
  const listQuery = trpc.shares.list.useQuery();
  const revokeMutation = trpc.shares.revoke.useMutation({
    onSuccess: () => {
      toast.success(sl.revoked);
      void utils.shares.list.invalidate();
    },
    onError: () => toast.error(t.common.actionFailed),
  });

  const kindLabel = (kind: ShareLinkKind) => sl.kinds[kind];
  const links = listQuery.data ?? [];

  const copy = async (kind: ShareLinkKind, token: string) => {
    const url = `${window.location.origin}${shareLinkPath(kind, token)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.common.linkCopied);
    } catch {
      toast.error(t.common.copyFailed);
    }
  };

  return (
    <CollapsibleCard
      className="mb-5"
      icon={<Link2 className="h-4 w-4 text-primary" aria-hidden="true" />}
      title={sl.title}
    >
      <p className="mb-3 text-sm text-muted-foreground">{sl.intro}</p>
      {listQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {t.common.loading}
        </p>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted-foreground">{sl.empty}</p>
      ) : (
        <ul className="space-y-2">
          {links.map(link => (
            <li
              key={`${link.kind}-${link.id}`}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                {kindLabel(link.kind)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {link.label || sl.unnamed}
              </span>
              {link.expiresAt && (
                <span className="text-xs text-muted-foreground">
                  {sl.expires(fmtNumeric(new Date(link.expiresAt), lang))}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => void copy(link.kind, link.token)}
                aria-label={sl.copyAria(link.label || kindLabel(link.kind))}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={revokeMutation.isPending}
                onClick={async () => {
                  if (
                    !(await ask({
                      title: sl.revokeConfirm(
                        link.label || kindLabel(link.kind)
                      ),
                      confirmLabel: sl.revokeButton,
                    }))
                  )
                    return;
                  revokeMutation.mutate({ kind: link.kind, id: link.id });
                }}
              >
                {sl.revokeButton}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleCard>
  );
}
