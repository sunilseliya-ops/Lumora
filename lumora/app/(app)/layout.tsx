import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div
      style={{
        background: '#060912',
        minHeight: '100vh',
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        position: 'relative',
      }}
    >
      {children}
      <BottomNav />
    </div>
  );
}
