import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { IssueDetail } from '@/components/issues/issue-detail';

interface IssuePageProps {
  params: Promise<{ projectId: string; issueId: string }>;
}

export default async function IssuePage({ params }: IssuePageProps) {
  const { projectId, issueId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 이슈 조회
  const { data: issue } = await supabase
    .from('issues')
    .select(`
      *,
      status:project_statuses(id, name, color),
      assignee:users!issues_assignee_id_fkey(id, name, email, profile_image),
      owner:users!issues_owner_id_fkey(id, name, email, profile_image),
      project:projects(id, name, team_id, is_archived)
    `)
    .eq('id', issueId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .single();

  if (!issue) notFound();

  // 팀 멤버십 확인
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', issue.project.team_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) notFound();

  // 라벨 조회
  const { data: issueLabels } = await supabase
    .from('issue_labels')
    .select(`
      label:project_labels(id, name, color)
    `)
    .eq('issue_id', issueId);

  // 프로젝트 라벨 조회
  const { data: projectLabels } = await supabase
    .from('project_labels')
    .select('*')
    .eq('project_id', projectId);

  // 프로젝트 상태 조회
  const { data: statuses } = await supabase
    .from('project_statuses')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  // 서브태스크 조회
  const { data: subtasks } = await supabase
    .from('subtasks')
    .select('*')
    .eq('issue_id', issueId)
    .order('position', { ascending: true });

  // 댓글 조회
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(id, name, email, profile_image)
    `)
    .eq('issue_id', issueId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  // 히스토리 조회
  const { data: history } = await supabase
    .from('issue_history')
    .select(`
      *,
      user:users(id, name, profile_image)
    `)
    .eq('issue_id', issueId)
    .order('changed_at', { ascending: false })
    .limit(20);

  // 팀 멤버 조회
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select(`
      user:users(id, name, email, profile_image)
    `)
    .eq('team_id', issue.project.team_id);

  // AI 캐시 조회
  const { data: aiCache } = await supabase
    .from('ai_cache')
    .select('*')
    .eq('issue_id', issueId)
    .is('invalidated_at', null);

  const canEdit = !issue.project.is_archived;
  const canDelete =
    issue.owner_id === user.id ||
    membership.role === 'OWNER' ||
    membership.role === 'ADMIN';

  // 현재 사용자 정보 조회
  const { data: currentUser } = await supabase
    .from('users')
    .select('id, name, email, profile_image')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <IssueDetail
      issue={{
        ...issue,
        labels: issueLabels?.map((il) => il.label) || [],
        subtasks: subtasks || [],
      }}
      projectLabels={projectLabels || []}
      statuses={statuses || []}
      comments={comments || []}
      history={history || []}
      teamMembers={teamMembers?.map((tm) => tm.user).filter(Boolean) || []}
      aiCache={aiCache || []}
      currentUserId={user.id}
      currentUser={currentUser}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
