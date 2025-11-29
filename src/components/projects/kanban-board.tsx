'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase/client';
import { Issue, ProjectStatus, ProjectLabel, User } from '@/types';
import { IssueCard } from './issue-card';
import { CreateIssueDialog } from '@/components/projects/create-issue-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface KanbanBoardProps {
  projectId: string;
  statuses: ProjectStatus[];
  issues: Issue[];
  labels: ProjectLabel[];
  teamMembers: (User | null)[];
  isArchived: boolean;
}

export function KanbanBoard({
  projectId,
  statuses,
  issues,
  labels,
  teamMembers,
  isArchived,
}: KanbanBoardProps) {
  const router = useRouter();
  const [localIssues, setLocalIssues] = useState(issues);
  const [createStatusId, setCreateStatusId] = useState<string | null>(null);

  // issues prop이 변경되면 localIssues 동기화
  useEffect(() => {
    setLocalIssues(issues);
  }, [issues]);

  const getIssuesByStatus = (statusId: string) => {
    return localIssues
      .filter((issue) => issue.status_id === statusId)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || isArchived) return;

    const { source, destination, draggableId } = result;
    const issueId = draggableId;

    // 같은 위치면 무시
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatusId = destination.droppableId;
    const newPosition = destination.index;

    // 낙관적 업데이트
    setLocalIssues((prev) => {
      const updated = [...prev];
      const issueIndex = updated.findIndex((i) => i.id === issueId);
      if (issueIndex === -1) return prev;

      const issue = { ...updated[issueIndex] };
      issue.status_id = newStatusId;
      issue.position = newPosition;
      updated[issueIndex] = issue;

      // 같은 상태의 다른 이슈들 position 재정렬
      const sameStatusIssues = updated
        .filter((i) => i.status_id === newStatusId && i.id !== issueId)
        .sort((a, b) => a.position - b.position);

      sameStatusIssues.splice(newPosition, 0, issue);
      sameStatusIssues.forEach((i, idx) => {
        const targetIndex = updated.findIndex((u) => u.id === i.id);
        if (targetIndex !== -1) {
          updated[targetIndex] = { ...updated[targetIndex], position: idx };
        }
      });

      return updated;
    });

    // 서버 업데이트
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // 이슈 상태 및 위치 업데이트
      await supabase
        .from('issues')
        .update({
          status_id: newStatusId,
          position: newPosition,
        })
        .eq('id', issueId);

      // 상태 변경 시 히스토리 기록
      if (source.droppableId !== destination.droppableId) {
        const oldStatus = statuses.find((s) => s.id === source.droppableId);
        const newStatus = statuses.find((s) => s.id === destination.droppableId);

        await supabase.from('issue_history').insert({
          issue_id: issueId,
          field: 'status',
          old_value: oldStatus?.name,
          new_value: newStatus?.name,
          changed_by: user?.id,
        });
      }

      router.refresh();
    } catch {
      toast.error('이슈 이동에 실패했습니다');
      setLocalIssues(issues); // 롤백
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const statusIssues = getIssuesByStatus(status.id);
          const wipLimit = status.wip_limit;
          const isOverLimit = wipLimit && statusIssues.length > wipLimit;

          return (
            <div
              key={status.id}
              className="flex-shrink-0 w-80 bg-gray-100 rounded-lg"
            >
              {/* 컬럼 헤더 */}
              <div
                className={`p-3 border-b-2 rounded-t-lg ${
                  isOverLimit ? 'bg-red-100 border-red-400' : ''
                }`}
                style={{ borderColor: isOverLimit ? undefined : status.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="font-medium">{status.name}</span>
                    <span className="text-sm text-gray-500">
                      {statusIssues.length}
                      {wipLimit && `/${wipLimit}`}
                    </span>
                  </div>
                  {!isArchived && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setCreateStatusId(status.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isOverLimit && (
                  <p className="text-xs text-red-600 mt-1">WIP 제한 초과</p>
                )}
              </div>

              {/* 이슈 목록 */}
              <Droppable droppableId={status.id} isDropDisabled={isArchived}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-2 min-h-[200px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                  >
                    {statusIssues.map((issue, index) => (
                      <Draggable
                        key={issue.id}
                        draggableId={issue.id}
                        index={index}
                        isDragDisabled={isArchived}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 ${
                              snapshot.isDragging ? 'rotate-2' : ''
                            }`}
                          >
                            <IssueCard issue={issue} projectId={projectId} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>

      {/* 이슈 생성 다이얼로그 */}
      {createStatusId && (
        <CreateIssueDialog
          projectId={projectId}
          statusId={createStatusId}
          labels={labels}
          teamMembers={teamMembers.filter((m): m is User => m !== null)}
          onClose={() => setCreateStatusId(null)}
        />
      )}
    </DragDropContext>
  );
}
