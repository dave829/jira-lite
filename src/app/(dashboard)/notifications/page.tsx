import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NotificationList } from '@/components/notifications/notification-list';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">알림</h1>
        <p className="text-gray-500">최근 알림을 확인하세요</p>
      </div>

      <NotificationList
        notifications={notifications || []}
        userId={user.id}
      />
    </div>
  );
}
