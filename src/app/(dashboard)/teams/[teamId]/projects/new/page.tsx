'use client';

import { useState, use } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface NewProjectPageProps {
  params: Promise<{ teamId: string }>;
}

export default function NewProjectPage({ params }: NewProjectPageProps) {
  const { teamId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
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

      // 팀당 프로젝트 수 확인
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .is('deleted_at', null);

      if (count && count >= LIMITS.MAX_PROJECTS_PER_TEAM) {
        toast.error(`팀당 최대 ${LIMITS.MAX_PROJECTS_PER_TEAM}개의 프로젝트만 생성할 수 있습니다`);
        return;
      }

      // 프로젝트 생성
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
        toast.error('프로젝트 생성에 실패했습니다');
        return;
      }

      // 기본 상태 생성
      const statuses = DEFAULT_STATUSES.map((status) => ({
        project_id: project.id,
        ...status,
      }));

      await supabase.from('project_statuses').insert(statuses);

      // 활동 로그
      await supabase.from('activity_logs').insert({
        team_id: teamId,
        actor_id: user.id,
        action: 'project_created',
        target_type: 'project',
        target_id: project.id,
        details: { project_name: data.name },
      });

      toast.success('프로젝트가 생성되었습니다!');
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch {
      toast.error('프로젝트 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href={`/teams/${teamId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          팀으로 돌아가기
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>새 프로젝트</CardTitle>
          <CardDescription>프로젝트를 만들어 이슈를 관리하세요</CardDescription>
        </CardHeader>
        <CardContent>
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
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                프로젝트 만들기
              </Button>
              <Link href={`/teams/${teamId}`}>
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
