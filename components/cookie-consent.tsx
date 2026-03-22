'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'kandid-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === null) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  }

  function handleRefuse() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'refused');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background/80 backdrop-blur-lg p-5 shadow-2xl shadow-primary/5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Nous utilisons des cookies pour ameliorer votre experience.{' '}
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            En savoir plus
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefuse}
            className="rounded-full px-4 cursor-pointer"
          >
            Refuser
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="rounded-full px-4 hover:bg-primary/80 cursor-pointer"
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
