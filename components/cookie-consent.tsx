'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg sm:p-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-gray-600 text-center sm:text-left">
          Nous utilisons des cookies pour ameliorer votre experience. En
          continuant, vous acceptez notre{' '}
          <a
            href="/privacy"
            className="text-indigo-600 hover:text-indigo-500 underline"
          >
            politique de cookies
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefuse}
          >
            Refuser
          </Button>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleAccept}
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
