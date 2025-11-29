import { createClient } from '@/lib/supabase/server';
import { ProjectsPageClient } from '@/components/projects/projects-page-client';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 내가 속한 팀 조회
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select(`
      team:teams!inner(id, name, deleted_at)
    `)
    .eq('user_id', user.id);

  const teams = (teamMembers || [])
    .map(tm => {
      const team = Array.isArray(tm.team) ? tm.team[0] : tm.team;
      return team;
    })
    .filter(team => team && !team.deleted_at)
    .map(team => ({ id: team.id, name: team.name }));

  const teamIds = teams.map(t => t.id);

  // 프로젝트 조회
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      team:teams(id, name)
    `)
    .in('team_id', teamIds.length > 0 ? teamIds : [''])
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // 즐겨찾기 조회
  const { data: favorites } = await supabase
    .from('project_favorites')
    .select('project_id')
    .eq('user_id', user.id);

  const favoriteIds = new Set(favorites?.map(f => f.project_id) || []);

  // 즐겨찾기 프로젝트 우선 정렬
  const sortedProjects = [...(projects || [])].sort((a, b) => {
    const aFav = favoriteIds.has(a.id) ? 1 : 0;
    const bFav = favoriteIds.has(b.id) ? 1 : 0;
    return bFav - aFav;
  });

  const formattedProjects = sortedProjects.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    is_archived: p.is_archived,
    created_at: p.created_at,
    team: p.team ? { id: p.team.id, name: p.team.name } : null,
  }));

  return (
    <ProjectsPageClient
      projects={formattedProjects}
      teams={teams}
      favoriteIds={favoriteIds}
    />
  );
}
