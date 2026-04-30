import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hashToken } from '@/lib/auth/session';
import { COOKIE_ACCESS_TOKEN } from '@/lib/utils/constants';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

async function getDashboardData() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)!.value;
  await verifyAccessToken(token);
  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  const user = session!.user;

  const [activeListings, recentInquiries, watchlistCount] = await Promise.all([
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.inquiry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { listing: { select: { brand: true, model: true } } },
    }),
    prisma.watchlistItem.count({ where: { userId: user.id } }),
  ]);

  return { user, activeListings, recentInquiries, watchlistCount };
}

const inquiryStatusBadge: Record<string, 'gold' | 'silver' | 'green' | 'red' | 'yellow'> = {
  NEW: 'yellow',
  IN_PROGRESS: 'gold',
  RESPONDED: 'green',
  CLOSED: 'silver',
  ARCHIVED: 'silver',
};

export default async function DashboardPage() {
  const { user, activeListings, recentInquiries, watchlistCount } = await getDashboardData();

  return (
    <div className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
            Willkommen
          </p>
          <h1 className="font-display text-4xl text-brand-cream">{user.username}</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-brand-border mb-px">
          <Link href="/listings">
            <Card hover className="h-full">
              <p className="text-3xl font-display text-brand-gold mb-2">{activeListings}</p>
              <p className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Aktive Inserate
              </p>
            </Card>
          </Link>
          <Link href="/inquiries">
            <Card hover className="h-full">
              <p className="text-3xl font-display text-brand-gold mb-2">{recentInquiries.length}</p>
              <p className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Meine Anfragen
              </p>
            </Card>
          </Link>
          <Link href="/watchlist">
            <Card hover className="h-full">
              <p className="text-3xl font-display text-brand-gold mb-2">{watchlistCount}</p>
              <p className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Merkliste
              </p>
            </Card>
          </Link>
        </div>

        {recentInquiries.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-brand-cream">Aktuelle Anfragen</h2>
              <Link href="/inquiries" className="text-xs font-body uppercase tracking-widest text-brand-gold hover:text-brand-gold-light transition-colors">
                Alle anzeigen →
              </Link>
            </div>
            <div className="flex flex-col gap-px bg-brand-border">
              {recentInquiries.map((inq) => (
                <div key={inq.id} className="bg-brand-dark p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-cream font-body">
                      {inq.listing ? `${inq.listing.brand} ${inq.listing.model}` : 'Allgemeine Anfrage'}
                    </p>
                    <p className="text-xs text-brand-silver font-body mt-1">
                      {new Date(inq.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <Badge variant={inquiryStatusBadge[inq.status] ?? 'silver'}>
                    {inq.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
