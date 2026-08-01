import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRound, KeyRound, Mail, Trash2, Palette, Sun, Moon, LogOut } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { getThemePreference, saveThemePreference } from "@/lib/themePreference";

/** Profil-Seite: Konto verwalten und App-Einstellungen. */
export default function ProfilePage() {
  const { user, isAuthenticated, loading, logout, refresh } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [deletePw, setDeletePw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [themePref, setThemePref] = useState<"light" | "dark" | null>(() => getThemePreference());

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const nameMutation = trpc.auth.updateName.useMutation({
    onSuccess: () => {
      toast.success("Name aktualisiert");
      void utils.auth.me.invalidate();
      void refresh?.();
    },
    onError: e => toast.error(e.message),
  });
  const emailMutation = trpc.auth.updateEmail.useMutation({
    onSuccess: () => {
      toast.success("E-Mail-Adresse aktualisiert – melde dich künftig damit an");
      setNewEmail("");
      setEmailPw("");
      void utils.auth.me.invalidate();
      void refresh?.();
    },
    onError: e => toast.error(e.message),
  });
  const pwMutation = trpc.auth.updatePassword.useMutation({
    onSuccess: () => {
      toast.success("Passwort aktualisiert");
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
    },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Konto gelöscht. Gute Reise!");
      window.location.href = "/";
    },
    onError: e => toast.error(e.message),
  });

  /** Design-Präferenz speichern und sofort anwenden. */
  const chooseTheme = (pref: "light" | "dark") => {
    saveThemePreference(pref);
    setThemePref(pref);
    if (theme !== pref) toggleTheme?.();
    toast.success(pref === "dark" ? "Dunkles Design als Standard gespeichert" : "Helles Design als Standard gespeichert");
  };

  if (loading) return null;
  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl py-6">
        <PageHeader title="Profil" subtitle="Verwalte dein Konto und deine Einstellungen." />
        <LoginPrompt feature="dein Profil" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader title="Profil" subtitle={`Angemeldet als ${user?.email ?? user?.name ?? ""}`} />

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
            Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Wähle, mit welchem Design die App standardmässig startet.
          </p>
          <div className="flex gap-2" role="group" aria-label="Standard-Design wählen">
            <Button
              type="button"
              variant={themePref === "light" ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseTheme("light")}
            >
              <Sun className="mr-1.5 h-4 w-4" aria-hidden="true" /> Hell
            </Button>
            <Button
              type="button"
              variant={themePref === "dark" ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseTheme("dark")}
            >
              <Moon className="mr-1.5 h-4 w-4" aria-hidden="true" /> Dunkel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
            Name ändern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={e => {
              e.preventDefault();
              if (name.trim()) nameMutation.mutate({ name: name.trim() });
            }}
          >
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              aria-label="Name"
              placeholder="Dein Name"
            />
            <Button type="submit" disabled={nameMutation.isPending || !name.trim()}>
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
            E-Mail-Adresse ändern
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Aktuell: <span className="font-medium text-foreground">{user?.email ?? "–"}</span>. Mit
            der neuen Adresse meldest du dich künftig an.
          </p>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              emailMutation.mutate({ newEmail: newEmail.trim(), currentPassword: emailPw });
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="email-new" className="mb-1.5 block text-xs">
                  Neue E-Mail-Adresse
                </Label>
                <Input
                  id="email-new"
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email-pw" className="mb-1.5 block text-xs">
                  Passwort zur Bestätigung
                </Label>
                <Input
                  id="email-pw"
                  type="password"
                  autoComplete="current-password"
                  value={emailPw}
                  onChange={e => setEmailPw(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={emailMutation.isPending || !newEmail.trim() || !emailPw}
              className="w-full sm:w-auto"
            >
              E-Mail ändern
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
            Passwort aktualisieren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              if (newPw !== newPw2) {
                toast.error("Die neuen Passwörter stimmen nicht überein.");
                return;
              }
              pwMutation.mutate({ currentPassword: currentPw, newPassword: newPw });
            }}
          >
            <div>
              <Label htmlFor="pw-current" className="mb-1.5 block text-xs">
                Aktuelles Passwort
              </Label>
              <Input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="pw-new" className="mb-1.5 block text-xs">
                  Neues Passwort (min. 8 Zeichen)
                </Label>
                <Input
                  id="pw-new"
                  type="password"
                  autoComplete="new-password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pw-new2" className="mb-1.5 block text-xs">
                  Neues Passwort wiederholen
                </Label>
                <Input
                  id="pw-new2"
                  type="password"
                  autoComplete="new-password"
                  value={newPw2}
                  onChange={e => setNewPw2(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={pwMutation.isPending || !currentPw || !newPw || !newPw2}
              className="w-full sm:w-auto"
            >
              Passwort ändern
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Konto löschen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Löscht dein Konto und alle gespeicherten Daten (Packlisten, Inventar, Zeltplätze,
            Verbraucher, Kühlbox) unwiderruflich.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Konto löschen …
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Alle deine Daten werden unwiderruflich gelöscht. Bestätige mit deinem Passwort.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-1">
                <Label htmlFor="pw-delete" className="mb-1.5 block text-xs">
                  Passwort
                </Label>
                <Input
                  id="pw-delete"
                  type="password"
                  autoComplete="current-password"
                  value={deletePw}
                  onChange={e => setDeletePw(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={!deletePw || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ password: deletePw })}
                >
                  Endgültig löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="mt-5">
        <Button type="button" variant="outline" className="w-full" onClick={() => logout()}>
          <LogOut className="mr-1.5 h-4 w-4" aria-hidden="true" /> Abmelden
        </Button>
      </div>

      {/* Versions-Anzeige: welcher Build läuft gerade? */}
      <p className="mt-6 text-center text-xs text-muted-foreground/70">
        CampMesser Version {__APP_VERSION__}
        {__APP_VERSION__ !== "dev" &&
          ` · Build vom ${new Date(__APP_BUILT_AT__).toLocaleDateString("de-CH", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`}
      </p>
    </div>
  );
}
