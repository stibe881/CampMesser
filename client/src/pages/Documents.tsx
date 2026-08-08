/**
 * Karten & Ausweise (#454): ACSI-Card, TCS-Mitgliedschaft, Camping Key –
 * als Foto in der App statt als Plastikkarte, die zuhause liegt. Karte
 * anlegen, Foto hochladen (Client-Resize wie bei der Reservation #279,
 * Upload über die Ein-Foto-Fabrik #457), an der Rezeption vorzeigen.
 */
import { useRef, useState } from "react";
import { IdCard, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import LoginPrompt from "@/components/LoginPrompt";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { resizeImageForUpload } from "@/lib/imageResize";
import { useTodayIso } from "@/lib/useTodayIso";
import { fmtMedium } from "@/lib/dateFormat";
import { documentExpiryStatus } from "@shared/documentExpiry";
import { cn } from "@/lib/utils";

export default function DocumentsPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const td = t.documents;
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.documents.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const cards = query.data ?? [];

  const today = useTodayIso();
  const [title, setTitle] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [viewer, setViewer] = useState<{
    title: string;
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<number | null>(null);

  const addMutation = trpc.documents.add.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      setTitle("");
      setExpiresOn("");
      toast.success(td.added);
    },
    onError: e => toast.error(e.message || t.common.saveFailed),
  });
  // Ablaufdatum nachträglich setzen oder entfernen (#476)
  const expiryMutation = trpc.documents.rename.useMutation({
    onSuccess: () => utils.documents.list.invalidate(),
    onError: () => toast.error(t.common.saveFailed),
  });
  const removeMutation = trpc.documents.remove.useMutation({
    onSuccess: () => utils.documents.list.invalidate(),
    onError: () => toast.error(t.common.deleteFailed),
  });

  const pickPhoto = (cardId: number) => {
    uploadTargetRef.current = cardId;
    fileInputRef.current?.click();
  };

  const uploadPhoto = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    const cardId = uploadTargetRef.current;
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file || cardId === null) return;
    setUploadingId(cardId);
    try {
      const blob = await resizeImageForUpload(file);
      const response = await fetch(`/api/documents/${cardId}/photo`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
        credentials: "include",
      });
      if (!response.ok) {
        toast.error(
          response.status === 413 ? td.photoTooLarge : td.photoFailed
        );
        return;
      }
      await utils.documents.list.invalidate();
      toast.success(td.photoSaved);
    } catch {
      toast.error(td.photoFailed);
    } finally {
      setUploadingId(null);
      uploadTargetRef.current = null;
    }
  };

  if (loading) return null;

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader title={td.title} subtitle={td.subtitle} />

      {!isAuthenticated ? (
        <LoginPrompt feature={td.loginFeature} />
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => void uploadPhoto(e.target.files)}
          />

          {/* Karte anlegen */}
          <Card className="mb-5">
            <CardContent className="pt-5">
              <Label htmlFor="document-title">{td.addLabel}</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="document-title"
                  value={title}
                  maxLength={80}
                  placeholder={td.addPlaceholder}
                  onChange={e => setTitle(e.target.value)}
                />
                <Button
                  disabled={!title.trim() || addMutation.isPending}
                  onClick={() =>
                    addMutation.mutate({
                      title: title.trim(),
                      expiresOn: expiresOn || null,
                    })
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {td.addButton}
                </Button>
              </div>
              {/* Ablaufdatum (#476): optional – Mitgliederkarten ohne
                  Datum bleiben einfach ohne */}
              <div className="mt-3">
                <Label htmlFor="document-expiry">{td.expiryLabel}</Label>
                <Input
                  id="document-expiry"
                  type="date"
                  className="mt-1 w-44"
                  value={expiresOn}
                  onChange={e => setExpiresOn(e.target.value)}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{td.hint}</p>
            </CardContent>
          </Card>

          {query.isError ? (
            <QueryError
              onRetry={() => void query.refetch()}
              retrying={query.isFetching}
            />
          ) : query.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : cards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <IdCard
                className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">{td.empty}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cards.map(card => (
                <li
                  key={card.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  {card.fileName ? (
                    <button
                      type="button"
                      className="shrink-0 overflow-hidden rounded-lg border border-border"
                      onClick={() =>
                        setViewer({
                          title: card.title,
                          fileName: card.fileName!,
                        })
                      }
                      aria-label={td.viewAria(card.title)}
                    >
                      <img
                        src={`/api/documents/photos/${card.fileName}`}
                        alt={card.title}
                        className="h-16 w-24 object-cover"
                        loading="lazy"
                      />
                    </button>
                  ) : (
                    <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground/50">
                      <IdCard className="h-6 w-6" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{card.title}</p>
                    {/* Ablauf-Hinweis (#476): amber ab 30 Tagen, rot danach */}
                    {(() => {
                      const status = documentExpiryStatus(
                        card.expiresOn,
                        today
                      );
                      if (!status) return null;
                      const date = fmtMedium(
                        new Date(`${card.expiresOn}T00:00:00`),
                        lang
                      );
                      return (
                        <p
                          className={cn(
                            "mt-0.5 text-xs",
                            status === "expired"
                              ? "font-medium text-destructive"
                              : status === "soon"
                                ? "font-medium text-amber-700 dark:text-amber-400"
                                : "text-muted-foreground"
                          )}
                        >
                          {status === "expired"
                            ? td.expiredOn(date)
                            : status === "soon"
                              ? td.expiresSoon(date)
                              : td.validUntil(date)}
                        </p>
                      );
                    })()}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        className="h-8 w-40 text-xs"
                        value={card.expiresOn ?? ""}
                        aria-label={td.expiryAria(card.title)}
                        disabled={expiryMutation.isPending}
                        onChange={e =>
                          expiryMutation.mutate({
                            id: card.id,
                            title: card.title,
                            expiresOn: e.target.value || null,
                          })
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1.5"
                      disabled={uploadingId === card.id}
                      onClick={() => pickPhoto(card.id)}
                    >
                      <ImagePlus
                        className="mr-1.5 h-4 w-4"
                        aria-hidden="true"
                      />
                      {uploadingId === card.id
                        ? td.photoUploading
                        : card.fileName
                          ? td.photoReplace
                          : td.photoAdd}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-destructive"
                    disabled={removeMutation.isPending}
                    onClick={async () => {
                      if (!(await ask({ title: td.deleteConfirm }))) return;
                      removeMutation.mutate({ id: card.id });
                    }}
                    aria-label={td.deleteAria(card.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Vollbild-Ansicht zum Vorzeigen an der Rezeption */}
          <Dialog
            open={viewer !== null}
            onOpenChange={open => {
              if (!open) setViewer(null);
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {viewer?.title}
                </DialogTitle>
                <DialogDescription>{td.viewerHint}</DialogDescription>
              </DialogHeader>
              {viewer && (
                <img
                  src={`/api/documents/photos/${viewer.fileName}`}
                  alt={viewer.title}
                  className="max-h-[70vh] w-full rounded-lg object-contain"
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
