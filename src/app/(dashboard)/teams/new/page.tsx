'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { teamSchema, type TeamInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTeamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
  });

  const onSubmit = async (data: TeamInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      // 팀 생성
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: data.name,
          owner_id: user.id,
        })
        .select()
        .single();

      if (teamError) {
        toast.error('팀 생성에 실패했습니다');
        return;
      }

      // 팀 멤버로 OWNER 추가
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'OWNER',
        });

      if (memberError) {
        toast.error('팀 멤버 추가에 실패했습니다');
        return;
      }

      // 활동 로그 기록
      await supabase.from('activity_logs').insert({
        team_id: team.id,
        actor_id: user.id,
        action: 'team_created',
        target_type: 'team',
        target_id: team.id,
        details: { team_name: data.name },
      });

      toast.success('팀이 생성되었습니다!');
      router.push(`/teams/${team.id}`);
      router.refresh();
    } catch {
      toast.error('팀 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/teams" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          팀 목록으로
        </Link>
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">새 팀 만들기</CardTitle>
          <CardDescription>팀을 만들어 프로젝트를 함께 관리하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">팀 이름</Label>
              <Input
                id="name"
                placeholder="예: 개발팀"
                className="bg-background/50 border-border"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="bg-foreground text-background hover:bg-foreground/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                팀 만들기
              </Button>
              <Link href="/teams">
                <Button type="button" variant="outline" className="border-border">
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
