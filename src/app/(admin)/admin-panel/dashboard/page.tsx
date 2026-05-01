import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { formatDateTime } from '@/lib/utils/format';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

async function getDashboardData() {
  const [
    totalListings,
    activeListings,
    totalUsers,
    newInquiries,
    recentInquiries,
    recentAudit,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.inquiry.count({ where: { status: 'NEW' } }),
    prisma.inquiry.findMany({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { username: true } },
        listing: { select: { category: true, title: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return { totalListings, activeListings, totalUsers, newInquiries, recentInquiries, recentAudit };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();

  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="font-display text-3xl text-brand-cream">Übersicht</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-border mb-10">
        {[
          { label: 'Inserate gesamt', value: data.totalListings },
          { label: 'Aktive Inserate', value: data.activeListings },
          { label: 'Mitglieder', value: data.totalUsers },
          { label: 'Neue Anfragen', value: data.newInquiries, highlight: data.newInquiries > 0 },
        ].map((stat) => (
          <Card key={stat.label} className={stat.highlight ? 'border-brand-gold/50' : ''}>
            <p className={`text-3xl font-display mb-2 ${stat.highlight ? 'text-brand-gold' : 'text-brand-cream'}`}>
              {stat.value}
            </p>
            <p className="text-xs font-body uppercase tracking-widest text-brand-silver">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent inquiries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-brand-cream">Neue Anfragen</h2>
            <Link href="/admin-panel/inquiries" className="text-xs font-body text-brand-gold hover:text-brand-gold-light">
              Alle →
            </Link>
          </div>
          {data.recentInquiries.length === 0 ? (
            <p className="text-sm text-brand-silver font-body">Keine neuen Anfragen.</p>
          ) : (
            <div className="flex flex-col gap-px bg-brand-border">
              {data.recentInquiries.map((inq) => (
                <Link key={inq.id} href={`/admin-panel/inquiries`}>
                  <div className="bg-brand-dark p-4 hover:bg-brand-charcoal transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-brand-cream font-body">{inq.user.username}</p>
                        {inq.listing && (
                          <p className="text-xs text-brand-silver font-body">
                            {inq.listing.title}
                          </p>
                        )}
                      </div>
                      <Badge variant="yellow">Neu</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Audit log */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-brand-cream">Letzte Aktivitäten</h2>
            <Link href="/admin-panel/audit" className="text-xs font-body text-brand-gold hover:text-brand-gold-light">
              Alle →
            </Link>
          </div>
          <div className="flex flex-col gap-px bg-brand-border">
            {data.recentAudit.map((log) => (
              <div key={log.id} className="bg-brand-dark p-4">
                <p className="text-xs font-body text-brand-cream">{log.action}</p>
                <p className="text-xs text-brand-silver font-body mt-0.5">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
