import { auth0 } from '@/lib/auth0';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session || !session.user) {
    redirect('/auth/login');
  }

  return (
    <DashboardClient userEmail={session.user.email || 'user@weathercomfort.com'} />
  );
}
