import Link from 'next/link';
import { APP_NAME } from '@/lib/utils/constants';

export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-dark mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-lg text-brand-cream tracking-wider">{APP_NAME}</p>
            <p className="text-xs text-brand-silver mt-1 font-body">Diskret. Exklusiv. Persönlich.</p>
          </div>
          <nav className="flex flex-wrap gap-6">
            <Link href="/about" className="text-xs font-body uppercase tracking-widest text-brand-silver hover:text-brand-gold transition-colors">
              Über uns
            </Link>
            <Link href="/privacy" className="text-xs font-body uppercase tracking-widest text-brand-silver hover:text-brand-gold transition-colors">
              Datenschutz
            </Link>
            <Link href="/imprint" className="text-xs font-body uppercase tracking-widest text-brand-silver hover:text-brand-gold transition-colors">
              Impressum
            </Link>
          </nav>
        </div>
        <div className="gold-divider my-6" />
        <p className="text-xs text-brand-muted font-body text-center">
          © {new Date().getFullYear()} {APP_NAME}. Alle Rechte vorbehalten.
        </p>
      </div>
    </footer>
  );
}
