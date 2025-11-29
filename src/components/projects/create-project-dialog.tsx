'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { projectSchema, type ProjectInput } from '@/lib/validations';
import { DEFAULT_STATUSES, LIMITS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateProjectDialogProps {
  teamId: string;
  teamName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ teamId, teamName, open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('deleted_at', null);

      if (count && count >= LIMITS.MAX_PROJECTS_PER_TEAM) {
        toast.error(`팀당 최대 ${LIMITS.MAX_PROJECTS_PER_TEAM}개의 프로젝트만 생성할 수 있습니다`);
        return;
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          team_id: teamId,
          name: data.name,
          description: data.description || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (projectError) {
        console.error('Project creation error:', projectError);
        toast.error(`프로젝트 생성에 실패했습니다: ${projectError.message}`);
        return;
      }

      const statuses = DEFAULT_STATUSES.map((status) => ({
        project_id: project.id,
        ...status,
      }));

      await supabase.from('project_statuses').insert(statuses);

      await supabase.from('activity_logs').insert({
        team_id: teamId,
        actor_id: user.id,
        action: 'project_created',
        target_type: 'project',
        target_id: project.id,
        details: { project_name: data.name },
      });

      toast.success('프로젝트가 생성되었습니다!');
      reset();
      onOpenChange(false);
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (error) {
      console.error('Project creation error:', error);
      toast.error('프로젝트 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 프로젝트</DialogTitle>
          <DialogDescription>{teamName} 팀에 프로젝트를 만듭니다</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">프로젝트 이름</Label>
            <Input
              id="name"
              placeholder="예: 웹사이트 리뉴얼"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="프로젝트에 대한 설명을 입력하세요"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              만들기
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
