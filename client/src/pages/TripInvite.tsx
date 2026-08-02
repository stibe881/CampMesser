import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  CalendarDays,
  Check,
  Loader2,
  LogIn,
  MapPin,
  Tent,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { rememberLoginReturn } from "@/lib/loginReturn";
import { useI18n } from "@/i18n";
import { LOCALE_TAGS } from "@shared/i18n";

/**
 * Öffentliche Einladungs-Seite einer Reise (/reise-einladung/:token):
 * zeigt bewusst nur Ort, Zeitraum und den Namen der Besitzerin/des Besitzers.
 * Angemeldete können die Einladung annehmen und werden Mitreisende; Gäste
 * werden zur Anmeldung geführt und kehren danach hierher zurück.
 */
export default function TripInvitePage() {
  const { lang, t } = useI18n();
  const params = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const token = params.token ?? "";
  const inviteQuery = trpc.trips.invite.get.useQuery(
    { token },
    { enabled: token.length >= 8, retry: false }
  );
  const [accepted, setAccepted] = useState(false);

  const acceptMutation = trpc.trips.invite.accept.useMutation({
    onSuccess: data => {
      setAccepted(true);
      utils.trips.list.invalidate();
      toast.success(
        data.alreadyOwner ? t.tripInvite.acceptedOwn : t.tripInvite.accepted
      );
      navigate("/tagebuch");
    },
    onError: () => toast.error(t.tripInvite.acceptFailed),
  });

  const fmtDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(LOCALE_TAGS[lang], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (inviteQuery.isLoading || loading) {
    return (
      <div className="container flex justify-center py-16">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t.common.loading}
        />
      </div>
    );
  }

  const trip = inviteQuery.data?.trip ?? null;

  if (!trip) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <Tent
          className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50"
          aria-hidden="true"
        />
        <p className="font-medium">{t.tripInvite.invalid}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.tripInvite.invalidHint}
        </p>
      </div>
    );
  }

  const place = trip.place ?? t.tripInvite.unknownPlace;
  const range =
    trip.startDate === trip.endDate
      ? fmtDate(trip.startDate)
      : `${fmtDate(trip.startDate)} – ${fmtDate(trip.endDate)}`;

  return (
    <div className="container max-w-xl py-6">
      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
        {t.tripInvite.badge}
      </p>
      <h1 className="font-serif text-2xl font-bold md:text-3xl">
        {t.tripInvite.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.tripInvite.ownerLine(trip.ownerName ?? t.tripInvite.ownerFallback)}
      </p>

      <Card className="mt-5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Tent className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-semibold">
                <MapPin
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {place}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                {range}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.tripInvite.editNote}
          </p>
          {isAuthenticated ? (
            <Button
              className="mt-4"
              disabled={acceptMutation.isPending || accepted}
              onClick={() => acceptMutation.mutate({ token })}
            >
              <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {acceptMutation.isPending
                ? t.tripInvite.accepting
                : t.tripInvite.accept}
            </Button>
          ) : (
            <>
              <p className="mt-4 text-sm">{t.tripInvite.loginHint}</p>
              <Button
                className="mt-3"
                onClick={() => {
                  // Nach dem Anmelden hierher zurückkehren
                  rememberLoginReturn(`/reise-einladung/${token}`);
                  navigate("/anmelden");
                }}
              >
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {t.tripInvite.loginCta}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
