import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/Button';

async function getTeaserListings() {
  return prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      teaserTitle: true,
      teaserDescription: true,
      teaserImageUrl: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });
}

export default async function TeaserPage() {
  const listings = await getTeaserListings();

  return (
    <div className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-4">
            Aktuelle Objekte
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-brand-cream mb-4">
            Verfügbare Objekte
          </h1>
          <p className="text-brand-silver font-body max-w-xl mx-auto">
            Vollständige Details und Preise sind exklusiv für Mitglieder zugänglich.
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-brand-silver font-body">Derzeit keine Objekte verfügbar.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-brand-dark p-8 flex flex-col gap-4">
                <div className="aspect-video bg-brand-charcoal flex items-center justify-center overflow-hidden">
                  <div className="text-brand-border">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div className="w-6 h-px bg-brand-gold" />

                <h3 className="font-display text-xl text-brand-cream">{listing.teaserTitle}</h3>
                <p className="text-sm text-brand-silver font-body leading-relaxed line-clamp-3">
                  {listing.teaserDescription}
                </p>

                <div className="mt-auto">
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="w-full">
                      Details für Mitglieder
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-16 p-10 border border-brand-border">
          <p className="font-display text-2xl text-brand-cream mb-3">
            Vollständige Details gewünscht?
          </p>
          <p className="text-brand-silver font-body mb-6">
            Mit einem Einladungscode erhalten Sie Zugang zu technischen Daten und Preisinformationen.
          </p>
          <Link href="/login">
            <Button size="lg">Mit Code anmelden</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
