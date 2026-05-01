import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils/format';

const statusBadge: Record<string, 'gold' | 'silver' | 'green' | 'red' | 'yellow'> = {
  NEW: 'yellow',
  IN_PROGRESS: 'gold',
  RESPONDED: 'green',
  CLOSED: 'silver',
  ARCHIVED: 'silver',
};

const typeLabel: Record<string, string> = {
  LISTING_INQUIRY: 'Anfrage',
  ASSESSMENT_REQUEST: 'Gutachten',
  GENERAL: 'Allgemein',
};

async function getInquiries() {
  return prisma.inquiry.findMany({
    include: {
      user: { select: { username: true, email: true } },
      listing: { select: { title: true, category: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();

  return (
    <div className="p-10">
      <h1 className="font-display text-3xl text-brand-cream mb-10">Anfragen</h1>

      <div className="flex flex-col gap-px bg-brand-border">
        {inquiries.map((inq) => (
          <div key={inq.id} className="bg-brand-dark p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="silver">{typeLabel[inq.type] ?? inq.type}</Badge>
                  <Badge variant={statusBadge[inq.status] ?? 'silver'}>{inq.status}</Badge>
                  <span className="text-xs text-brand-silver font-body">
                    {inq.user.username} · {inq.user.email}
                  </span>
                </div>
                {inq.listing && (
                  <p className="text-sm text-brand-cream font-body mb-1">
                    {inq.listing.title}
                  </p>
                )}
                <p className="text-sm text-brand-silver font-body line-clamp-2 mb-2">
                  {inq.message}
                </p>
                {inq.contactPhone && (
                  <p className="text-xs text-brand-silver font-body">
                    Tel: {inq.contactPhone} · {inq.preferredContact}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-brand-silver font-body">
                  {formatDateTime(inq.createdAt)}
                </p>
              </div>
            </div>
            {inq.adminNotes && (
              <div className="mt-4 pt-4 border-t border-brand-border">
                <p className="text-xs font-body uppercase tracking-widest text-brand-gold mb-1">
                  Admin-Notiz
                </p>
                <p className="text-sm text-brand-silver font-body">{inq.adminNotes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
