/**
 * Feedback-Karte im Profil (#512): Fehler und Wünsche landen sonst nie
 * beim Betreiber – ein Textfeld, das per SMTP (#56) direkt ins
 * Betreiber-Postfach schreibt. Kein neues Konto, kein Formular-Dienst.
 */
import { useState } from "react";
import { MessageCircleHeart } from "lucide-react";
import { toast } from "sonner";
import CollapsibleCard from "@/components/CollapsibleCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/i18n";

export default function FeedbackCard() {
  const { t } = useI18n();
  const tf = t.feedback;
  const [message, setMessage] = useState("");
  const sendMutation = trpc.feedback.send.useMutation({
    onSuccess: () => {
      setMessage("");
      toast.success(tf.sent);
    },
    onError: error => {
      toast.error(
        error.message === "mailNotConfigured"
          ? tf.mailNotConfigured
          : error.message === "rateLimited"
            ? tf.rateLimited
            : t.common.actionFailed
      );
    },
  });

  return (
    <CollapsibleCard
      className="mb-5"
      icon={
        <MessageCircleHeart
          className="h-4 w-4 text-primary"
          aria-hidden="true"
        />
      }
      title={tf.title}
    >
      <p className="mb-3 text-sm text-muted-foreground">{tf.intro}</p>
      <Textarea
        rows={4}
        maxLength={2000}
        value={message}
        placeholder={tf.placeholder}
        aria-label={tf.title}
        onChange={e => setMessage(e.target.value)}
      />
      <Button
        type="button"
        className="mt-2"
        disabled={message.trim().length < 10 || sendMutation.isPending}
        onClick={() => sendMutation.mutate({ message: message.trim() })}
      >
        {sendMutation.isPending ? t.common.saving : tf.send}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">{tf.note}</p>
    </CollapsibleCard>
  );
}
