import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-charcoal via-brand-dark to-brand-black opacity-80" />
        <div className="absolute inset-0 bg-[url('/teaser-images/hero-bg.jpg')] bg-cover bg-center opacity-10" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-6 animate-fade-in">
            Exklusiver Privatmarktplatz
          </p>
          <h1 className="font-display text-5xl md:text-7xl text-brand-cream leading-tight mb-6 animate-slide-up">
            Außergewöhnliche
            <br />
            <span className="text-gold-gradient">Objekte</span>
          </h1>
          <p className="text-lg text-brand-silver font-body mb-10 max-w-xl mx-auto leading-relaxed">
            Diskrete Transaktionen für anspruchsvolle Sammler und Investoren.
            Zugang nur auf persönliche Einladung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/teaser">
              <Button size="lg">Entdecken</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg">Mehr erfahren</Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-brand-silver">
          <span className="text-xs font-body uppercase tracking-widest">Scroll</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Principle section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-px bg-brand-border">
            {[
              {
                title: 'Absolute Diskretion',
                description: 'Anonyme Profile. Keine Fotos für Unbefugte. Alle Transaktionen laufen persönlich über uns.',
              },
              {
                title: 'Kuratierte Auswahl',
                description: 'Jedes Objekt wird sorgfältig geprüft und dokumentiert. Nur außergewöhnliche Objekte finden Eingang.',
              },
              {
                title: 'Persönliche Vermittlung',
                description: 'Als öffentlich bestellter und vereidigter Sachverständiger garantieren wir unabhängige Bewertung.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-brand-dark p-10">
                <div className="w-8 h-px bg-brand-gold mb-6" />
                <h3 className="font-display text-xl text-brand-cream mb-3">{item.title}</h3>
                <p className="text-sm text-brand-silver font-body leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-brand-border">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-4">
            Mitgliedschaft
          </p>
          <h2 className="font-display text-4xl text-brand-cream mb-6">
            Nur auf Einladung
          </h2>
          <p className="text-brand-silver font-body leading-relaxed mb-8">
            Unser Marktplatz ist ausschließlich für geladene Mitglieder zugänglich.
            Wenn Sie einen Einladungscode erhalten haben, können Sie sich jetzt registrieren.
          </p>
          <Link href="/login">
            <Button size="lg">Mit Code anmelden</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
