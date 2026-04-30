import { prisma } from '@/lib/db/prisma';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/format';

async function getUsers() {
  return prisma.user.findMany({
    where: { status: { not: 'DELETED' } },
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { inquiries: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="p-10">
      <h1 className="font-display text-3xl text-brand-cream mb-10">Mitglieder</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-brand-border text-left">
              {['Username', 'E-Mail', 'Status', 'Bestätigt', 'Anfragen', 'Letzter Login', 'Registriert'].map((h) => (
                <th key={h} className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-brand-charcoal/30">
                <td className="py-4 pr-6 text-brand-cream font-medium">{u.username}</td>
                <td className="py-4 pr-6 text-brand-silver">{u.email}</td>
                <td className="py-4 pr-6">
                  <Badge variant={u.status === 'ACTIVE' ? 'green' : 'red'}>
                    {u.status === 'ACTIVE' ? 'Aktiv' : 'Gesperrt'}
                  </Badge>
                </td>
                <td className="py-4 pr-6">
                  <Badge variant={u.emailVerified ? 'green' : 'yellow'}>
                    {u.emailVerified ? 'Ja' : 'Nein'}
                  </Badge>
                </td>
                <td className="py-4 pr-6 text-brand-silver">{u._count.inquiries}</td>
                <td className="py-4 pr-6 text-brand-silver">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}
                </td>
                <td className="py-4 pr-6 text-brand-silver">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
