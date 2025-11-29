'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { issueSchema, type IssueInput } from '@/lib/validations';
import { LIMITS } from '@/lib/constants';
import { ProjectLabel, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface CreateIssueDialogProps {
  projectId: string;
  statusId: string;
  labels: ProjectLabel[];
  teamMembers: User[];
  onClose: () => void;
}

export function CreateIssueDialog({
  projectId,
  statusId,
  labels,
  teamMembers,
  onClose,
}: CreateIssueDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<IssueInput>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      priority: 'MEDIUM',
    },
  });

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

  const onSubmit = async (data: IssueInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      // 프로젝트당 이슈 수 확인
      const { count } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .is('deleted_at', null);

      if (count && count >= LIMITS.MAX_ISSUES_PER_PROJECT) {
        toast.error(`프로젝트당 최대 ${LIMITS.MAX_ISSUES_PER_PROJECT}개의 이슈만 생성할 수 있습니다`);
        return;
      }

      // 현재 상태의 마지막 position 조회
      const { data: lastIssue } = await supabase
        .from('issues')
        .select('position')
        .eq('project_id', projectId)
        .eq('status_id', statusId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = (lastIssue?.position ?? -1) + 1;

      // 이슈 생성
      const { data: issue, error } = await supabase
        .from('issues')
        .insert({
          project_id: projectId,
          title: data.title,
          description: data.description || null,
          status_id: statusId,
          priority: data.priority,
          assignee_id: data.assignee_id || null,
          owner_id: user.id,
          due_date: data.due_date || null,
          position: newPosition,
        })
        .select()
        .single();

      if (error) throw error;

      // 라벨 연결
      if (selectedLabels.length > 0) {
        await supabase.from('issue_labels').insert(
          selectedLabels.map((labelId) => ({
            issue_id: issue.id,
            label_id: labelId,
          }))
        );
      }

      toast.success('이슈가 생성되었습니다');
      onClose();
      router.refresh();
    } catch {
      toast.error('이슈 생성에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>새 이슈</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="이슈 제목을 입력하세요"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="이슈에 대한 설명을 입력하세요"
              rows={4}
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select
                defaultValue="MEDIUM"
                onValueChange={(value) => setValue('priority', value as 'HIGH' | 'MEDIUM' | 'LOW')}
              >
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

            <div className="space-y-2">
              <Label>담당자</Label>
              <Select onValueChange={(value) => setValue('assignee_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">마감일</Label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
            />
          </div>

          {labels.length > 0 && (
            <div className="space-y-2">
              <Label>라벨</Label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant={selectedLabels.includes(label.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={{
                      backgroundColor: selectedLabels.includes(label.id) ? label.color : 'transparent',
                      borderColor: label.color,
                      color: selectedLabels.includes(label.id) ? 'white' : label.color,
                    }}
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                    {selectedLabels.includes(label.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              생성
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
