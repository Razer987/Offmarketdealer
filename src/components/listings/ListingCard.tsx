import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/utils/format';
import { CONDITION_LABELS } from '@/lib/utils/constants';

interface ListingCardProps {
  id: string;
  brand: string;
  model: string;
  year: number;
  conditionRating: string;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  priceCurrency?: string;
  mileageRange?: string | null;
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
  brand,
  model,
  year,
  conditionRating,
  priceRangeMin,
  priceRangeMax,
  priceCurrency = 'EUR',
  mileageRange,
  status,
  highlights = [],
}: ListingCardProps) {
  const badge = statusBadge[status] ?? { variant: 'silver' as const, label: status };

  return (
    <Link href={`/listings/${id}`} className="block group">
      <div className="card-premium p-6 h-full flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-body uppercase tracking-widest text-brand-silver mb-1">
              {year}
            </p>
            <h3 className="font-display text-xl text-brand-cream group-hover:text-brand-gold transition-colors">
              {brand} {model}
            </h3>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="gold-divider" />

        <div className="grid grid-cols-2 gap-3 text-xs font-body">
          <div>
            <p className="text-brand-silver uppercase tracking-widest mb-0.5">Zustand</p>
            <p className="text-brand-cream">{CONDITION_LABELS[conditionRating] ?? conditionRating}</p>
          </div>
          {mileageRange && (
            <div>
              <p className="text-brand-silver uppercase tracking-widest mb-0.5">Laufleistung</p>
              <p className="text-brand-cream">{mileageRange}</p>
            </div>
          )}
        </div>

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
