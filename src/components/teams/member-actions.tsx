'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TeamMember } from '@/types';
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
import { toast } from 'sonner';
import { MoreHorizontal, Shield, User, UserMinus, Crown, Loader2 } from 'lucide-react';

interface MemberActionsProps {
  member: TeamMember;
  currentRole: string;
  teamId: string;
}

export function MemberActions({ member, currentRole, teamId }: MemberActionsProps) {
  const router = useRouter();
  const [isKickOpen, setIsKickOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = currentRole === 'OWNER';
  const isAdmin = currentRole === 'ADMIN';
  const targetIsOwner = member.role === 'OWNER';
  const targetIsAdmin = member.role === 'ADMIN';

  // OWNER는 모든 멤버 관리 가능, ADMIN은 MEMBER만 관리 가능
  const canManage = isOwner || (isAdmin && member.role === 'MEMBER');
  const canChangeRole = isOwner && !targetIsOwner;
  const canKick = (isOwner && !targetIsOwner) || (isAdmin && member.role === 'MEMBER');
  const canTransferOwnership = isOwner && targetIsAdmin;

  const handleRoleChange = async (newRole: 'ADMIN' | 'MEMBER') => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', member.id);

      if (error) throw error;

      // 활동 로그
      await supabase.from('activity_logs').insert({
        team_id: teamId,
        actor_id: user?.id,
        action: 'role_changed',
        target_type: 'member',
        target_id: member.user_id,
        details: { old_role: member.role, new_role: newRole },
      });

      toast.success('역할이 변경되었습니다');
      router.refresh();
    } catch {
      toast.error('역할 변경에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKick = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      // 활동 로그
      await supabase.from('activity_logs').insert({
        team_id: teamId,
        actor_id: user?.id,
        action: 'member_kicked',
        target_type: 'member',
        target_id: member.user_id,
        details: { member_name: member.user?.name },
      });

      toast.success('멤버가 퇴장되었습니다');
      setIsKickOpen(false);
      router.refresh();
    } catch {
      toast.error('멤버 퇴장에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // 현재 OWNER를 ADMIN으로 변경
      await supabase
        .from('team_members')
        .update({ role: 'ADMIN' })
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      // 대상을 OWNER로 변경
      await supabase
        .from('team_members')
        .update({ role: 'OWNER' })
        .eq('id', member.id);

      // 팀 owner_id 업데이트
      await supabase
        .from('teams')
        .update({ owner_id: member.user_id })
        .eq('id', teamId);

      // 활동 로그
      await supabase.from('activity_logs').insert({
        team_id: teamId,
        actor_id: user.id,
        action: 'role_changed',
        target_type: 'member',
        target_id: member.user_id,
        details: { old_role: 'ADMIN', new_role: 'OWNER', ownership_transferred: true },
      });

      toast.success('소유권이 이전되었습니다');
      setIsTransferOpen(false);
      router.refresh();
    } catch {
      toast.error('소유권 이전에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManage) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canChangeRole && (
            <>
              {member.role === 'MEMBER' && (
                <DropdownMenuItem onClick={() => handleRoleChange('ADMIN')}>
                  <Shield className="mr-2 h-4 w-4" />
                  관리자로 승격
                </DropdownMenuItem>
              )}
              {member.role === 'ADMIN' && (
                <DropdownMenuItem onClick={() => handleRoleChange('MEMBER')}>
                  <User className="mr-2 h-4 w-4" />
                  멤버로 강등
                </DropdownMenuItem>
              )}
            </>
          )}
          {canTransferOwnership && (
            <DropdownMenuItem onClick={() => setIsTransferOpen(true)}>
              <Crown className="mr-2 h-4 w-4" />
              소유권 이전
            </DropdownMenuItem>
          )}
          {canKick && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsKickOpen(true)} className="text-red-600">
                <UserMinus className="mr-2 h-4 w-4" />
                강제 퇴장
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 강제 퇴장 다이얼로그 */}
      <Dialog open={isKickOpen} onOpenChange={setIsKickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 강제 퇴장</DialogTitle>
            <DialogDescription>
              정말로 {member.user?.name}님을 팀에서 퇴장시키겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsKickOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleKick} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              퇴장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 소유권 이전 다이얼로그 */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>소유권 이전</DialogTitle>
            <DialogDescription>
              {member.user?.name}님에게 팀 소유권을 이전하시겠습니까?
              <br />
              이전 후 본인은 관리자로 변경됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
              취소
            </Button>
            <Button onClick={handleTransferOwnership} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              이전
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
