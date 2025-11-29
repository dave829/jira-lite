import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Crown, Shield, User } from 'lucide-react';
import Link from 'next/link';

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

const roleLabels = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MEMBER: '멤버',
};

export default async function TeamsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 내가 속한 팀 조회 (삭제되지 않은 팀만)
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select(`
      role,
      team:teams!inner(
        id,
        name,
        owner_id,
        created_at,
        deleted_at
      )
    `)
    .eq('user_id', user.id);

  // 각 팀의 멤버 수 조회 (삭제되지 않은 팀만 필터링)
  const teams = await Promise.all(
    (teamMembers || [])
      .filter((tm) => {
        const team = Array.isArray(tm.team) ? tm.team[0] : tm.team;
        return team && !team.deleted_at;
      })
      .map(async (tm) => {
        const team = Array.isArray(tm.team) ? tm.team[0] : tm.team;
        const { count } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team?.id);
        
        return {
          ...team,
          role: tm.role,
          memberCount: count || 0,
        };
      })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">팀</h1>
          <p className="text-muted-foreground">소속된 팀을 관리하세요</p>
        </div>
        {teams.length > 0 && (
          <Link href="/teams/new">
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              <Plus className="h-4 w-4 mr-2" />
              새 팀 만들기
            </Button>
          </Link>
        )}
      </div>

      {teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const RoleIcon = roleIcons[team.role as keyof typeof roleIcons];
            return (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="glass-card hover:shadow-lg transition-all cursor-pointer h-full border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-foreground">{team.name}</CardTitle>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[team.role as keyof typeof roleLabels]}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {team.memberCount}명의 멤버
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">아직 팀이 없습니다</h3>
            <p className="text-muted-foreground mb-4">새 팀을 만들어 프로젝트를 시작하세요</p>
            <Link href="/teams/new">
              <Button className="bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-4 w-4 mr-2" />
                새 팀 만들기
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
