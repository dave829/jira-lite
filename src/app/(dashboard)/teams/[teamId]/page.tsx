import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Shield, User, FolderKanban, Users, Activity } from 'lucide-react';
import { TeamActions } from '@/components/teams/team-actions';
import { InviteMemberDialog } from '@/components/teams/invite-member-dialog';
import { MemberActions } from '@/components/teams/member-actions';
import { TeamActivityLog } from '@/components/teams/team-activity-log';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-gray-500">
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
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            멤버
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            프로젝트
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">대기 중인 초대</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{inv.email}</span>
                      <Badge variant="outline">대기 중</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 멤버 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">팀 멤버</CardTitle>
              <CardDescription>{members?.length || 0}명</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members?.map((member) => {
                  const RoleIcon = roleIcons[member.role as keyof typeof roleIcons];
                  const memberUser = Array.isArray(member.user) ? member.user[0] : member.user;
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={memberUser?.profile_image || undefined} />
                          <AvatarFallback>
                            {memberUser?.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{memberUser?.name}</p>
                          <p className="text-sm text-gray-500">{memberUser?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {roleLabels[member.role as keyof typeof roleLabels]}
                        </Badge>
                        {member.user_id !== user.id && (
                          <MemberActions
                            member={member}
                            currentRole={currentMember.role}
                            teamId={teamId}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end">
            <Link href={`/teams/${teamId}/projects/new`}>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                새 프로젝트
              </button>
            </Link>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
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
                      <p className="text-xs text-gray-500">
                        {format(new Date(project.created_at), 'yyyy년 M월 d일', { locale: ko })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">프로젝트가 없습니다</h3>
                <p className="text-gray-500 mb-4">새 프로젝트를 만들어 시작하세요</p>
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
