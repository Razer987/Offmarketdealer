import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { hashToken } from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { COOKIE_ACCESS_TOKEN } from '@/lib/utils/constants';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const statusBadge: Record<string, 'gold' | 'silver' | 'green' | 'red' | 'yellow'> = {
  NEW: 'yellow',
  IN_PROGRESS: 'gold',
  RESPONDED: 'green',
  CLOSED: 'silver',
  ARCHIVED: 'silver',
};

const statusLabel: Record<string, string> = {
  NEW: 'Neu',
  IN_PROGRESS: 'In Bearbeitung',
  RESPONDED: 'Beantwortet',
  CLOSED: 'Geschlossen',
  ARCHIVED: 'Archiviert',
};

const typeLabel: Record<string, string> = {
  LISTING_INQUIRY: 'Anfrage',
  ASSESSMENT_REQUEST: 'Gutachten-Auftrag',
  GENERAL: 'Allgemeine Anfrage',
};

async function getInquiries() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)!.value;
  await verifyAccessToken(token);
  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  return prisma.inquiry.findMany({
    where: { userId: session!.userId },
    include: { listing: { select: { title: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function InquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <div className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
              Mein Bereich
            </p>
            <h1 className="font-display text-4xl text-brand-cream">Meine Anfragen</h1>
          </div>
          <Link href="/inquiries/new">
            <Button>Neue Anfrage</Button>
          </Link>
        </div>

        {inquiries.length === 0 ? (
          <div className="text-center py-24 border border-brand-border">
            <p className="text-brand-silver font-body mb-4">Noch keine Anfragen.</p>
            <Link href="/inquiries/new">
              <Button variant="outline">Erste Anfrage stellen</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-brand-border">
            {inquiries.map((inq) => (
              <div key={inq.id} className="bg-brand-dark p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="silver">{typeLabel[inq.type] ?? inq.type}</Badge>
                      <Badge variant={statusBadge[inq.status] ?? 'silver'}>
                        {statusLabel[inq.status] ?? inq.status}
                      </Badge>
                    </div>
                    {inq.listing && (
                      <p className="text-sm text-brand-cream font-body">
                        {inq.listing.title}
                      </p>
                    )}
                    <p className="text-sm text-brand-silver font-body line-clamp-2">{inq.message}</p>
                    <p className="text-xs text-brand-muted font-body">
                      {new Date(inq.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
