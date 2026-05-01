import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/format';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/utils/constants';

async function getListings() {
  return prisma.listing.findMany({
    include: { _count: { select: { inquiries: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

const statusBadge: Record<string, 'gold' | 'silver' | 'green' | 'red' | 'yellow'> = {
  DRAFT: 'silver',
  ACTIVE: 'green',
  RESERVED: 'yellow',
  SOLD: 'red',
  WITHDRAWN: 'red',
};

export default async function AdminListingsPage() {
  const listings = await getListings();

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-display text-3xl text-brand-cream">Inserate</h1>
        <Link href="/admin-panel/listings/new">
          <Button>Neues Inserat</Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-brand-border text-left">
              <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Objekt</th>
              <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Status</th>
              <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Kategorie</th>
              <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Anfragen</th>
              <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Aktualisiert</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-brand-charcoal/30 transition-colors">
                <td className="py-4 pr-6">
                  <p className="text-brand-cream">{l.title}</p>
                  <p className="text-xs text-brand-silver">{CATEGORY_LABELS[l.category] ?? l.category}</p>
                </td>
                <td className="py-4 pr-6">
                  <Badge variant={statusBadge[l.status] ?? 'silver'}>
                    {STATUS_LABELS[l.status] ?? l.status}
                  </Badge>
                </td>
                <td className="py-4 pr-6 text-brand-silver">
                  {CATEGORY_LABELS[l.category] ?? l.category}
                </td>
                <td className="py-4 pr-6 text-brand-silver">{l._count.inquiries}</td>
                <td className="py-4 pr-6 text-brand-silver">{formatDate(l.updatedAt)}</td>
                <td className="py-4 text-right">
                  <Link
                    href={`/admin-panel/listings/${l.id}`}
                    className="text-xs text-brand-gold hover:text-brand-gold-light transition-colors"
                  >
                    Bearbeiten →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
