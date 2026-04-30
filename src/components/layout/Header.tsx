'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/lib/utils/constants';

interface HeaderProps {
  isAuthenticated?: boolean;
  username?: string;
}

export function Header({ isAuthenticated, username }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-brand-border bg-brand-black/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-brand-cream tracking-wider hover:text-brand-gold transition-colors">
          {APP_NAME}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/teaser" className="text-sm font-body uppercase tracking-widest text-brand-silver hover:text-brand-gold transition-colors">
            Fahrzeuge
          </Link>
          <Link href="/about" className="text-sm font-body uppercase tracking-widest text-brand-silver hover:text-brand-gold transition-colors">
            Über uns
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/listings" className="text-sm font-body uppercase tracking-widest text-brand-silver hover:text-brand-gold transition-colors">
                Mitglieder
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-xs text-brand-gold font-body">{username}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Abmelden
                </Button>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Anmelden</Button>
            </Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-brand-silver hover:text-brand-cream"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menü"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-dark px-6 py-4 flex flex-col gap-4">
          <Link href="/teaser" className="text-sm font-body uppercase tracking-widest text-brand-silver" onClick={() => setMenuOpen(false)}>
            Fahrzeuge
          </Link>
          <Link href="/about" className="text-sm font-body uppercase tracking-widest text-brand-silver" onClick={() => setMenuOpen(false)}>
            Über uns
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/listings" className="text-sm font-body uppercase tracking-widest text-brand-silver" onClick={() => setMenuOpen(false)}>
                Mitglieder
              </Link>
              <button onClick={handleLogout} className="text-left text-sm font-body uppercase tracking-widest text-brand-silver">
                Abmelden
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full">Anmelden</Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
