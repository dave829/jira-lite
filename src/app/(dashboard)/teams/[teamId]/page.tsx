import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderKanban, Users, Activity, ArrowLeft } from 'lucide-react';
import { TeamActions } from '@/components/teams/team-actions';
import { InviteMemberDialog } from '@/components/teams/invite-member-dialog';
import { TeamActivityLog } from '@/components/teams/team-activity-log';
import { MemberList } from '@/components/teams/member-list';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 팀 정보 조회
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .is('deleted_at', null)
    .single();

  if (!team) notFound();

  // 현재 사용자의 팀 멤버십 확인
  const { data: currentMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single();

  if (!currentMember) notFound();

  // 팀 멤버 목록 조회
  const { data: members } = await supabase
    .from('team_members')
    .select(`
      *,
      user:users(id, email, name, profile_image)
    `)
    .eq('team_id', teamId)
    .order('role', { ascending: true });

  // 팀 프로젝트 목록 조회
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // 대기 중인 초대 목록
  const { data: invitations } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString());

  const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(currentMember.role);
  const isOwner = currentMember.role === 'OWNER';

  return (
    <div className="space-y-6">
      <Link
        href="/teams"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        팀 목록으로 돌아가기
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
          <p className="text-muted-foreground">
            {members?.length || 0}명의 멤버 · {projects?.length || 0}개의 프로젝트
          </p>
        </div>
        <TeamActions
          team={team}
          currentRole={currentMember.role}
          isOwner={isOwner}
        />
      </div>

      <Tabs defaultValue="members">
        <TabsList className="bg-accent/50">
          <TabsTrigger value="members" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            멤버
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2 data-[state=active]:bg-background">
            <FolderKanban className="h-4 w-4" />
            프로젝트
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Activity className="h-4 w-4" />
            활동 로그
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {isOwnerOrAdmin && (
            <div className="flex justify-end">
              <InviteMemberDialog teamId={teamId} />
            </div>
          )}

          {/* 대기 중인 초대 */}
          {invitations && invitations.length > 0 && isOwnerOrAdmin && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base text-foreground">대기 중인 초대</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 bg-accent/50 rounded">
                      <span className="text-sm text-foreground">{inv.email}</span>
                      <Badge variant="outline">대기 중</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 멤버 목록 */}
          <MemberList
            members={members || []}
            currentUserId={user.id}
            currentRole={currentMember.role}
            teamId={teamId}
          />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end">
            <Link href={`/teams/${teamId}/projects/new`}>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-foreground text-background hover:bg-foreground/90 h-10 px-4 py-2 transition-colors">
                새 프로젝트
              </button>
            </Link>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="glass-card hover:shadow-lg transition-all cursor-pointer h-full border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                        {project.name}
                        {project.is_archived && (
                          <Badge variant="secondary">아카이브</Badge>
                        )}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(project.created_at), 'yyyy년 M월 d일', { locale: ko })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">프로젝트가 없습니다</h3>
                <p className="text-muted-foreground mb-4">새 프로젝트를 만들어 시작하세요</p>
                <Link href={`/teams/${teamId}/projects/new`}>
                  <button className="px-4 py-2 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                    새 프로젝트 만들기
                  </button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <TeamActivityLog teamId={teamId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
