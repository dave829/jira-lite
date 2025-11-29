'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ActivityLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TeamActivityLogProps {
  teamId: string;
}

const actionLabels: Record<string, string> = {
  member_joined: '팀에 가입했습니다',
  member_left: '팀에서 탈퇴했습니다',
  member_kicked: '팀에서 퇴장되었습니다',
  role_changed: '역할이 변경되었습니다',
  project_created: '프로젝트를 생성했습니다',
  project_deleted: '프로젝트를 삭제했습니다',
  project_archived: '프로젝트를 아카이브했습니다',
  team_updated: '팀 정보를 수정했습니다',
  team_created: '팀을 생성했습니다',
};

export function TeamActivityLog({ teamId }: TeamActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const fetchLogs = async (pageNum: number) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        actor:users!activity_logs_actor_id_fkey(id, name, email, profile_image)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }

    return data || [];
  };

  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      const data = await fetchLogs(0);
      setLogs(data);
      setHasMore(data.length === pageSize);
      setIsLoading(false);
    };
    loadInitial();
  }, [teamId]);

  const loadMore = async () => {
    const nextPage = page + 1;
    const data = await fetchLogs(nextPage);
    setLogs([...logs, ...data]);
    setPage(nextPage);
    setHasMore(data.length === pageSize);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">활동 로그</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={log.actor?.profile_image || undefined} />
                  <AvatarFallback>
                    {log.actor?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.actor?.name}</span>
                    {' '}
                    <span className="text-gray-600">
                      {actionLabels[log.action] || log.action}
                    </span>
                    {log.details && typeof log.details === 'object' && (
                      <>
                        {(log.details as Record<string, unknown>).project_name && (
                          <span className="font-medium">
                            {' '}&quot;{(log.details as Record<string, unknown>).project_name as string}&quot;
                          </span>
                        )}
                        {(log.details as Record<string, unknown>).team_name && (
                          <span className="font-medium">
                            {' '}&quot;{(log.details as Record<string, unknown>).team_name as string}&quot;
                          </span>
                        )}
                        {(log.details as Record<string, unknown>).new_role && (
                          <span className="text-gray-500">
                            {' '}→ {(log.details as Record<string, unknown>).new_role as string}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(log.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                더 보기
              </button>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">활동 로그가 없습니다</p>
        )}
      </CardContent>
    </Card>
  );
}
