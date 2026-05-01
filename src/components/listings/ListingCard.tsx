import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils/format';
import { CATEGORY_LABELS } from '@/lib/utils/constants';

interface ListingCardProps {
  id: string;
  title: string;
  category: string;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  priceCurrency?: string;
  status: string;
  highlights?: string[];
}

const statusBadge: Record<string, { variant: 'gold' | 'silver' | 'green' | 'red' | 'yellow'; label: string }> = {
  ACTIVE: { variant: 'green', label: 'Verfügbar' },
  RESERVED: { variant: 'yellow', label: 'Reserviert' },
  SOLD: { variant: 'red', label: 'Verkauft' },
};

export function ListingCard({
  id,
  title,
  category,
  priceRangeMin,
  priceRangeMax,
  priceCurrency = 'EUR',
  status,
  highlights = [],
}: ListingCardProps) {
  const badge = statusBadge[status] ?? { variant: 'silver' as const, label: status };

  return (
    <Link href={`/listings/${id}`} className="block group">
      <div className="card-premium p-6 h-full flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-body uppercase tracking-widest text-brand-gold mb-1">
              {CATEGORY_LABELS[category] ?? category}
            </p>
            <h3 className="font-display text-xl text-brand-cream group-hover:text-brand-gold transition-colors">
              {title}
            </h3>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="gold-divider" />

        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {highlights.slice(0, 3).map((h) => (
              <span key={h} className="text-xs px-2 py-0.5 border border-brand-border text-brand-silver font-body">
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2">
          <p className="text-brand-gold font-display text-lg">
            {formatPrice(priceRangeMin, priceRangeMax, priceCurrency)}
          </p>
        </div>
      </div>
    </Link>
  );
}
