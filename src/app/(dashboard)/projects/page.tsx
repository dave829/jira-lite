import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Star } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 내가 속한 팀 ID 조회
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id);

  const teamIds = teamMembers?.map(tm => tm.team_id) || [];

  // 프로젝트 조회
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      team:teams(id, name)
    `)
    .in('team_id', teamIds)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">프로젝트</h1>
        <p className="text-muted-foreground">모든 프로젝트를 확인하세요</p>
      </div>

      {sortedProjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="glass-card hover:shadow-lg transition-all cursor-pointer h-full border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      {favoriteIds.has(project.id) && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                      {project.name}
                    </CardTitle>
                    {project.is_archived && (
                      <Badge variant="secondary">아카이브</Badge>
                    )}
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project.team?.name}</span>
                    <span>{format(new Date(project.created_at), 'M월 d일', { locale: ko })}</span>
                  </div>
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
            <p className="text-muted-foreground mb-4">팀에서 새 프로젝트를 만들어 시작하세요</p>
            <Link href="/teams/new">
              <button className="px-4 py-2 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                새 팀 만들기
              </button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
