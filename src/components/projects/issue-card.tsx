'use client';

import Link from 'next/link';
import { Issue } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';

interface IssueCardProps {
  issue: Issue;
  projectId: string;
}

export function IssueCard({ issue, projectId }: IssueCardProps) {
  const completedSubtasks = issue.subtasks?.filter((s) => s.is_completed).length || 0;
  const totalSubtasks = issue.subtasks?.length || 0;

  return (
    <Link href={`/projects/${projectId}/issues/${issue.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-3 space-y-2">
          {/* 라벨 */}
          {issue.labels && issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {issue.labels.map((il) => (
                <Badge
                  key={il.label?.id}
                  variant="outline"
                  className="text-xs px-1.5 py-0"
                  style={{
                    borderColor: il.label?.color,
                    color: il.label?.color,
                  }}
                >
                  {il.label?.name}
                </Badge>
              ))}
            </div>
          )}

          {/* 제목 */}
          <p className="font-medium text-sm line-clamp-2">{issue.title}</p>

          {/* 메타 정보 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {/* 우선순위 */}
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0"
                style={{
                  backgroundColor: `${PRIORITY_COLORS[issue.priority]}20`,
                  color: PRIORITY_COLORS[issue.priority],
                }}
              >
                {PRIORITY_LABELS[issue.priority]}
              </Badge>

              {/* 마감일 */}
              {issue.due_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(issue.due_date), 'M/d', { locale: ko })}
                </span>
              )}

              {/* 서브태스크 */}
              {totalSubtasks > 0 && (
                <span className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </div>

            {/* 담당자 */}
            {issue.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={issue.assignee.profile_image || undefined} />
                <AvatarFallback className="text-xs">
                  {issue.assignee.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
