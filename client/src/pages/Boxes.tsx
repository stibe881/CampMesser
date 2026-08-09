/**
 * Transportkisten (#276): «In welcher Box ist der Gaskocher?»
 *
 * Jede Kiste hat eine kurze Kennung (K1, K2 …), die gross auf dem Etikett
 * steht und im QR-Code steckt. Der QR-Code führt auf /kisten/<Kennung> –
 * mit der Handy-Kamera gescannt landet man direkt auf dem Inhalt, ohne in
 * der App zu suchen.
 *
 * Der Inhalt kommt aus dem Inventar: Jeder Gegenstand liegt in genau einer
 * Kiste oder in keiner. Nichts wird doppelt erfasst – eine Kiste ist eine
 * Sicht auf das Inventar, kein zweiter Datenbestand.
 *
 * Die Etiketten druckt der Browser: eine A4-Seite mit vier Etiketten je
 * Kiste (Kennung gross, Name, Standort, QR-Code). Kein PDF-Paket nötig.
 */
import { useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { createPortal } from "react-dom";
import { useParams } from "wouter";
import {
  Boxes as BoxesIcon,
  ImageDown,
  Package,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import LoginPrompt from "@/components/LoginPrompt";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { formatGrams } from "@shared/packWeight";
import {
  allBoxContents,
  boxScanUrl,
  findBoxByCode,
  looseItems,
  MAX_BOX_CODE_LENGTH,
  MAX_BOX_NAME_LENGTH,
  nextBoxCode,
  normalizeBoxCode,
} from "@shared/boxes";
import { cn } from "@/lib/utils";

/** Sonderwert im Zuordnungs-Select: Gegenstand liegt in keiner Kiste. */
const NO_BOX = "__none__";

export default function BoxesPage() {
  const ask = useConfirm();
  const params = useParams<{ code?: string }>();
  const scannedCode = params.code ?? null;
  const { lang, t } = useI18n();
  const tb = t.boxes;
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const boxesQuery = trpc.boxes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const inventoryQuery = trpc.inventory.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const boxes = useMemo(() => boxesQuery.data ?? [], [boxesQuery.data]);
  const items = useMemo(() => inventoryQuery.data ?? [], [inventoryQuery.data]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    location: "",
    notes: "",
  });
  /** Kiste, deren Etikett gerade gedruckt wird (null = keine). */
  const [labelBoxId, setLabelBoxId] = useState<number | null>(null);
  const [labelQr, setLabelQr] = useState<string | null>(null);

  const contents = useMemo(() => allBoxContents(boxes, items), [boxes, items]);
  const loose = useMemo(() => looseItems(items, boxes), [items, boxes]);

  /** Beim Scannen springt die Ansicht auf die passende Kiste. */
  const scannedBox = useMemo(
    () => (scannedCode ? findBoxByCode(boxes, scannedCode) : null),
    [boxes, scannedCode]
  );

  const addMutation = trpc.boxes.add.useMutation({
    onSuccess: () => {
      void utils.boxes.list.invalidate();
      setDialogOpen(false);
      toast.success(tb.saved);
    },
    onError: e => toast.error(e.message),
  });
  const updateMutation = trpc.boxes.update.useMutation({
    onSuccess: () => {
      void utils.boxes.list.invalidate();
      setDialogOpen(false);
      toast.success(tb.saved);
    },
    onError: e => toast.error(e.message),
  });
  const removeMutation = trpc.boxes.remove.useMutation({
    onSuccess: () => {
      void utils.boxes.list.invalidate();
      void utils.inventory.list.invalidate();
      toast.success(tb.removed);
    },
    onError: e => toast.error(e.message),
  });
  const assignMutation = trpc.boxes.assign.useMutation({
    onSuccess: () => void utils.inventory.list.invalidate(),
    onError: e => toast.error(e.message),
  });

  /** QR-Code für das Etikett erzeugen, sobald eine Kiste gewählt ist. */
  useEffect(() => {
    if (labelBoxId === null) {
      setLabelQr(null);
      return;
    }
    const box = boxes.find(b => b.id === labelBoxId);
    if (!box) return;
    const url = boxScanUrl(window.location.origin, box.code);
    QRCode.toDataURL(url, { width: 320, margin: 1 })
      .then(setLabelQr)
      .catch(() => setLabelQr(null));
  }, [labelBoxId, boxes]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      code: nextBoxCode(boxes.map(b => b.code)),
      name: "",
      location: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (box: (typeof boxes)[number]) => {
    setEditingId(box.id);
    setForm({
      code: box.code,
      name: box.name,
      location: box.location ?? "",
      notes: box.notes ?? "",
    });
    setDialogOpen(true);
  };

  /**
   * Drucken. `window.print()` blockiert die Seite, solange der Dialog des
   * Browsers offen ist – deshalb erst im nächsten Frame aufrufen, damit
   * der Druck-Bogen sicher im DOM steht.
   */
  const printLabels = () => {
    requestAnimationFrame(() => window.print());
  };

  /**
   * Etikett als Bild sichern. Auf dem iPhone tut `window.print()` in einer
   * installierten Web-App schlicht nichts – dort ist der Weg über «Bild
   * sichern» und die Fotos-App bzw. das Teilen-Menü der einzige, der
   * wirklich zu einem Ausdruck führt. Gezeichnet wird auf eine Leinwand,
   * damit das Bild dieselben vier Etiketten zeigt wie der Druck.
   */
  const saveLabelImage = () => {
    const box = boxes.find(b => b.id === labelBoxId);
    if (!box || !labelQr) return;
    // A4 hochkant bei 150 dpi – gross genug zum Ausdrucken, klein genug
    // fürs Teilen-Menü.
    const width = 1240;
    const height = 1754;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error(tb.saveImageFailed);
      return;
    }
    const qr = new Image();
    qr.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      const margin = 60;
      const gap = 40;
      const labelHeight = (height - 2 * margin - 3 * gap) / 4;
      for (let i = 0; i < 4; i++) {
        const top = margin + i * (labelHeight + gap);
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 4;
        ctx.strokeRect(margin, top, width - 2 * margin, labelHeight);
        const qrSize = labelHeight - 48;
        ctx.drawImage(
          qr,
          width - margin - qrSize - 24,
          top + 24,
          qrSize,
          qrSize
        );
        ctx.fillStyle = "#111111";
        ctx.font = "bold 96px monospace";
        ctx.textBaseline = "top";
        ctx.fillText(box.code, margin + 32, top + 32);
        ctx.font = "bold 44px sans-serif";
        ctx.fillText(box.name, margin + 32, top + 150);
        ctx.fillStyle = "#555555";
        ctx.font = "32px sans-serif";
        if (box.location) ctx.fillText(box.location, margin + 32, top + 206);
        ctx.font = "24px sans-serif";
        ctx.fillText(
          "meinreisekompass.ch",
          margin + 32,
          top + labelHeight - 48
        );
      }
      canvas.toBlob(blob => {
        if (!blob) {
          toast.error(tb.saveImageFailed);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `etikett-${box.code.toLowerCase()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(tb.saveImageDone);
      }, "image/png");
    };
    qr.onerror = () => toast.error(tb.saveImageFailed);
    qr.src = labelQr;
  };

  if (loading) return null;
  if (!isAuthenticated) {
    return (
      <div className="container max-w-3xl py-6">
        <PageHeader title={tb.title} subtitle={tb.subtitle} />
        <LoginPrompt feature={tb.loginFeature} />
      </div>
    );
  }

  const labelBox = boxes.find(b => b.id === labelBoxId) ?? null;

  return (
    <div className="container max-w-3xl py-6">
      <PageHeader title={tb.title} subtitle={tb.subtitle} />

      {scannedCode && !scannedBox && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm">
            {tb.unknownCode(normalizeBoxCode(scannedCode))}
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {tb.addBox}
        </Button>
      </div>

      {/* Fehler ist NICHT dasselbe wie leer (#319): Ohne diesen Zweig
          behauptete die Seite, es gebe keine Kisten – und lud dazu ein,
          sie neu anzulegen. */}
      {boxesQuery.isError && (
        <QueryError
          onRetry={() => void boxesQuery.refetch()}
          retrying={boxesQuery.isFetching}
        />
      )}

      {!boxesQuery.isError && contents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <BoxesIcon
              className="h-8 w-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">{tb.empty}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {contents.map(({ box, items: boxItems, itemCount, totalGrams }) => (
          <Card
            key={box.id}
            className={cn(
              scannedBox?.id === box.id && "border-primary ring-1 ring-primary"
            )}
          >
            <CardContent className="py-4">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="rounded-md bg-primary px-2 py-0.5 font-mono text-sm font-bold text-primary-foreground">
                  {box.code}
                </span>
                <span className="font-serif text-lg font-semibold">
                  {box.name}
                </span>
                {box.location && (
                  <span className="text-sm text-muted-foreground">
                    {box.location}
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {tb.summary(itemCount, formatGrams(totalGrams, lang))}
                </span>
              </div>

              {box.notes && (
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
                  {box.notes}
                </p>
              )}

              {boxItems.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {boxItems.map(item => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                    >
                      <Package
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            × {item.quantity}
                          </span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0 text-xs"
                        onClick={() =>
                          assignMutation.mutate({
                            itemId: item.id,
                            boxId: null,
                          })
                        }
                      >
                        {tb.removeFromBox}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {tb.boxEmpty}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLabelBoxId(box.id)}
                >
                  <QrCode className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {tb.labelButton}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(box)}
                >
                  <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.common.edit}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    if (await ask({ title: tb.removeConfirm(box.name) })) {
                      removeMutation.mutate({ id: box.id });
                    }
                  }}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t.common.delete}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Was noch in keiner Kiste liegt – von hier aus einräumen */}
      {loose.length > 0 && (
        <Card className="mt-6">
          <CardContent className="py-4">
            <h2 className="font-serif text-lg font-semibold">
              {tb.looseTitle}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tb.looseHint}
            </p>
            <ul className="mt-3 space-y-1.5">
              {loose.map(item => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <Select
                    value={NO_BOX}
                    onValueChange={value =>
                      assignMutation.mutate({
                        itemId: item.id,
                        boxId: value === NO_BOX ? null : Number(value),
                      })
                    }
                  >
                    <SelectTrigger
                      className="h-8 w-40"
                      aria-label={tb.assignAria(item.name)}
                    >
                      <SelectValue placeholder={tb.assignPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_BOX}>
                        {tb.assignPlaceholder}
                      </SelectItem>
                      {boxes.map(box => (
                        <SelectItem key={box.id} value={String(box.id)}>
                          {box.code} · {box.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Kiste anlegen bzw. bearbeiten */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId === null ? tb.addBox : tb.editBox}
            </DialogTitle>
            <DialogDescription>{tb.dialogHint}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              const payload = {
                code: normalizeBoxCode(form.code),
                name: form.name.trim(),
                location: form.location.trim() || null,
                notes: form.notes.trim() || null,
              };
              if (!payload.code || !payload.name) return;
              if (editingId === null) addMutation.mutate(payload);
              else updateMutation.mutate({ id: editingId, ...payload });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
              <div>
                <Label htmlFor="box-code">{tb.codeLabel}</Label>
                <Input
                  id="box-code"
                  className="mt-1.5 font-mono"
                  maxLength={MAX_BOX_CODE_LENGTH}
                  value={form.code}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      code: normalizeBoxCode(e.target.value),
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="box-name">{tb.nameLabel}</Label>
                <Input
                  id="box-name"
                  className="mt-1.5"
                  maxLength={MAX_BOX_NAME_LENGTH}
                  placeholder={tb.namePlaceholder}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="box-location">{tb.locationLabel}</Label>
              <Input
                id="box-location"
                className="mt-1.5"
                maxLength={80}
                placeholder={tb.locationPlaceholder}
                value={form.location}
                onChange={e =>
                  setForm(f => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="box-notes">{tb.notesLabel}</Label>
              <Textarea
                id="box-notes"
                className="mt-1.5"
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {t.common.save}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Etikett: Vorschau am Bildschirm, vier Stück beim Drucken */}
      <Dialog
        open={labelBoxId !== null}
        onOpenChange={open => !open && setLabelBoxId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tb.labelTitle}</DialogTitle>
            <DialogDescription>{tb.labelHint}</DialogDescription>
          </DialogHeader>
          {labelBox && (
            <>
              <div className="flex items-center gap-3 rounded-lg border-2 border-foreground/80 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-3xl font-bold leading-none">
                    {labelBox.code}
                  </p>
                  <p className="mt-1 truncate font-semibold">{labelBox.name}</p>
                  {labelBox.location && (
                    <p className="truncate text-xs text-muted-foreground">
                      {labelBox.location}
                    </p>
                  )}
                  <p className="mt-1 text-[0.6rem] text-muted-foreground">
                    meinreisekompass.ch
                  </p>
                </div>
                {labelQr && (
                  <img
                    src={labelQr}
                    alt={tb.qrAlt(labelBox.code)}
                    className="h-24 w-24 shrink-0"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={printLabels}>
                  <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {tb.printButton}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={saveLabelImage}
                >
                  <ImageDown className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {tb.saveImageButton}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {tb.printFallbackHint}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/*
        Druck-Bogen (#276): bewusst AUSSERHALB des Dialogs, direkt an
        <body>. Im Dialog-Portal liegt über dem Inhalt eine Overlay-Ebene,
        und Radix sperrt beim Öffnen den Body – gedruckt kam so eine leere
        oder schwarze Seite heraus. Der Bogen hängt immer im DOM, ist am
        Bildschirm unsichtbar und wird im Druck als EINZIGES angezeigt
        (siehe `.print-labels` in index.css).
      */}
      {labelBox &&
        createPortal(
          <div className="print-labels" aria-hidden="true">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="print-label">
                <div className="print-label-text">
                  <p className="print-label-code">{labelBox.code}</p>
                  <p className="print-label-name">{labelBox.name}</p>
                  {labelBox.location && (
                    <p className="print-label-place">{labelBox.location}</p>
                  )}
                  <p className="print-label-brand">meinreisekompass.ch</p>
                </div>
                {labelQr && <img src={labelQr} alt="" />}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
