import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  LogIn,
  UserPlus,
  Tent,
  KeyRound,
  ArrowLeft,
  MailCheck,
  Fingerprint,
} from "lucide-react";
import {
  browserSupportsWebAuthn,
  startAuthentication,
} from "@simplewebauthn/browser";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { consumeLoginReturn } from "@/lib/loginReturn";
import { useI18n } from "@/i18n";

/**
 * Eigenständige Anmeldung: E-Mail/Passwort-Login und Registrierung,
 * unabhängig vom Manus-Login. Passwort vergessen: Link per E-Mail anfordern;
 * mit ?reset=<token> in der URL wird das Formular «Neues Passwort setzen» gezeigt.
 * Mit ?verify=<token> (Link aus der Bestätigungs-Mail) wird die E-Mail-Adresse
 * bestätigt und danach das normale Anmelde-Formular gezeigt.
 */
export default function LoginPage() {
  const { lang, t } = useI18n();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  // Passwort-vergessen-Flow: Link anfordern …
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  // … oder mit Token aus dem E-Mail-Link ein neues Passwort setzen
  const [resetToken, setResetToken] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get("reset") ?? null
  );
  const [resetPw, setResetPw] = useState("");
  const [resetPw2, setResetPw2] = useState("");
  // E-Mail-Bestätigung: Token aus dem Mail-Link (?verify=<token>)
  const [verifyToken] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get("verify") ?? null
  );

  const afterAuth = async (name: string | null) => {
    await utils.auth.me.invalidate();
    toast.success(name ? t.login.welcomeName(name) : t.login.welcome);
    // Zurück zur Ausgangsseite (z. B. Reise-Einladung), sonst zur Startseite
    navigate(consumeLoginReturn());
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: data => void afterAuth(data.name),
    onError: err => toast.error(err.message),
  });
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: data => void afterAuth(data.name),
    onError: err => toast.error(err.message),
  });
  const requestResetMutation = trpc.auth.requestReset.useMutation({
    onSuccess: () => setLinkSent(true),
    onError: err => {
      if (err.data?.code === "PRECONDITION_FAILED")
        toast.error(t.login.resetUnavailable);
      else if (err.data?.code === "TOO_MANY_REQUESTS")
        toast.error(t.login.tooManyResets);
      else toast.error(err.message);
    },
  });
  const performResetMutation = trpc.auth.performReset.useMutation({
    onSuccess: () => {
      toast.success(t.login.resetDone);
      void utils.auth.me.invalidate();
      navigate("/");
    },
    onError: err => {
      if (err.data?.code === "NOT_FOUND") toast.error(t.login.resetLinkInvalid);
      else toast.error(err.message);
    },
  });

  // E-Mail-Bestätigung aus dem Mail-Link genau EINMAL auslösen (StrictMode-fest),
  // danach den Token aus der Adresszeile entfernen und normal anmelden lassen.
  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success(t.login.emailVerified);
      void utils.auth.me.invalidate();
    },
    onError: err => {
      if (err.data?.code === "NOT_FOUND")
        toast.error(t.login.verifyLinkInvalid);
      else toast.error(err.message);
    },
  });
  const verifyFiredRef = useRef(false);
  useEffect(() => {
    if (!verifyToken || verifyFiredRef.current) return;
    verifyFiredRef.current = true;
    verifyMutation.mutate({ token: verifyToken });
    navigate("/anmelden", { replace: true });
  }, [verifyToken, verifyMutation, navigate]);

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  // Passkey-Anmeldung: nur anbieten, wenn der Browser WebAuthn kann.
  const passkeySupported = useMemo(() => browserSupportsWebAuthn(), []);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const passkeyOptionsMutation = trpc.auth.passkeyLoginOptions.useMutation();
  const passkeyVerifyMutation = trpc.auth.passkeyLoginVerify.useMutation();

  const loginWithPasskey = async () => {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      // Mit eingetippter E-Mail werden die Passkeys des Kontos angeboten,
      // ohne entscheidet das Gerät (discoverable Credential).
      const options = await passkeyOptionsMutation.mutateAsync({
        email: loginEmail.trim() || undefined,
      });
      const response = await startAuthentication({ optionsJSON: options });
      const result = await passkeyVerifyMutation.mutateAsync({ response });
      await afterAuth(result.name);
    } catch (error) {
      // Abbruch durch die Nutzer*in (NotAllowedError) still übergehen
      const name = (error as { name?: string } | null)?.name;
      if (name !== "NotAllowedError" && name !== "AbortError") {
        toast.error(t.login.passkeyFailed);
      }
    } finally {
      setPasskeyBusy(false);
    }
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regPassword2) {
      toast.error(t.login.passwordsMismatch);
      return;
    }
    registerMutation.mutate({
      name: regName,
      email: regEmail,
      password: regPassword,
      // Sprache für die Bestätigungs-Mail (falls SMTP konfiguriert ist)
      lang,
    });
  };

  const leaveTokenMode = () => {
    setResetToken(null);
    // Token-Parameter aus der Adresszeile entfernen
    navigate("/anmelden", { replace: true });
  };

  const pageTitle = resetToken
    ? t.login.newPasswordTitle
    : resetMode
      ? t.login.resetTitle
      : t.login.title;
  const pageSubtitle = resetToken
    ? t.login.newPasswordSubtitle
    : resetMode
      ? t.login.resetSubtitle
      : t.login.subtitle;

  return (
    <div className="container max-w-md py-6">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />
      <Card>
        <CardContent className="pt-6">
          {resetToken ? (
            <div>
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  if (resetPw !== resetPw2) {
                    toast.error(t.login.passwordsMismatch);
                    return;
                  }
                  performResetMutation.mutate({
                    token: resetToken,
                    newPassword: resetPw,
                  });
                }}
              >
                <div>
                  <Label htmlFor="reset-pw" className="mb-1.5 block">
                    {t.login.newPasswordLabel}{" "}
                    <span className="text-xs text-muted-foreground">
                      {t.login.passwordHint}
                    </span>
                  </Label>
                  <Input
                    id="reset-pw"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={resetPw}
                    onChange={e => setResetPw(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="reset-pw2" className="mb-1.5 block">
                    {t.login.confirmNewPasswordLabel}
                  </Label>
                  <Input
                    id="reset-pw2"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={resetPw2}
                    onChange={e => setResetPw2(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={performResetMutation.isPending}
                >
                  <KeyRound className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {performResetMutation.isPending
                    ? t.common.saving
                    : t.login.setPassword}
                </Button>
              </form>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                onClick={leaveTokenMode}
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                {t.login.backToLogin}
              </button>
            </div>
          ) : resetMode ? (
            <div>
              {linkSent ? (
                <p className="flex items-start gap-2 text-sm">
                  <MailCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {t.login.linkSent}
                </p>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={e => {
                    e.preventDefault();
                    requestResetMutation.mutate({ email: resetEmail, lang });
                  }}
                >
                  <div>
                    <Label htmlFor="reset-email" className="mb-1.5 block">
                      {t.login.accountEmailLabel}
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder={t.login.emailPlaceholder}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={requestResetMutation.isPending}
                  >
                    <KeyRound className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {requestResetMutation.isPending
                      ? t.login.sendingLink
                      : t.login.sendLink}
                  </Button>
                </form>
              )}
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setResetMode(false);
                  setLinkSent(false);
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                {t.login.backToLogin}
              </button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="login">{t.login.tabLogin}</TabsTrigger>
                <TabsTrigger value="register">
                  {t.login.tabRegister}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={submitLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="mb-1.5 block">
                      {t.login.emailLabel}
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder={t.login.emailPlaceholder}
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="mb-1.5 block">
                      {t.login.passwordLabel}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {loginMutation.isPending
                      ? t.login.loggingIn
                      : t.login.loginButton}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => {
                      setResetMode(true);
                      setLinkSent(false);
                      setResetEmail(loginEmail);
                    }}
                  >
                    {t.login.forgotPassword}
                  </button>
                </form>
                {passkeySupported && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground">
                        {t.login.passkeyOr}
                      </span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 w-full"
                      disabled={passkeyBusy}
                      onClick={() => void loginWithPasskey()}
                    >
                      <Fingerprint
                        className="mr-1.5 h-4 w-4"
                        aria-hidden="true"
                      />
                      {passkeyBusy
                        ? t.login.passkeyWaiting
                        : t.login.passkeyButton}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={submitRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-name" className="mb-1.5 block">
                      {t.login.nameLabel}
                    </Label>
                    <Input
                      id="reg-name"
                      autoComplete="name"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder={t.login.namePlaceholder}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email" className="mb-1.5 block">
                      {t.login.emailLabel}
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder={t.login.emailPlaceholder}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password" className="mb-1.5 block">
                      {t.login.passwordLabel}{" "}
                      <span className="text-xs text-muted-foreground">
                        {t.login.passwordHint}
                      </span>
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password2" className="mb-1.5 block">
                      {t.login.confirmPasswordLabel}
                    </Label>
                    <Input
                      id="reg-password2"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={regPassword2}
                      onChange={e => setRegPassword2(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {registerMutation.isPending
                      ? t.login.creatingAccount
                      : t.login.createAccount}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Tent className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t.login.knowledgeNote}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
