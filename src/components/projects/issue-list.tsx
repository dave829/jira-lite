'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Issue, ProjectStatus, ProjectLabel, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateIssueDialog } from './create-issue-dialog';
import { Plus, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';

interface IssueListProps {
  projectId: string;
  issues: Issue[];
  statuses: ProjectStatus[];
  labels: ProjectLabel[];
  teamMembers: (User | null)[];
  isArchived: boolean;
}

export function IssueList({
  projectId,
  issues,
  statuses,
  labels,
  teamMembers,
  isArchived,
}: IssueListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch = issue.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status_id === statusFilter;
    const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const defaultStatusId = statuses.find((s) => s.name === 'Backlog')?.id || statuses[0]?.id;

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="이슈 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="우선순위" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 우선순위</SelectItem>
            <SelectItem value="HIGH">긴급</SelectItem>
            <SelectItem value="MEDIUM">보통</SelectItem>
            <SelectItem value="LOW">낮음</SelectItem>
          </SelectContent>
        </Select>
        {!isArchived && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 이슈
          </Button>
        )}
      </div>

      {/* 이슈 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            이슈 목록 ({filteredIssues.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIssues.length > 0 ? (
            <div className="space-y-2">
              {filteredIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/projects/${projectId}/issues/${issue.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge
                        variant="secondary"
                        className="shrink-0"
                        style={{
                          backgroundColor: `${PRIORITY_COLORS[issue.priority]}20`,
                          color: PRIORITY_COLORS[issue.priority],
                        }}
                      >
                        {PRIORITY_LABELS[issue.priority]}
                      </Badge>
                      <span className="font-medium truncate">{issue.title}</span>
                      {issue.labels && issue.labels.length > 0 && (
                        <div className="flex gap-1 shrink-0">
                          {issue.labels.slice(0, 2).map((il) => (
                            <Badge
                              key={il.label?.id}
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: il.label?.color,
                                color: il.label?.color,
                              }}
                            >
                              {il.label?.name}
                            </Badge>
                          ))}
                          {issue.labels.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{issue.labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {issue.due_date && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(issue.due_date), 'M/d', { locale: ko })}
                        </span>
                      )}
                      <Badge
                        style={{ backgroundColor: issue.status?.color }}
                        className="text-white"
                      >
                        {issue.status?.name}
                      </Badge>
                      {issue.assignee && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={issue.assignee.profile_image || undefined} />
                          <AvatarFallback className="text-xs">
                            {issue.assignee.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? '검색 결과가 없습니다'
                : '이슈가 없습니다'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 이슈 생성 다이얼로그 */}
      {isCreateOpen && defaultStatusId && (
        <CreateIssueDialog
          projectId={projectId}
          statusId={defaultStatusId}
          labels={labels}
          teamMembers={teamMembers.filter((m): m is User => m !== null)}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
    </div>
  );
}
