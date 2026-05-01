export default function AboutPage() {
  return (
    <div className="px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-4">
            Über uns
          </p>
          <h1 className="font-display text-5xl text-brand-cream mb-6">
            Diskrete Vermittlung auf höchstem Niveau
          </h1>
          <div className="gold-divider mb-8" />
        </div>

        <div className="flex flex-col gap-10 font-body text-brand-silver leading-relaxed">
          <section>
            <h2 className="font-display text-2xl text-brand-cream mb-4">Unser Ansatz</h2>
            <p>
              Arcanum ist ein geschlossenes Off-Market-Netzwerk für außergewöhnliche Objekte —
              Fahrzeuge, Immobilien, Uhren, Kunst und mehr, die abseits des öffentlichen Marktes
              gehandelt werden. Diskretion ist dabei keine Option, sondern Grundprinzip.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-cream mb-4">Der Vermittler</h2>
            <p>
              Hinter diesem Netzwerk steht ein öffentlich bestellter und vereidigter Sachverständiger
              mit jahrzehntelanger Erfahrung in der Bewertung exklusiver Objekte. Jedes Inserat wird
              vor der Aufnahme einer eingehenden Prüfung unterzogen. Nur der Vermittler kennt
              alle Beteiligten — Käufer und Verkäufer bleiben einander unbekannt.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-brand-cream mb-4">Wie es funktioniert</h2>
            <div className="flex flex-col gap-4">
              {[
                { n: '01', t: 'Einladung', d: 'Zugang nur über persönlichen Einladungscode. Kein öffentlicher Zugang.' },
                { n: '02', t: 'Anonymes Profil', d: 'Automatisch generierter Username. Keine echten Namen sichtbar.' },
                { n: '03', t: 'Diskrete Listings', d: 'Beschreibungen und Preisspannen — keine identifizierenden Fotos.' },
                { n: '04', t: 'Persönlicher Kontakt', d: 'Alle Anfragen laufen über den Vermittler. Käufer und Verkäufer bleiben anonym.' },
              ].map((step) => (
                <div key={step.n} className="flex gap-6 items-start">
                  <span className="font-display text-3xl text-brand-gold/30 shrink-0 w-10">{step.n}</span>
                  <div>
                    <p className="text-brand-cream font-body font-medium mb-1">{step.t}</p>
                    <p className="text-sm">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
