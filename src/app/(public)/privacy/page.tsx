export default function PrivacyPage() {
  return (
    <div className="px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-4xl text-brand-cream mb-8">Datenschutzerklärung</h1>
        <div className="gold-divider mb-10" />

        <div className="flex flex-col gap-10 font-body text-brand-silver leading-relaxed text-sm">
          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">1. Verantwortlicher</h2>
            <p>
              Verantwortlich im Sinne der DSGVO ist der Betreiber dieser Plattform.
              Kontaktdaten finden Sie im Impressum.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">2. Erhobene Daten</h2>
            <p>
              Wir erheben ausschließlich die zur Plattformnutzung notwendigen Daten:
            </p>
            <ul className="list-disc list-inside mt-3 flex flex-col gap-2">
              <li>E-Mail-Adresse (für Konto und Kommunikation)</li>
              <li>Anonymer Benutzername (automatisch generiert)</li>
              <li>IP-Adresse (für Sicherheit und Missbrauchsschutz)</li>
              <li>Inhalte Ihrer Anfragen (verschlüsselt gespeichert)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">3. Rechtsgrundlagen</h2>
            <p>
              Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
              und Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen — Sicherheit der Plattform).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">4. Speicherdauer</h2>
            <p>
              Daten werden gelöscht, sobald sie für die Verarbeitung nicht mehr benötigt werden.
              Server-Logs werden nach 90 Tagen automatisch gelöscht.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">5. Ihre Rechte</h2>
            <p>Sie haben das Recht auf:</p>
            <ul className="list-disc list-inside mt-3 flex flex-col gap-2">
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch (Art. 21 DSGVO)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">6. Cookies</h2>
            <p>
              Wir verwenden ausschließlich technisch notwendige Cookies für die Authentifizierung.
              Es werden keine Tracking- oder Marketing-Cookies eingesetzt.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-brand-cream mb-3">7. Sicherheit</h2>
            <p>
              Alle Daten werden verschlüsselt übertragen (TLS 1.3) und gespeichert.
              Passwörter werden mit bcrypt gehasht und nie im Klartext gespeichert.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
