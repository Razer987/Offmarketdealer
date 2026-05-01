export default function ImprintPage() {
  return (
    <div className="px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-brand-cream mb-8">Impressum</h1>
        <div className="gold-divider mb-10" />

        <div className="flex flex-col gap-8 font-body text-brand-silver leading-relaxed text-sm">
          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">Angaben gemäß § 5 TMG</h2>
            <p className="text-brand-cream">
              [Name des Betreibers]<br />
              [Straße und Hausnummer]<br />
              [PLZ und Ort]
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">Kontakt</h2>
            <p>
              E-Mail: [kontakt@ihre-domain.de]<br />
              Telefon: [+49 ...]
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">Berufsbezeichnung</h2>
            <p>
              Öffentlich bestellter und vereidigter Sachverständiger für Kraftfahrzeugschäden
              und -bewertungen.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">Haftungshinweis</h2>
            <p>
              Die auf dieser Plattform angebotenen Objekte werden diskret vermittelt.
              Der Betreiber tritt als Vermittler auf, nicht als Händler oder Eigentümer der Objekte.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">Streitbeilegung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit.
              Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
