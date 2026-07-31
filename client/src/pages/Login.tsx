import { useState } from "react";
import { useLocation } from "wouter";
import { LogIn, UserPlus, Tent, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

/**
 * Eigenständige Anmeldung: E-Mail/Passwort-Login und Registrierung,
 * unabhängig vom Manus-Login.
 */
export default function LoginPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");
  // Passwort-vergessen-Flow
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPw, setResetPw] = useState("");
  const [resetPw2, setResetPw2] = useState("");

  const afterAuth = async (name: string | null) => {
    await utils.auth.me.invalidate();
    toast.success(name ? `Willkommen, ${name}!` : "Willkommen!");
    navigate("/");
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
    onSuccess: () => {
      setResetStep(2);
      toast.success("Falls ein Konto existiert, wurde ein Bestätigungscode verschickt.");
    },
    onError: err => toast.error(err.message),
  });
  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Passwort zurückgesetzt – du bist jetzt angemeldet.");
      void utils.auth.me.invalidate();
      navigate("/");
    },
    onError: err => toast.error(err.message),
  });

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regPassword2) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }
    registerMutation.mutate({ name: regName, email: regEmail, password: regPassword });
  };

  return (
    <div className="container max-w-md py-6">
      <PageHeader
        title={resetMode ? "Passwort zurücksetzen" : "Anmelden"}
        subtitle={
          resetMode
            ? "Wir schicken dir einen 6-stelligen Bestätigungscode, mit dem du ein neues Passwort setzen kannst."
            : "Mit deinem CampMesser-Konto speicherst du Packlisten, Inventar und Zeltplätze und nutzt sie auf allen Geräten."
        }
      />
      <Card>
        <CardContent className="pt-6">
          {resetMode ? (
            <div>
              {resetStep === 1 ? (
                <form
                  className="space-y-4"
                  onSubmit={e => {
                    e.preventDefault();
                    requestResetMutation.mutate({ email: resetEmail });
                  }}
                >
                  <div>
                    <Label htmlFor="reset-email" className="mb-1.5 block">
                      E-Mail deines Kontos
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="du@beispiel.ch"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={requestResetMutation.isPending}>
                    <KeyRound className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {requestResetMutation.isPending ? "Code wird verschickt …" : "Code anfordern"}
                  </Button>
                </form>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={e => {
                    e.preventDefault();
                    if (resetPw !== resetPw2) {
                      toast.error("Die Passwörter stimmen nicht überein.");
                      return;
                    }
                    resetMutation.mutate({ email: resetEmail, code: resetCode, newPassword: resetPw });
                  }}
                >
                  <div>
                    <Label htmlFor="reset-code" className="mb-1.5 block">
                      Bestätigungscode <span className="text-xs text-muted-foreground">(6 Ziffern, 15 Min. gültig)</span>
                    </Label>
                    <Input
                      id="reset-code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reset-pw" className="mb-1.5 block">
                      Neues Passwort <span className="text-xs text-muted-foreground">(mind. 8 Zeichen)</span>
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
                      Neues Passwort bestätigen
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
                  <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
                    <KeyRound className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {resetMutation.isPending ? "Wird gespeichert …" : "Passwort setzen"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => requestResetMutation.mutate({ email: resetEmail })}
                    disabled={requestResetMutation.isPending}
                  >
                    Keinen Code erhalten? Erneut anfordern
                  </button>
                </form>
              )}
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setResetMode(false);
                  setResetStep(1);
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Zurück zur Anmeldung
              </button>
            </div>
          ) : (
          <Tabs defaultValue="login">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={submitLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="mb-1.5 block">
                    E-Mail
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="du@beispiel.ch"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="mb-1.5 block">
                    Passwort
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
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {loginMutation.isPending ? "Wird angemeldet …" : "Anmelden"}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => {
                    setResetMode(true);
                    setResetEmail(loginEmail);
                  }}
                >
                  Passwort vergessen?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={submitRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-name" className="mb-1.5 block">
                    Name
                  </Label>
                  <Input
                    id="reg-name"
                    autoComplete="name"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="z. B. Alex"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-email" className="mb-1.5 block">
                    E-Mail
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="du@beispiel.ch"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password" className="mb-1.5 block">
                    Passwort <span className="text-xs text-muted-foreground">(mind. 8 Zeichen)</span>
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
                    Passwort bestätigen
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
                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {registerMutation.isPending ? "Konto wird erstellt …" : "Konto erstellen"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          )}
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Tent className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Die Wissens-Module (1. Hilfe, Knoten, Natur, Rezepte) funktionieren auch ohne Konto –
            ein Konto brauchst du nur zum Speichern eigener Daten.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
