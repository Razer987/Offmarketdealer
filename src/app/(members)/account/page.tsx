import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { hashToken } from '@/lib/auth/session';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { COOKIE_ACCESS_TOKEN } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/format';

async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)!.value;
  await verifyAccessToken(token);
  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  return session!.user;
}

export default async function AccountPage() {
  const user = await getUser();

  return (
    <div className="px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
            Mein Konto
          </p>
          <h1 className="font-display text-4xl text-brand-cream">Konto-Details</h1>
        </div>

        <div className="flex flex-col gap-px bg-brand-border">
          {[
            { label: 'Benutzername', value: user.username },
            { label: 'E-Mail', value: user.email },
            {
              label: 'E-Mail bestätigt',
              value: user.emailVerified ? 'Ja' : 'Ausstehend',
            },
            {
              label: 'Mitglied seit',
              value: formatDate(user.createdAt),
            },
            {
              label: 'Letzter Login',
              value: user.lastLoginAt ? formatDate(user.lastLoginAt) : '—',
            },
          ].map((row) => (
            <div key={row.label} className="bg-brand-dark px-6 py-5 flex justify-between items-center">
              <p className="text-xs font-body uppercase tracking-widest text-brand-silver">
                {row.label}
              </p>
              <p className="text-sm text-brand-cream font-body">{row.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 border border-brand-border">
          <p className="text-xs font-body uppercase tracking-widest text-brand-silver mb-2">
            Datenschutz
          </p>
          <p className="text-sm text-brand-silver font-body">
            Ihr anonymer Username schützt Ihre Identität auf der Plattform.
            Für Datenschutzanfragen wenden Sie sich bitte direkt an uns.
          </p>
        </div>
      </div>
    </div>
  );
}
