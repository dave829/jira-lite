'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Star, MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProjectHeaderProps {
  project: Project & { team: { id: string; name: string } };
  isFavorite: boolean;
  canEdit: boolean;
  currentUserId: string;
}

export function ProjectHeader({ project, isFavorite, canEdit, currentUserId }: ProjectHeaderProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(isFavorite);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');

  const toggleFavorite = async () => {
    const supabase = createClient();
    
    if (favorite) {
      await supabase
        .from('project_favorites')
        .delete()
        .eq('project_id', project.id)
        .eq('user_id', currentUserId);
    } else {
      await supabase
        .from('project_favorites')
        .insert({ project_id: project.id, user_id: currentUserId });
    }
    
    setFavorite(!favorite);
    toast.success(favorite ? '즐겨찾기 해제' : '즐겨찾기 추가');
  };

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('projects')
        .update({ name, description: description || null })
        .eq('id', project.id);

      if (error) throw error;

      toast.success('프로젝트가 수정되었습니다');
      setIsEditOpen(false);
      router.refresh();
    } catch {
      toast.error('프로젝트 수정에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('projects')
        .update({ is_archived: !project.is_archived })
        .eq('id', project.id);

      if (error) throw error;

      toast.success(project.is_archived ? '프로젝트가 복원되었습니다' : '프로젝트가 아카이브되었습니다');
      router.refresh();
    } catch {
      toast.error('작업에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', project.id);

      if (error) throw error;

      toast.success('프로젝트가 삭제되었습니다');
      router.push(`/teams/${project.team_id}`);
      router.refresh();
    } catch {
      toast.error('프로젝트 삭제에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/teams/${project.team_id}`} className="hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              {project.team.name}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.is_archived && (
              <Badge variant="secondary">아카이브</Badge>
            )}
          </div>
          {project.description && (
            <p className="text-gray-500 mt-1">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
          >
            <Star className={`h-5 w-5 ${favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  프로젝트 수정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  {project.is_archived ? (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      아카이브 해제
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      아카이브
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  프로젝트 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">프로젝트 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 다이얼로그 */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              정말로 &quot;{project.name}&quot; 프로젝트를 삭제하시겠습니까?
              <br />
              모든 이슈와 댓글이 함께 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
