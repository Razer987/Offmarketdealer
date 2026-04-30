import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { COOKIE_ACCESS_TOKEN } from '@/lib/utils/constants';
import { hashToken } from '@/lib/auth/session';

async function getAuthState() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
  if (!token) return { isAuthenticated: false };

  try {
    await verifyAccessToken(token);
    const session = await prisma.userSession.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) return { isAuthenticated: false };
    return { isAuthenticated: true, username: session.user.username };
  } catch {
    return { isAuthenticated: false };
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, username } = await getAuthState();

  return (
    <div className="flex flex-col min-h-screen bg-brand-black">
      <Header isAuthenticated={isAuthenticated} username={username} />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
