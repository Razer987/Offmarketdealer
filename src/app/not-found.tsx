import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-brand-black">
      <div className="text-center">
        <p className="font-display text-8xl text-brand-border mb-6">404</p>
        <h1 className="font-display text-3xl text-brand-cream mb-3">Seite nicht gefunden</h1>
        <p className="text-brand-silver font-body mb-8">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link href="/">
          <Button>Zur Startseite</Button>
        </Link>
      </div>
    </div>
  );
}
