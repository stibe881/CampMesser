import { useEffect, useMemo, useState } from "react";
import { fmtMedium } from "@/lib/dateFormat";
import ClientErrorLog from "@/components/ClientErrorLog";
import CollapsibleCard from "@/components/CollapsibleCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  UserRound,
  KeyRound,
  Mail,
  Trash2,
  LayoutGrid,
  Palette,
  Globe,
  CalendarDays,
  Sun,
  Moon,
  MonitorSmartphone,
  LogOut,
  BellRing,
  House,
  LocateFixed,
  MapPin,
  Search,
  Fingerprint,
  Plus,
  Sparkles,
  MailWarning,
  Navigation,
  Clock,
  TriangleAlert,
} from "lucide-react";
import { Link } from "wouter";
import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import PageHeader from "@/components/PageHeader";
import LoginPrompt from "@/components/LoginPrompt";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { WhatsNewDialog } from "@/components/WhatsNewDialog";
import type { ChangelogBlock } from "@/data/changelogMeta";
import {
  loadMapsPreference,
  saveMapsPreference,
  type MapsPreference,
} from "@/lib/directions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePushSubscription } from "@/lib/usePushSubscription";
import { calendarFeedUrl, calendarWebcalUrl } from "@shared/calendarFeed";
import { clearAppBadge, isAppBadgeSupported } from "@/lib/appBadge";
import {
  loadAppBadgeEnabled,
  saveAppBadgeEnabled,
} from "@/lib/appBadgeSetting";
import { searchPlaces, type PlaceResult } from "@/lib/placeSearch";
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
import { LANGUAGE_LABELS, LANGUAGES, LOCALE_TAGS } from "@shared/i18n";
import { RETENTION_DAYS } from "@shared/trash";
import { PUSH_CHECK_STALE_HOURS, pushCheckHealth } from "@shared/pushHealth";
import { useSyncedSetting } from "@/lib/useSyncedSetting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { modules } from "@/data/modules";
import { pick } from "@shared/i18n";
import {
  DEFAULT_QUICK_BAR,
  QUICK_BAR_SOS,
  QUICK_BAR_START,
  isDefaultQuickBar,
  sanitizeQuickBar,
  setQuickBarSlot,
} from "@shared/quickBar";
import {
  loadQuickBar,
  quickBarChoices,
  saveQuickBar,
} from "@/lib/quickBarStore";
import {
  RAIN_DANGER_MM,
  RAIN_THRESHOLD_MAX_MM,
  RAIN_THRESHOLD_MIN_MM,
  WIND_DANGER_KMH,
  WIND_THRESHOLD_MAX_KMH,
  WIND_THRESHOLD_MIN_KMH,
} from "@shared/weather";

import NotificationsCard from "@/components/profile/NotificationsCard";
import HomeLocationCard from "@/components/profile/HomeLocationCard";
import PasskeysCard from "@/components/profile/PasskeysCard";
import QuickBarCard from "@/components/profile/QuickBarCard";
import CalendarFeedCard from "@/components/profile/CalendarFeedCard";

export default function ProfilePage() {
  const { lang, t, setLang } = useI18n();
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
  // «Was ist neu»: Dialog mit ALLEN Changelog-Blöcken (unabhängig vom Marker)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  /**
   * Alle Changelog-Blöcke – erst beim Klick geholt. Die Datei ist mit vier
   * Sprachen gegen 280 kB gross und gehört darum nicht ins Haupt-Bundle
   * (siehe data/changelog.ts).
   */
  const [changelogBlocks, setChangelogBlocks] = useState<ChangelogBlock[]>([]);
  const openWhatsNew = () => {
    void import("@/data/changelog")
      .then(({ changelog }) => {
        setChangelogBlocks(changelog);
        setWhatsNewOpen(true);
      })
      .catch(() => {
        /* Offline und nicht im Cache: der Eintrag bleibt einfach wirkungslos */
      });
  };

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
  // Bestätigungs-Mail erneut anfordern (nur sichtbar, wenn SMTP aktiv ist
  // und die Adresse des Kontos noch unbestätigt ist)
  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => toast.success(t.profile.verifySent),
    onError: e => {
      if (e.data?.code === "TOO_MANY_REQUESTS")
        toast.error(t.profile.verifyTooMany);
      else if (e.data?.code === "PRECONDITION_FAILED")
        toast.error(t.profile.verifyUnavailable);
      else toast.error(e.message);
    },
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

  /**
   * Design und Karten-App gehen neu auch ans Konto (#360). Hier wird nur
   * GESENDET – empfangen tut `SettingsSync` app-weit, damit das Design auf
   * einem zweiten Gerät stimmt, ohne dass man erst das Profil öffnet.
   */
  const themeSync = useSyncedSetting<ThemePreference>("theme", () => {}, {
    receive: false,
  });
  const mapsSync = useSyncedSetting<MapsPreference>("mapsApp", () => {}, {
    receive: false,
  });

  /** Karten-App für Routen (lib/directions.ts): «ask» fragt wieder. */
  const [mapsPref, setMapsPref] = useState<MapsPreference>(() =>
    loadMapsPreference()
  );
  const chooseMapsApp = (value: MapsPreference) => {
    setMapsPref(value);
    saveMapsPreference(value);
    mapsSync.push(value);
  };

  /** Design-Präferenz speichern und sofort anwenden. */
  const chooseTheme = (pref: ThemePreference) => {
    saveThemePreference(pref);
    setThemePref(pref);
    setPreference?.(pref);
    themeSync.push(pref);
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

      {/* Dezenter Hinweis: E-Mail-Adresse noch unbestätigt (nur mit SMTP) */}
      {user?.verifyMailEnabled && user.email && !user.emailVerified && (
        <Card className="mb-5 border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <p className="flex flex-1 items-start gap-2 text-sm">
              <MailWarning
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              {t.profile.verifyHint}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={resendMutation.isPending}
              onClick={() => resendMutation.mutate({ lang })}
            >
              {resendMutation.isPending
                ? t.profile.verifySending
                : t.profile.verifyResend}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* NEU GEORDNET (#408, Nutzerwunsch): zuerst das KONTO
          (Name, E-Mail, Passwort, Passkeys), dann DARSTELLUNG
          (Sprache, Design, Karten-App), dann MITTEILUNGEN,
          dann STARTSEITE & DATEN, zuletzt die Gefahrenzone.
          Alle Karten ein-/ausklappbar, Standard zu – die Seite
          liest sich als Inhaltsverzeichnis. */}
      <CollapsibleCard
        className="mb-5"
        icon={<UserRound className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.profile.nameTitle}
      >
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
      </CollapsibleCard>

      <CollapsibleCard
        className="mb-5"
        icon={<Mail className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.profile.emailTitle}
      >
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
              // Sprache für die neue Bestätigungs-Mail (falls SMTP aktiv)
              lang,
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
      </CollapsibleCard>

      <CollapsibleCard
        className="mb-5"
        icon={<KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.profile.passwordTitle}
      >
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
              <PasswordStrengthMeter password={newPw} />
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
      </CollapsibleCard>

      <PasskeysCard />

      {/* Sprache (#374): Sie sass bis jetzt in der Kopfzeile, wo nun die
          Benachrichtigungs-Glocke steht. Eine Sprache stellt man einmal
          ein – das ist eine Einstellung und gehört ins Profil. */}
      <CollapsibleCard
        className="mb-5"
        icon={<Globe className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.profile.languageTitle}
      >
        <p className="mb-3 text-sm text-muted-foreground">
          {t.profile.languageIntro}
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t.profile.languageTitle}
        >
          {LANGUAGES.map(code => (
            <Button
              key={code}
              type="button"
              variant={code === lang ? "default" : "outline"}
              className="flex-1"
              onClick={() => setLang(code)}
            >
              {LANGUAGE_LABELS[code]}
            </Button>
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        className="mb-5"
        icon={<Palette className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.profile.themeTitle}
      >
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
            <MonitorSmartphone className="mr-1.5 h-4 w-4" aria-hidden="true" />{" "}
            {t.profile.themeAuto}
          </Button>
        </div>
      </CollapsibleCard>

      {/* Karten-App für Routen: Die Frage beim ersten Routen-Klick lässt
          sich hier nachträglich beantworten oder zurücksetzen. */}
      <CollapsibleCard
        className="mb-5"
        icon={
          <Navigation className="h-4 w-4 text-primary" aria-hidden="true" />
        }
        title={t.directions.settingLabel}
      >
        <p className="mb-3 text-sm text-muted-foreground">
          {t.directions.settingHint}
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t.directions.settingLabel}
        >
          {(
            [
              ["ask", t.directions.settingAsk],
              ["apple", t.directions.apple],
              ["google", t.directions.google],
            ] as [MapsPreference, string][]
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={mapsPref === value ? "default" : "outline"}
              className="flex-1"
              onClick={() => chooseMapsApp(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </CollapsibleCard>

      <NotificationsCard />

      <HomeLocationCard />

      {/* Schnellzugriff-Leiste (#297) */}
      <QuickBarCard />

      <CalendarFeedCard />

      {/* Statistik: auf Nutzerwunsch im Profil statt als Startseiten-Kachel */}
      <CollapsibleCard
        className="mb-5"
        icon={<BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.stats.title}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{t.stats.subtitle}</p>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/statistik">
              {t.stats.title}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CollapsibleCard>

      {/* Papierkorb (#295): gehört zum Konto, nicht auf die Startseite */}
      <CollapsibleCard
        className="mb-5"
        icon={<Trash2 className="h-4 w-4 text-primary" aria-hidden="true" />}
        title={t.trash.title}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t.trash.intro(RETENTION_DAYS)}
          </p>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/papierkorb">
              {t.trash.profileLink}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        className="border-destructive/40"
        titleClassName="text-destructive"
        icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
        title={t.profile.deleteTitle}
      >
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
      </CollapsibleCard>

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

      {/* «Was ist neu»: alle bisherigen Neuerungen nachlesen */}
      <div className="mt-6 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={openWhatsNew}
        >
          <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t.whatsNew.title}
        </Button>
      </div>
      <WhatsNewDialog
        open={whatsNewOpen}
        onOpenChange={setWhatsNewOpen}
        blocks={changelogBlocks}
        intro={t.whatsNew.allIntro}
      />

      {/* Absturzmeldungen (#352) – nur für Admin-Konten sichtbar */}
      <ClientErrorLog />

      {/* Versions-Anzeige: welcher Build läuft gerade? */}
      <p className="mt-2 text-center text-xs text-muted-foreground/70">
        {t.profile.versionLine(__APP_VERSION__)}
        {__APP_VERSION__ !== "dev" &&
          t.profile.buildDate(fmtMedium(new Date(__APP_BUILT_AT__), lang))}
      </p>
      {/* Rechtliches (#409): unaufdringlich, aber auffindbar. */}
      <p className="mt-1 text-center text-xs text-muted-foreground/70">
        <Link href="/impressum" className="hover:underline">
          {t.legal.imprintTitle}
        </Link>
        {" · "}
        <Link href="/datenschutz" className="hover:underline">
          {t.legal.privacyTitle}
        </Link>
      </p>
    </div>
  );
}
