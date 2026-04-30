import { prisma } from '@/lib/db/prisma';
import { ListingCard } from '@/components/listings/ListingCard';

async function getListings() {
  return prisma.listing.findMany({
    where: { status: { in: ['ACTIVE', 'RESERVED'] } },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      conditionRating: true,
      priceRangeMin: true,
      priceRangeMax: true,
      priceCurrency: true,
      mileageRange: true,
      highlights: true,
      status: true,
    },
    orderBy: { publishedAt: 'desc' },
  });
}

export default async function ListingsPage() {
  const listings = await getListings();

  return (
    <div className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
            Mitglieder-Bereich
          </p>
          <h1 className="font-display text-4xl text-brand-cream">Verfügbare Fahrzeuge</h1>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-24 border border-brand-border">
            <p className="text-brand-silver font-body">Derzeit keine Fahrzeuge verfügbar.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                {...listing}
                priceRangeMin={listing.priceRangeMin ? Number(listing.priceRangeMin) : null}
                priceRangeMax={listing.priceRangeMax ? Number(listing.priceRangeMax) : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
