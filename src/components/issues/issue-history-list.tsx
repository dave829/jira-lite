'use client';

import { IssueHistory, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface IssueHistoryListProps {
  history: (IssueHistory & { user: User | null })[];
}

const fieldLabels: Record<string, string> = {
  status: '상태',
  priority: '우선순위',
  assignee: '담당자',
  title: '제목',
  due_date: '마감일',
};

export function IssueHistoryList({ history }: IssueHistoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">변경 이력</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.user?.profile_image || undefined} />
                  <AvatarFallback>
                    {item.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{item.user?.name}</span>
                    님이{' '}
                    <span className="font-medium">
                      {fieldLabels[item.field] || item.field}
                    </span>
                    을(를) 변경했습니다
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="line-through">{item.old_value || '없음'}</span>
                    <span>→</span>
                    <span className="font-medium text-gray-700">
                      {item.new_value || '없음'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(item.changed_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">변경 이력이 없습니다</p>
        )}
      </CardContent>
    </Card>
  );
}
