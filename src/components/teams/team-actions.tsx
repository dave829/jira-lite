'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Team } from '@/types';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Trash2, LogOut, Loader2 } from 'lucide-react';

interface TeamActionsProps {
  team: Team;
  currentRole: string;
  isOwner: boolean;
}

export function TeamActions({ team, currentRole, isOwner }: TeamActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teamName, setTeamName] = useState(team.name);

  const handleUpdate = async () => {
    if (!teamName.trim()) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('teams')
        .update({ name: teamName })
        .eq('id', team.id);

      if (error) throw error;

      toast.success('팀 이름이 변경되었습니다');
      setIsEditOpen(false);
      router.refresh();
    } catch {
      toast.error('팀 이름 변경에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('teams')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', team.id);

      if (error) throw error;

      toast.success('팀이 삭제되었습니다');
      router.push('/teams');
      router.refresh();
    } catch {
      toast.error('팀 삭제에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('팀에서 탈퇴했습니다');
      router.push('/teams');
      router.refresh();
    } catch {
      toast.error('팀 탈퇴에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = ['OWNER', 'ADMIN'].includes(currentRole);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              팀 이름 수정
            </DropdownMenuItem>
          )}
          {!isOwner && (
            <DropdownMenuItem onClick={() => setIsLeaveOpen(true)} className="text-orange-600">
              <LogOut className="mr-2 h-4 w-4" />
              팀 탈퇴
            </DropdownMenuItem>
          )}
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                팀 삭제
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 팀 이름 수정 다이얼로그 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">팀 이름 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-foreground">팀 이름</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-background/50 border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-border">
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading} className="bg-foreground text-background hover:bg-foreground/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀 삭제 다이얼로그 */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">팀 삭제</DialogTitle>
            <DialogDescription>
              정말로 &quot;{team.name}&quot; 팀을 삭제하시겠습니까?
              <br />
              팀의 모든 프로젝트와 이슈가 함께 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="border-border">
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀 탈퇴 다이얼로그 */}
      <Dialog open={isLeaveOpen} onOpenChange={setIsLeaveOpen}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">팀 탈퇴</DialogTitle>
            <DialogDescription>
              정말로 &quot;{team.name}&quot; 팀에서 탈퇴하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeaveOpen(false)} className="border-border">
              취소
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              탈퇴
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
