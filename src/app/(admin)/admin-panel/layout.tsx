import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifyAdminToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { COOKIE_ADMIN_TOKEN } from '@/lib/utils/constants';
import { hashToken } from '@/lib/auth/session';

async function getAdminOrNull() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_ADMIN_TOKEN)?.value;
  if (!token) return null;

  try {
    await verifyAdminToken(token);
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { admin: true },
    });
    if (!session || session.expiresAt < new Date()) return null;
    return session.admin;
  } catch {
    return null;
  }
}

const NAV = [
  { href: '/admin-panel/dashboard', label: 'Übersicht' },
  { href: '/admin-panel/listings', label: 'Inserate' },
  { href: '/admin-panel/inquiries', label: 'Anfragen' },
  { href: '/admin-panel/invites', label: 'Einladungscodes' },
  { href: '/admin-panel/users', label: 'Mitglieder' },
  { href: '/admin-panel/audit', label: 'Audit-Log' },
];

interface Props {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: Props) {
  const admin = await getAdminOrNull();

  // If no admin cookie, redirect to login (except login page itself)
  // The middleware handles redirect, this is a fallback
  if (!admin) redirect('/admin-panel/login');

  return (
    <div className="flex min-h-screen bg-brand-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-brand-border bg-brand-dark flex flex-col">
        <div className="px-6 py-6 border-b border-brand-border">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold">Admin</p>
          <p className="font-display text-lg text-brand-cream mt-1">Off-Market</p>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2.5 text-sm font-body text-brand-silver hover:text-brand-cream hover:bg-brand-charcoal transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-brand-border">
          <p className="text-xs text-brand-silver font-body mb-2">{admin.email}</p>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="text-xs font-body uppercase tracking-widest text-brand-silver hover:text-brand-gold transition-colors"
            >
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
