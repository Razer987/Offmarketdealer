import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { COOKIE_ACCESS_TOKEN } from '@/lib/utils/constants';
import { hashToken } from '@/lib/auth/session';

async function requireUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
  if (!token) redirect('/login');

  try {
    await verifyAccessToken(token);
    const session = await prisma.userSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') {
      redirect('/login');
    }
    return session.user;
  } catch {
    redirect('/login');
  }
}

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex flex-col min-h-screen bg-brand-black">
      <Header isAuthenticated username={user.username} />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
