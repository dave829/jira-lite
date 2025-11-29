'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { FolderKanban, Star, Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CreateProjectDialog } from './create-project-dialog';

interface Team {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  created_at: string;
  team: Team | null;
}

interface ProjectsPageClientProps {
  projects: Project[];
  teams: Team[];
  favoriteIds: Set<string>;
}

export function ProjectsPageClient({ projects, teams, favoriteIds }: ProjectsPageClientProps) {
  const [teamSelectOpen, setTeamSelectOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setTeamSelectOpen(false);
    setCreateProjectOpen(true);
  };

  const handleCreateClick = () => {
    if (teams.length === 1) {
      setSelectedTeam(teams[0]);
      setCreateProjectOpen(true);
    } else {
      setTeamSelectOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">프로젝트</h1>
          <p className="text-muted-foreground">모든 프로젝트를 확인하세요</p>
        </div>
        {teams.length > 0 && (
          <Button onClick={handleCreateClick} className="bg-foreground text-background hover:bg-foreground/90">
            <Plus className="h-4 w-4 mr-2" />
            프로젝트 만들기
          </Button>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
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
      ) : teams.length > 0 ? (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">프로젝트가 없습니다</h3>
            <p className="text-muted-foreground mb-4">새 프로젝트를 만들어 시작하세요</p>
            <Button onClick={handleCreateClick} className="bg-foreground text-background hover:bg-foreground/90">
              <Plus className="h-4 w-4 mr-2" />
              프로젝트 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">프로젝트가 없습니다</h3>
            <p className="text-muted-foreground mb-4">먼저 팀을 만들어 시작하세요</p>
            <Link href="/teams/new">
              <Button className="bg-foreground text-background hover:bg-foreground/90">
                <Plus className="h-4 w-4 mr-2" />
                새 팀 만들기
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 팀 선택 다이얼로그 */}
      <Dialog open={teamSelectOpen} onOpenChange={setTeamSelectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀 선택</DialogTitle>
            <DialogDescription>프로젝트를 만들 팀을 선택하세요</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleTeamSelect(team)}
              >
                <CardContent className="p-4">
                  <p className="font-medium">{team.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 프로젝트 생성 다이얼로그 */}
      {selectedTeam && (
        <CreateProjectDialog
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          open={createProjectOpen}
          onOpenChange={setCreateProjectOpen}
        />
      )}
    </div>
  );
}
