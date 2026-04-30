'use client';

import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-brand-black">
      <div className="text-center">
        <p className="font-display text-8xl text-brand-border mb-6">500</p>
        <h1 className="font-display text-3xl text-brand-cream mb-3">Interner Fehler</h1>
        <p className="text-brand-silver font-body mb-8">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-red-400 font-mono mb-6">{error.message}</p>
        )}
        <Button onClick={reset}>Erneut versuchen</Button>
      </div>
    </div>
  );
}
