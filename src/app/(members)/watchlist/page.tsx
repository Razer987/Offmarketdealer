import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { hashToken } from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { COOKIE_ACCESS_TOKEN } from '@/lib/utils/constants';
import { ListingCard } from '@/components/listings/ListingCard';

async function getWatchlist() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)!.value;
  await verifyAccessToken(token);
  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  return prisma.watchlistItem.findMany({
    where: { userId: session!.userId },
    include: {
      listing: {
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
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function WatchlistPage() {
  const items = await getWatchlist();

  return (
    <div className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
            Mein Bereich
          </p>
          <h1 className="font-display text-4xl text-brand-cream">Merkliste</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 border border-brand-border">
            <p className="text-brand-silver font-body mb-4">Noch keine Fahrzeuge auf der Merkliste.</p>
            <Link href="/listings" className="text-brand-gold font-body text-sm hover:text-brand-gold-light transition-colors">
              Alle Fahrzeuge ansehen →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-border">
            {items.map(({ listing, id }) => (
              <ListingCard
                key={id}
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
