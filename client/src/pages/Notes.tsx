import { useMemo, useRef, useState } from "react";
import { fmtDate, fmtLong } from "@/lib/dateFormat";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  Check,
  ImagePlus,
  Loader2,
  NotebookPen,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import QueryError from "@/components/QueryError";
import LoginPrompt from "@/components/LoginPrompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { resizeImageForUpload } from "@/lib/imageResize";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";
import { cn } from "@/lib/utils";
import {
  NOTE_MAX_TAGS,
  NOTE_TEXT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  collectNoteTags,
  noteHasTag,
  noteMatchesQuery,
  normalizeNoteTags,
  parseNoteLines,
  parseNoteTags,
  toggleNoteCheckbox,
} from "@shared/notes";

/** Foto-URL einer Notiz (#433) – ausgeliefert nur an den eigenen Account. */
function notePhotoUrl(fileName: string): string {
  return `/api/notes/photos/${fileName}`;
}

/** Formularzustand des Dialogs; id = null heisst «neue Notiz». */
interface NoteDraft {
  id: number | null;
  title: string;
  text: string;
  /** Stichwörter als kommagetrennte Eingabe – gesäubert wird beim Speichern */
  tags: string;
  /** Bereits gespeichertes Foto der Notiz (#433); null = ohne */
  fileName: string | null;
}

const EMPTY_DRAFT: NoteDraft = {
  id: null,
  title: "",
  text: "",
  tags: "",
  fileName: null,
};

/**
 * Freie Notizen (#246): das Auffangbecken für alles, was in kein anderes
 * Modul passt. Titel optional, Text und frei vergebene Stichwörter.
 * Gesucht wird über Titel, Text und Stichwörter; die Chips filtern
 * zusätzlich (alle gewählten Stichwörter müssen zutreffen). Säubern,
 * Sortieren und Suchen stecken in shared/notes.ts.
 */
export default function NotesPage() {
  const ask = useConfirm();
  const { lang, t } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const notesQuery = trpc.notes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Foto-Zustand (#433): Auswahl wird erst nach dem Speichern hochgeladen –
  // dasselbe Muster wie bei Beobachtungen und Fängen.
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const tagChips = useMemo(() => collectNoteTags(notes), [notes]);
  const visible = useMemo(
    () =>
      notes.filter(
        note =>
          noteMatchesQuery(note, query) &&
          activeTags.every(tag => noteHasTag(note, tag))
      ),
    [notes, query, activeTags]
  );

  const closeDialog = () => {
    setDialogOpen(false);
    setDraft(EMPTY_DRAFT);
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setRemovePhoto(false);
  };

  const addMutation = trpc.notes.add.useMutation();
  const updateMutation = trpc.notes.update.useMutation();
  const removePhotoMutation = trpc.notes.removePhoto.useMutation();
  // Anpinnen (#455)
  const pinMutation = trpc.notes.setPinned.useMutation({
    onSuccess: () => utils.notes.list.invalidate(),
    onError: () => toast.error(t.common.actionFailed),
  });
  const removeMutation = trpc.notes.remove.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate();
      toast.success(t.notes.deleted);
    },
    onError: e => toast.error(e.message || t.notes.deleteFailed),
  });

  /** Häkchen-Zeile (#544) direkt in der Karte umschalten. */
  const toggleLine = (
    note: { id: number; text: string },
    lineIndex: number
  ) => {
    const next = toggleNoteCheckbox(note.text, lineIndex);
    if (next === note.text) return;
    updateMutation.mutate(
      { id: note.id, text: next },
      {
        onSuccess: () => void utils.notes.list.invalidate(),
        onError: () => toast.error(t.notes.saveFailed),
      }
    );
  };

  const startNew = () => {
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  };

  const startEdit = (note: (typeof notes)[number]) => {
    setDraft({
      id: note.id,
      title: note.title ?? "",
      text: note.text,
      tags: parseNoteTags(note.tags).join(", "),
      fileName: note.fileName ?? null,
    });
    setDialogOpen(true);
  };

  // Foto-Vorschau (#433): frisch gewählt schlägt gespeichert
  const previewUrl =
    photoPreviewUrl ??
    (draft.fileName && !removePhoto ? notePhotoUrl(draft.fileName) : null);

  const handlePhotoSelected = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file) return;
    try {
      const blob = await resizeImageForUpload(file);
      setPhotoBlob(blob);
      setPhotoPreviewUrl(URL.createObjectURL(blob));
      setRemovePhoto(false);
    } catch {
      // Dekodieren fehlgeschlagen – bei HEIC/HEIF gezielt darauf hinweisen
      const isHeic =
        /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
      toast.error(isHeic ? t.notes.photoHeic : t.notes.photoReadFailed);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    if (draft.fileName) setRemovePhoto(true);
  };

  const submit = async () => {
    if (!draft.text.trim()) {
      toast.error(t.notes.textRequired);
      return;
    }
    const tags = normalizeNoteTags(draft.tags);
    try {
      let id: number;
      if (draft.id === null) {
        ({ id } = await addMutation.mutateAsync({
          title: draft.title,
          text: draft.text,
          tags,
        }));
      } else {
        await updateMutation.mutateAsync({
          id: draft.id,
          title: draft.title,
          text: draft.text,
          tags,
        });
        id = draft.id;
      }
      // Foto-Schritt nach dem Speichern (#433): Upload ersetzt ein
      // bestehendes Foto serverseitig, Entfernen läuft über tRPC.
      if (photoBlob) {
        setPhotoUploading(true);
        try {
          const response = await fetch(`/api/notes/${id}/photo`, {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: photoBlob,
            credentials: "include",
          });
          if (!response.ok) {
            toast.error(
              response.status === 413
                ? t.notes.photoTooLarge
                : t.notes.photoUploadFailed
            );
          }
        } catch {
          toast.error(t.notes.photoUploadFailed);
        } finally {
          setPhotoUploading(false);
        }
      } else if (removePhoto && draft.fileName) {
        try {
          await removePhotoMutation.mutateAsync({ id });
        } catch {
          toast.error(t.notes.photoRemoveFailed);
        }
      }
      void utils.notes.list.invalidate();
      toast.success(draft.id === null ? t.notes.saved : t.notes.updated);
      closeDialog();
    } catch (error) {
      toast.error(
        (error instanceof Error && error.message) || t.notes.saveFailed
      );
    }
  };

  const fmtDate = (value: Date | string) => fmtLong(new Date(value), lang);

  const saving =
    addMutation.isPending || updateMutation.isPending || photoUploading;

  return (
    <div className="container max-w-3xl py-6 md:py-8">
      <PageHeader title={t.notes.title} subtitle={t.notes.subtitle} />

      {!authLoading && !isAuthenticated ? (
        <LoginPrompt feature={t.notes.loginFeature} />
      ) : (
        <>
          <Button onClick={startNew} className="mb-5">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t.notes.addButton}
          </Button>

          {notes.length > 0 && (
            <div className="relative mb-4">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t.notes.searchPlaceholder}
                aria-label={t.notes.searchAria}
                className="pl-10"
              />
            </div>
          )}

          {tagChips.length > 0 && (
            <div
              className="mb-4 flex flex-wrap gap-2"
              role="group"
              aria-label={t.notes.tagFilterAria}
            >
              {tagChips.map(({ tag, count }) => {
                const active = activeTags.some(
                  a => a.toLowerCase() === tag.toLowerCase()
                );
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setActiveTags(prev =>
                        active
                          ? prev.filter(
                              a => a.toLowerCase() !== tag.toLowerCase()
                            )
                          : [...prev, tag]
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tag}
                    <span className="ml-1.5 opacity-70">{count}</span>
                  </button>
                );
              })}
              {activeTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTags([])}
                  className="rounded-full px-3 py-1 text-xs font-medium text-primary hover:underline"
                >
                  {t.notes.tagFilterClear}
                </button>
              )}
            </div>
          )}

          {notesQuery.isError ? (
            <QueryError
              onRetry={() => void notesQuery.refetch()}
              retrying={notesQuery.isFetching}
            />
          ) : notesQuery.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.common.loading}
            </p>
          ) : notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <NotebookPen
                className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
                aria-hidden="true"
              />
              <p className="font-medium">{t.notes.emptyTitle}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {t.notes.emptyBody}
              </p>
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.notes.noMatches}</p>
          ) : (
            <ul className="space-y-3">
              {visible.map(note => (
                <li key={note.id}>
                  <Card>
                    <CardContent className="flex items-start gap-2 p-4">
                      <div className="min-w-0 flex-1">
                        {note.fileName && (
                          <img
                            src={notePhotoUrl(note.fileName)}
                            alt={t.notes.photoAlt(
                              note.title || t.notes.untitled
                            )}
                            loading="lazy"
                            className="mb-2 max-h-44 w-full rounded-lg border border-border/60 object-cover"
                          />
                        )}
                        <h2 className="font-semibold">
                          {note.title || t.notes.untitled}
                        </h2>
                        {/* Abhakbare Zeilen (#544): «- [ ] …» wird zum
                            antippbaren Kästchen, alles andere bleibt Text */}
                        <div className="mt-1 break-words text-sm text-muted-foreground">
                          {parseNoteLines(note.text).map((line, idx) =>
                            line.kind === "checkbox" ? (
                              <button
                                key={idx}
                                type="button"
                                className="flex w-full items-start gap-2 py-0.5 text-left"
                                disabled={updateMutation.isPending}
                                onClick={() => toggleLine(note, idx)}
                                aria-pressed={line.checked}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                    line.checked
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border bg-background"
                                  )}
                                >
                                  {line.checked && (
                                    <Check className="h-3 w-3" />
                                  )}
                                </span>
                                <span
                                  className={cn(
                                    line.checked && "line-through opacity-60"
                                  )}
                                >
                                  {line.text}
                                </span>
                              </button>
                            ) : (
                              <p
                                key={idx}
                                className="min-h-[1.25rem] whitespace-pre-wrap"
                              >
                                {line.text}
                              </p>
                            )
                          )}
                        </div>
                        {parseNoteTags(note.tags).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {parseNoteTags(note.tags).map(tag => (
                              <span
                                key={tag}
                                className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t.notes.updatedAt(fmtDate(note.updatedAt))}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        {/* Anpinnen (#455): Wichtiges bleibt oben */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            note.pinned
                              ? "text-primary"
                              : "text-muted-foreground/60 hover:text-foreground"
                          )}
                          disabled={pinMutation.isPending}
                          onClick={() =>
                            pinMutation.mutate({
                              id: note.id,
                              pinned: !note.pinned,
                            })
                          }
                          aria-pressed={note.pinned}
                          aria-label={
                            note.pinned
                              ? t.notes.unpinAria(
                                  note.title || t.notes.untitled
                                )
                              : t.notes.pinAria(note.title || t.notes.untitled)
                          }
                        >
                          {note.pinned ? (
                            <PinOff
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          ) : (
                            <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-foreground"
                          onClick={() => startEdit(note)}
                          aria-label={t.notes.editAria(
                            note.title || t.notes.untitled
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-destructive"
                          disabled={removeMutation.isPending}
                          onClick={async () => {
                            if (!(await ask({ title: t.notes.deleteConfirm })))
                              return;
                            removeMutation.mutate({ id: note.id });
                          }}
                          aria-label={t.notes.deleteAria(
                            note.title || t.notes.untitled
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={open => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {draft.id === null ? t.notes.newTitle : t.notes.editTitle}
            </DialogTitle>
            <DialogDescription>{t.notes.dialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="note-title">{t.notes.titleLabel}</Label>
              <Input
                id="note-title"
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder={t.notes.titlePlaceholder}
                maxLength={NOTE_TITLE_MAX_LENGTH}
              />
            </div>
            <div>
              <Label htmlFor="note-text">{t.notes.textLabel}</Label>
              <Textarea
                id="note-text"
                value={draft.text}
                rows={6}
                maxLength={NOTE_TEXT_MAX_LENGTH}
                onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
                placeholder={t.notes.textPlaceholder}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t.notes.checkboxHint}
              </p>
            </div>
            <div>
              <Label htmlFor="note-tags">{t.notes.tagsLabel}</Label>
              <Input
                id="note-tags"
                value={draft.tags}
                onChange={e => setDraft(d => ({ ...d, tags: e.target.value }))}
                placeholder={t.notes.tagsPlaceholder}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t.notes.tagsHint(NOTE_MAX_TAGS)}
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">{t.notes.photoLabel}</p>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={t.notes.photoPreviewAlt}
                  className="mb-2 aspect-[4/3] w-full rounded-lg border border-border/60 object-cover"
                />
              )}
              <div className="flex gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => void handlePhotoSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {previewUrl ? t.notes.photoChange : t.notes.photoChoose}
                </Button>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleRemovePhoto}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t.notes.photoRemove}
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t.notes.photoHint}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t.common.cancel}
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {photoUploading ? t.notes.photoUploading : t.notes.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
