'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, CheckCheck, User, MessageSquare, Calendar, Users, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NotificationListProps {
  notifications: Notification[];
  userId: string;
}

const typeIcons = {
  issue_assigned: User,
  comment_added: MessageSquare,
  due_date_approaching: Calendar,
  due_date_today: Calendar,
  team_invitation: Users,
  role_changed: Shield,
};

export function NotificationList({ notifications, userId }: NotificationListProps) {
  const router = useRouter();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    router.refresh();
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      toast.success('모든 알림을 읽음 처리했습니다');
      router.refresh();
    } catch {
      toast.error('처리에 실패했습니다');
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          알림 {unreadCount > 0 && `(${unreadCount})`}
        </CardTitle>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            모두 읽음
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    notification.is_read ? 'bg-white' : 'bg-blue-50'
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className={`p-2 rounded-full ${notification.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    <Icon className={`h-4 w-4 ${notification.is_read ? 'text-gray-500' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {notification.link ? (
                      <Link href={notification.link} className="hover:underline">
                        <p className="font-medium text-sm">{notification.title}</p>
                      </Link>
                    ) : (
                      <p className="font-medium text-sm">{notification.title}</p>
                    )}
                    {notification.content && (
                      <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notification.created_at), 'M월 d일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">알림이 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
