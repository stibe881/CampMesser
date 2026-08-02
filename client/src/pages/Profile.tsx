import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UserRound,
  KeyRound,
  Mail,
  Trash2,
  Palette,
  Sun,
  Moon,
  MonitorSmartphone,
  LogOut,
  BellRing,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushSubscription } from "@/lib/usePushSubscription";
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
import {
  getThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "@/lib/themePreference";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";

type PushFlag = "wantsWeather" | "wantsFood" | "wantsTrips";

/**
 * Abschnitt «Mitteilungen»: Push-Abo dieses Geräts (an/aus) plus
 * Feineinstellungen, welche Mitteilungs-Arten das Gerät erhalten soll.
 */
function NotificationsCard() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const push = usePushSubscription();
  const prefsQuery = trpc.push.getPrefs.useQuery(
    { endpoint: push.endpoint ?? "" },
    { enabled: Boolean(push.enabled && push.endpoint) }
  );
  const setPrefsMutation = trpc.push.setPrefs.useMutation({
    onSuccess: () => utils.push.getPrefs.invalidate(),
    onError: () => {
      toast.error(t.common.saveFailed);
      void utils.push.getPrefs.invalidate();
    },
  });
  const prefs = prefsQuery.data?.prefs ?? null;

  const setFlag = (flag: PushFlag, value: boolean) => {
    if (!push.endpoint) return;
    const patch =
      flag === "wantsWeather"
        ? { wantsWeather: value }
        : flag === "wantsFood"
          ? { wantsFood: value }
          : { wantsTrips: value };
    setPrefsMutation.mutate({ endpoint: push.endpoint, ...patch });
  };

  const rows: { flag: PushFlag; label: string; desc: string }[] = [
    {
      flag: "wantsWeather",
      label: t.profile.prefWeather,
      desc: t.profile.prefWeatherDesc,
    },
    {
      flag: "wantsFood",
      label: t.profile.prefFood,
      desc: t.profile.prefFoodDesc,
    },
    {
      flag: "wantsTrips",
      label: t.profile.prefTrips,
      desc: t.profile.prefTripsDesc,
    },
  ];

  return (
    <Card className="mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
          {t.profile.notificationsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!push.supported ? (
          <p className="text-sm text-muted-foreground">
            {t.profile.pushUnsupported}
          </p>
        ) : push.configLoaded && !push.configured ? (
          <p className="text-sm text-muted-foreground">
            {t.profile.pushNotConfigured}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {t.profile.pushDeviceTitle}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.profile.pushDeviceDesc}
                </p>
              </div>
              <Switch
                checked={push.enabled ?? false}
                disabled={
                  push.busy || push.enabled === null || !push.configured
                }
                onCheckedChange={next =>
                  push.toggle(next, {
                    enabled: t.profile.pushOn,
                    disabled: t.profile.pushOff,
                  })
                }
                aria-label={t.profile.pushDeviceAria}
              />
            </div>
            {push.enabled && prefs && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {t.profile.prefsIntro}
                </p>
                {rows.map(row => (
                  <div
                    key={row.flag}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.desc}
                      </p>
                    </div>
                    <Switch
                      checked={prefs[row.flag]}
                      disabled={setPrefsMutation.isPending}
                      onCheckedChange={value => setFlag(row.flag, value)}
                      aria-label={t.profile.prefToggleAria(row.label)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Profil-Seite: Konto verwalten und App-Einstellungen. */
export default function ProfilePage() {
  const { lang, t } = useI18n();
  const { user, isAuthenticated, loading, logout, refresh } = useAuth();
  const { setPreference } = useTheme();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [deletePw, setDeletePw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [themePref, setThemePref] = useState<ThemePreference | null>(() =>
    getThemePreference()
  );

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const nameMutation = trpc.auth.updateName.useMutation({
    onSuccess: () => {
      toast.success(t.profile.nameUpdated);
      void utils.auth.me.invalidate();
      void refresh?.();
    },
    onError: e => toast.error(e.message),
  });
  const emailMutation = trpc.auth.updateEmail.useMutation({
    onSuccess: () => {
      toast.success(t.profile.emailUpdated);
      setNewEmail("");
      setEmailPw("");
      void utils.auth.me.invalidate();
      void refresh?.();
    },
    onError: e => toast.error(e.message),
  });
  const pwMutation = trpc.auth.updatePassword.useMutation({
    onSuccess: () => {
      toast.success(t.profile.passwordUpdated);
      setCurrentPw("");
      setNewPw("");
      setNewPw2("");
    },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.auth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success(t.profile.accountDeleted);
      window.location.href = "/";
    },
    onError: e => toast.error(e.message),
  });

  /** Design-Präferenz speichern und sofort anwenden. */
  const chooseTheme = (pref: ThemePreference) => {
    saveThemePreference(pref);
    setThemePref(pref);
    setPreference?.(pref);
    toast.success(
      pref === "dark"
        ? t.profile.themeSavedDark
        : pref === "auto"
          ? t.profile.themeSavedAuto
          : t.profile.themeSavedLight
    );
  };

  if (loading) return null;
  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl py-6">
        <PageHeader
          title={t.profile.title}
          subtitle={t.profile.manageSubtitle}
        />
        <LoginPrompt feature={t.profile.loginFeature} />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <PageHeader
        title={t.profile.title}
        subtitle={t.profile.loggedInAs(user?.email ?? user?.name ?? "")}
      />

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.profile.themeTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.profile.themeIntro}
          </p>
          <div
            className="flex gap-2"
            role="group"
            aria-label={t.profile.themeGroupAria}
          >
            <Button
              type="button"
              variant={themePref === "light" ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseTheme("light")}
            >
              <Sun className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
              {t.profile.themeLight}
            </Button>
            <Button
              type="button"
              variant={themePref === "dark" ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseTheme("dark")}
            >
              <Moon className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
              {t.profile.themeDark}
            </Button>
            <Button
              type="button"
              variant={themePref === "auto" ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseTheme("auto")}
            >
              <MonitorSmartphone
                className="mr-1.5 h-4 w-4"
                aria-hidden="true"
              />{" "}
              {t.profile.themeAuto}
            </Button>
          </div>
        </CardContent>
      </Card>

      <NotificationsCard />

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.profile.nameTitle}
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
              aria-label={t.profile.nameAria}
              placeholder={t.profile.namePlaceholder}
            />
            <Button
              type="submit"
              disabled={nameMutation.isPending || !name.trim()}
            >
              {t.common.save}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.profile.emailTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.profile.emailCurrentPrefix}{" "}
            <span className="font-medium text-foreground">
              {user?.email ?? "–"}
            </span>
            {t.profile.emailCurrentSuffix}
          </p>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              emailMutation.mutate({
                newEmail: newEmail.trim(),
                currentPassword: emailPw,
              });
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="email-new" className="mb-1.5 block text-xs">
                  {t.profile.newEmailLabel}
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
                  {t.profile.confirmWithPasswordLabel}
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
              {t.profile.changeEmail}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
            {t.profile.passwordTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={e => {
              e.preventDefault();
              if (newPw !== newPw2) {
                toast.error(t.profile.newPasswordsMismatch);
                return;
              }
              pwMutation.mutate({
                currentPassword: currentPw,
                newPassword: newPw,
              });
            }}
          >
            <div>
              <Label htmlFor="pw-current" className="mb-1.5 block text-xs">
                {t.profile.currentPasswordLabel}
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
                  {t.profile.newPasswordLabel}
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
                  {t.profile.repeatPasswordLabel}
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
              {t.profile.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t.profile.deleteTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {t.profile.deleteIntro}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
                {t.profile.deleteButton}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t.profile.deleteConfirmTitle}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t.profile.deleteConfirmDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-1">
                <Label htmlFor="pw-delete" className="mb-1.5 block text-xs">
                  {t.profile.passwordLabel}
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
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={!deletePw || deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate({ password: deletePw })}
                >
                  {t.profile.deleteFinal}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <div className="mt-5">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => logout()}
        >
          <LogOut className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
          {t.shell.logout}
        </Button>
      </div>

      {/* Versions-Anzeige: welcher Build läuft gerade? */}
      <p className="mt-6 text-center text-xs text-muted-foreground/70">
        {t.profile.versionLine(__APP_VERSION__)}
        {__APP_VERSION__ !== "dev" &&
          t.profile.buildDate(
            new Date(__APP_BUILT_AT__).toLocaleDateString(LOCALE_TAGS[lang], {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          )}
      </p>
    </div>
  );
}
