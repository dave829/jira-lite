'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Issue, ProjectStatus, ProjectLabel, User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { LIMITS } from '@/lib/constants';

interface IssueActionsProps {
  issue: Issue;
  statuses: ProjectStatus[];
  projectLabels: ProjectLabel[];
  teamMembers: User[];
  canDelete: boolean;
}

export function IssueActions({
  issue,
  statuses,
  projectLabels,
  teamMembers,
  canDelete,
}: IssueActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description || '');
  const [statusId, setStatusId] = useState(issue.status_id);
  const [priority, setPriority] = useState(issue.priority);
  const [assigneeId, setAssigneeId] = useState(issue.assignee_id || 'unassigned');
  const [dueDate, setDueDate] = useState(issue.due_date || '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    issue.labels?.map((l) => l.label?.id).filter(Boolean) as string[] || []
  );

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) => {
      if (prev.includes(labelId)) {
        return prev.filter((id) => id !== labelId);
      }
      if (prev.length >= LIMITS.MAX_LABELS_PER_ISSUE) {
        toast.error(`이슈당 최대 ${LIMITS.MAX_LABELS_PER_ISSUE}개의 라벨만 추가할 수 있습니다`);
        return prev;
      }
      return [...prev, labelId];
    });
  };

  const handleUpdate = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // 변경 사항 추적
      const changes: { field: string; old_value: string | null; new_value: string | null }[] = [];

      if (title !== issue.title) {
        changes.push({ field: 'title', old_value: issue.title, new_value: title });
      }
      if (statusId !== issue.status_id) {
        const oldStatus = statuses.find((s) => s.id === issue.status_id);
        const newStatus = statuses.find((s) => s.id === statusId);
        changes.push({ field: 'status', old_value: oldStatus?.name || null, new_value: newStatus?.name || null });
      }
      if (priority !== issue.priority) {
        changes.push({ field: 'priority', old_value: issue.priority, new_value: priority });
      }
      const actualAssigneeId = assigneeId === 'unassigned' ? null : assigneeId;
      if (actualAssigneeId !== issue.assignee_id) {
        const oldAssignee = teamMembers.find((m) => m.id === issue.assignee_id);
        const newAssignee = teamMembers.find((m) => m.id === actualAssigneeId);
        changes.push({ field: 'assignee', old_value: oldAssignee?.name || null, new_value: newAssignee?.name || null });
      }
      if (dueDate !== (issue.due_date || '')) {
        changes.push({ field: 'due_date', old_value: issue.due_date, new_value: dueDate || null });
      }

      // 이슈 업데이트
      const { error } = await supabase
        .from('issues')
        .update({
          title,
          description: description || null,
          status_id: statusId,
          priority,
          assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
          due_date: dueDate || null,
        })
        .eq('id', issue.id);

      if (error) throw error;

      // 라벨 업데이트
      await supabase.from('issue_labels').delete().eq('issue_id', issue.id);
      if (selectedLabels.length > 0) {
        await supabase.from('issue_labels').insert(
          selectedLabels.map((labelId) => ({
            issue_id: issue.id,
            label_id: labelId,
          }))
        );
      }

      // 히스토리 기록
      if (changes.length > 0) {
        await supabase.from('issue_history').insert(
          changes.map((change) => ({
            issue_id: issue.id,
            field: change.field,
            old_value: change.old_value,
            new_value: change.new_value,
            changed_by: user?.id,
          }))
        );
      }

      // description 변경 시 AI 캐시 무효화
      if (description !== (issue.description || '')) {
        await supabase
          .from('ai_cache')
          .update({ invalidated_at: new Date().toISOString() })
          .eq('issue_id', issue.id)
          .in('type', ['summary', 'suggestion']);
      }

      toast.success('이슈가 수정되었습니다');
      setIsEditOpen(false);
      router.refresh();
    } catch {
      toast.error('이슈 수정에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('issues')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', issue.id);

      if (error) throw error;

      toast.success('이슈가 삭제되었습니다');
      router.push(`/projects/${issue.project_id}`);
      router.refresh();
    } catch {
      toast.error('이슈 삭제에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setIsEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          수정
        </Button>
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                이슈 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>이슈 수정</DialogTitle>
            <DialogDescription>이슈 정보를 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>우선순위</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as 'HIGH' | 'MEDIUM' | 'LOW')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">긴급</SelectItem>
                    <SelectItem value="MEDIUM">보통</SelectItem>
                    <SelectItem value="LOW">낮음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>담당자</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">미지정</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>마감일</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            {projectLabels.length > 0 && (
              <div className="space-y-2">
                <Label>라벨</Label>
                <div className="flex flex-wrap gap-2">
                  {projectLabels.map((label) => {
                    const labelId = label.id as string;
                    return (
                      <Badge
                        key={labelId}
                        variant={selectedLabels.includes(labelId) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        style={{
                          backgroundColor: selectedLabels.includes(labelId) ? label.color : 'transparent',
                          borderColor: label.color,
                          color: selectedLabels.includes(labelId) ? 'white' : label.color,
                        }}
                        onClick={() => toggleLabel(labelId)}
                      >
                        {label.name}
                        {selectedLabels.includes(labelId) && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 다이얼로그 */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이슈 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 이슈를 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
