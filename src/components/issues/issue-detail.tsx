'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Issue, ProjectLabel, ProjectStatus, Comment, IssueHistory, User, AICache } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { IssueActions } from './issue-actions';
import { SubtaskList } from './subtask-list';
import { CommentSection } from './comment-section';
import { IssueHistoryList } from './issue-history-list';
import { AIFeatures } from './ai-features';
import { ArrowLeft, Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';

interface IssueDetailProps {
  issue: Issue & {
    project: { id: string; name: string; team_id: string; is_archived: boolean };
    labels: (ProjectLabel | null)[];
    subtasks: { id: string; title: string; is_completed: boolean; position: number }[];
  };
  projectLabels: ProjectLabel[];
  statuses: ProjectStatus[];
  comments: (Comment & { user: User | null })[];
  history: (IssueHistory & { user: User | null })[];
  teamMembers: (User | null)[];
  aiCache: AICache[];
  currentUserId: string;
  currentUser?: User | null;
  canEdit: boolean;
  canDelete: boolean;
}

export function IssueDetail({
  issue,
  projectLabels,
  statuses,
  comments,
  history,
  teamMembers,
  aiCache,
  currentUserId,
  currentUser,
  canEdit,
  canDelete,
}: IssueDetailProps) {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${issue.project_id}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {issue.project.name}
        </Link>
        {canEdit && (
          <IssueActions
            issue={issue}
            statuses={statuses}
            projectLabels={projectLabels}
            teamMembers={teamMembers.filter((m): m is User => m !== null)}
            canDelete={canDelete}
          />
        )}
      </div>

      {/* 메인 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl">{issue.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  style={{ backgroundColor: issue.status?.color }}
                  className="text-white"
                >
                  {issue.status?.name}
                </Badge>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[issue.priority]}20`,
                    color: PRIORITY_COLORS[issue.priority],
                  }}
                >
                  {PRIORITY_LABELS[issue.priority]}
                </Badge>
                {issue.labels?.filter(Boolean).map((label) => (
                  <Badge
                    key={label!.id}
                    variant="outline"
                    style={{
                      borderColor: label!.color,
                      color: label!.color,
                    }}
                  >
                    {label!.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 설명 */}
          {issue.description ? (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{issue.description}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">설명이 없습니다</p>
          )}

          <Separator />

          {/* 메타 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">담당자</p>
              {issue.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={issue.assignee.profile_image || undefined} />
                    <AvatarFallback>
                      {issue.assignee.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{issue.assignee.name}</span>
                </div>
              ) : (
                <span className="text-gray-400">미지정</span>
              )}
            </div>
            <div>
              <p className="text-gray-500 mb-1">생성자</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={issue.owner?.profile_image || undefined} />
                  <AvatarFallback>
                    {issue.owner?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{issue.owner?.name}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-1">마감일</p>
              {issue.due_date ? (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(issue.due_date), 'yyyy년 M월 d일', { locale: ko })}
                </span>
              ) : (
                <span className="text-gray-400">미설정</span>
              )}
            </div>
            <div>
              <p className="text-gray-500 mb-1">생성일</p>
              <span>
                {format(new Date(issue.created_at), 'yyyy년 M월 d일', { locale: ko })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 기능 */}
      <AIFeatures
        issue={issue}
        aiCache={aiCache}
        commentsCount={comments.length}
      />

      {/* 서브태스크 */}
      <SubtaskList
        issueId={issue.id}
        subtasks={issue.subtasks}
        canEdit={canEdit}
      />

      {/* 탭: 댓글 / 히스토리 */}
      <Tabs defaultValue="comments">
        <TabsList>
          <TabsTrigger value="comments">
            댓글 ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            변경 이력
          </TabsTrigger>
        </TabsList>
        <TabsContent value="comments" className="mt-4">
          <CommentSection
            issueId={issue.id}
            comments={comments}
            currentUserId={currentUserId}
            currentUser={currentUser}
            canEdit={canEdit}
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <IssueHistoryList history={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
