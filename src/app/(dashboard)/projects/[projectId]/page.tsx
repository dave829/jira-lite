import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from '@/components/projects/kanban-board';
import { IssueList } from '@/components/projects/issue-list';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectDashboard } from '@/components/projects/project-dashboard';
import { LayoutGrid, List, BarChart3 } from 'lucide-react';

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 프로젝트 정보 조회
  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      team:teams(id, name, owner_id)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .single();

  if (!project) notFound();

  // 팀 멤버십 확인
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', project.team_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) notFound();

  // 프로젝트 상태 조회
  const { data: statuses } = await supabase
    .from('project_statuses')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  // 이슈 조회
  const { data: issues } = await supabase
    .from('issues')
    .select(`
      *,
      status:project_statuses(id, name, color, position),
      assignee:users!issues_assignee_id_fkey(id, name, email, profile_image),
      owner:users!issues_owner_id_fkey(id, name, email),
      labels:issue_labels(
        label:project_labels(id, name, color)
      ),
      subtasks(id, is_completed)
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('position', { ascending: true });

  // 라벨 조회
  const { data: labels } = await supabase
    .from('project_labels')
    .select('*')
    .eq('project_id', projectId);

  // 팀 멤버 조회 (담당자 지정용)
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select(`
      user:users(id, name, email, profile_image)
    `)
    .eq('team_id', project.team_id);

  // 즐겨찾기 여부
  const { data: favorite } = await supabase
    .from('project_favorites')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  const canEdit = membership.role !== 'MEMBER' || project.owner_id === user.id;

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        isFavorite={!!favorite}
        canEdit={canEdit}
        currentUserId={user.id}
      />

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            칸반 보드
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            리스트
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            대시보드
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <KanbanBoard
            projectId={projectId}
            statuses={statuses || []}
            issues={issues || []}
            labels={labels || []}
            teamMembers={teamMembers?.map(tm => tm.user) || []}
            isArchived={project.is_archived}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <IssueList
            projectId={projectId}
            issues={issues || []}
            statuses={statuses || []}
            labels={labels || []}
            teamMembers={teamMembers?.map(tm => tm.user) || []}
            isArchived={project.is_archived}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <ProjectDashboard
            issues={issues || []}
            statuses={statuses || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
