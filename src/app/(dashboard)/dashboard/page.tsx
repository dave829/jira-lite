import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 내가 속한 팀 조회
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id, teams(id, name)')
    .eq('user_id', user.id);

  const teamIds = teamMembers?.map(tm => tm.team_id) || [];

  // 내가 담당한 이슈 조회
  const { data: myIssues } = await supabase
    .from('issues')
    .select(`
      *,
      project:projects(id, name, team_id),
      status:project_statuses(name, color)
    `)
    .eq('assignee_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10);

  // 마감 임박 이슈 (7일 이내)
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  
  const { data: upcomingIssues } = await supabase
    .from('issues')
    .select(`
      *,
      project:projects(id, name),
      status:project_statuses(name, color)
    `)
    .eq('assignee_id', user.id)
    .is('deleted_at', null)
    .not('due_date', 'is', null)
    .lte('due_date', sevenDaysLater.toISOString())
    .gte('due_date', new Date().toISOString())
    .order('due_date', { ascending: true })
    .limit(5);

  // 통계
  const totalIssues = myIssues?.length || 0;
  const completedIssues = myIssues?.filter(i => i.status?.name === 'Done').length || 0;
  const inProgressIssues = myIssues?.filter(i => i.status?.name === 'In Progress').length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        <p className="text-muted-foreground">오늘의 작업 현황을 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">내 팀</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{teamIds.length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">담당 이슈</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalIssues}</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">진행 중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{inProgressIssues}</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{completedIssues}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 마감 임박 이슈 */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              마감 임박 이슈
            </CardTitle>
            <CardDescription>7일 이내 마감 예정</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingIssues && upcomingIssues.length > 0 ? (
              <div className="space-y-3">
                {upcomingIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.project_id}/issues/${issue.id}`}
                    className="block p-3 rounded-lg border border-border/50 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate text-foreground">{issue.title}</span>
                      <Badge variant="outline" className="ml-2">
                        {issue.due_date && format(new Date(issue.due_date), 'M/d', { locale: ko })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {issue.project?.name}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                마감 임박 이슈가 없습니다
              </p>
            )}
          </CardContent>
        </Card>

        {/* 내 이슈 목록 */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">내 이슈</CardTitle>
            <CardDescription>담당 중인 이슈 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {myIssues && myIssues.length > 0 ? (
              <div className="space-y-3">
                {myIssues.slice(0, 5).map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.project_id}/issues/${issue.id}`}
                    className="block p-3 rounded-lg border border-border/50 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate text-foreground">{issue.title}</span>
                      {issue.status && (
                        <Badge
                          style={{ backgroundColor: issue.status.color }}
                          className="text-white ml-2"
                        >
                          {issue.status.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {issue.project?.name}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                담당 이슈가 없습니다
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
