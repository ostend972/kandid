'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type SendStatus = 'idle' | 'sending' | 'sent' | 'failed';

interface SendEmailButtonProps {
  applicationId: string;
  hasDossier: boolean;
  currentStatus?: string | null;
  lastSentTo?: string | null;
}

export function SendEmailButton({
  applicationId,
  hasDossier,
  currentStatus,
  lastSentTo,
}: SendEmailButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SendStatus>(
    currentStatus === 'sent' ? 'sent' : currentStatus === 'failed' ? 'failed' : 'idle'
  );
  const [email, setEmail] = useState(lastSentTo ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSend() {
    if (!email.trim()) return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/applications/${applicationId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: email.trim(),
          subject: subject.trim() || undefined,
          body: body.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('sent');
      } else {
        setStatus('failed');
        setErrorMsg(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      setStatus('failed');
      setErrorMsg('Erreur réseau');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasDossier}
          title={!hasDossier ? 'Générez d\'abord un dossier' : 'Envoyer le dossier par email'}
        >
          <Send className="h-4 w-4 mr-2" />
          {status === 'sent' ? 'Envoyé' : 'Envoyer au recruteur'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer le dossier</DialogTitle>
          <DialogDescription>
            Le dossier PDF sera envoyé en pièce jointe au recruteur.
          </DialogDescription>
        </DialogHeader>

        {status === 'sent' ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-muted-foreground">
              Dossier envoyé à <strong>{email}</strong>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus('idle');
                setEmail('');
              }}
            >
              Envoyer à quelqu&apos;un d&apos;autre
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Email du recruteur *</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="recruteur@entreprise.ch"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'sending'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Objet (optionnel)</Label>
              <Input
                id="email-subject"
                placeholder="Candidature — Poste de..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={status === 'sending'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Message (optionnel)</Label>
              <Textarea
                id="email-body"
                placeholder="Ajoutez un message personnalisé..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={status === 'sending'}
                rows={3}
              />
            </div>

            {status === 'failed' && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={status === 'sending' || !email.trim()}
              className="w-full"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : status === 'failed' ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Réessayer
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
