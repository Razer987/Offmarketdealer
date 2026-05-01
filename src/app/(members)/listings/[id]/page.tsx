import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/Badge';
import { InquiryForm } from '@/components/inquiries/InquiryForm';
import { formatPrice } from '@/lib/utils/format';
import { CATEGORY_LABELS } from '@/lib/utils/constants';

interface Props {
  params: { id: string };
}

async function getListing(id: string) {
  return prisma.listing.findFirst({
    where: { id, status: { in: ['ACTIVE', 'RESERVED'] } },
    select: {
      id: true,
      category: true,
      title: true,
      priceRangeMin: true,
      priceRangeMax: true,
      priceCurrency: true,
      generalDescription: true,
      highlights: true,
      status: true,
    },
  });
}

export default async function ListingDetailPage({ params }: Props) {
  const listing = await getListing(params.id);
  if (!listing) notFound();

  return (
    <div className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            <div>
              {listing.status === 'RESERVED' && (
                <Badge variant="yellow" className="mb-4">Reserviert</Badge>
              )}
              <p className="text-xs font-body uppercase tracking-widest text-brand-gold mb-2">
                {CATEGORY_LABELS[listing.category] ?? listing.category}
              </p>
              <h1 className="font-display text-5xl text-brand-cream mb-4">
                {listing.title}
              </h1>
              <p className="font-display text-2xl text-brand-gold">
                {formatPrice(
                  listing.priceRangeMin ? Number(listing.priceRangeMin) : null,
                  listing.priceRangeMax ? Number(listing.priceRangeMax) : null,
                  listing.priceCurrency
                )}
              </p>
            </div>

            <div className="gold-divider" />

            {/* Description */}
            <div>
              <h2 className="font-display text-2xl text-brand-cream mb-4">Beschreibung</h2>
              <p className="text-brand-silver font-body leading-relaxed whitespace-pre-line">
                {listing.generalDescription}
              </p>
            </div>

            {/* Highlights */}
            {listing.highlights.length > 0 && (
              <div>
                <h2 className="font-display text-2xl text-brand-cream mb-4">Highlights</h2>
                <ul className="flex flex-col gap-3">
                  {listing.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-sm text-brand-silver font-body">
                      <span className="text-brand-gold mt-0.5">—</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-6 border border-brand-border bg-brand-dark">
              <p className="text-xs font-body uppercase tracking-widest text-brand-silver mb-2">
                Hinweis
              </p>
              <p className="text-sm text-brand-silver font-body leading-relaxed">
                Aus Diskretionsgründen werden keine Fotos veröffentlicht.
                Detaillierte Dokumentation und Besichtigung nach erfolgter Kontaktaufnahme.
              </p>
            </div>
          </div>

          {/* Sidebar — Inquiry form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="card-premium p-6">
                <h2 className="font-display text-2xl text-brand-cream mb-6">
                  Interesse bekunden
                </h2>
                <InquiryForm listingId={listing.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
