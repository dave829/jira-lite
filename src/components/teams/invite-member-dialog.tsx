'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { inviteMemberSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { LIMITS } from '@/lib/constants';

type InviteInput = z.infer<typeof inviteMemberSchema>;

interface InviteMemberDialogProps {
  teamId: string;
}

export function InviteMemberDialog({ teamId }: InviteMemberDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteMemberSchema),
  });

  const onSubmit = async (data: InviteInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      // 이미 팀 멤버인지 확인
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', (
          await supabase.from('users').select('id').eq('email', data.email).single()
        ).data?.id)
        .single();

      if (existingMember) {
        toast.error('이미 팀 멤버입니다');
        return;
      }

      // 이미 초대된 이메일인지 확인
      const { data: existingInvite } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', teamId)
        .eq('email', data.email)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        // 기존 초대 만료일 갱신
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + LIMITS.TEAM_INVITATION_EXPIRY_DAYS);

        await supabase
          .from('team_invitations')
          .update({ expires_at: expiresAt.toISOString() })
          .eq('id', existingInvite.id);

        toast.success('초대가 재발송되었습니다');
      } else {
        // 새 초대 생성
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + LIMITS.TEAM_INVITATION_EXPIRY_DAYS);

        const { error } = await supabase.from('team_invitations').insert({
          team_id: teamId,
          email: data.email,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

        if (error) throw error;

        // TODO: 실제 이메일 발송 (Resend API)
        toast.success('초대가 발송되었습니다');
      }

      reset();
      setIsOpen(false);
      router.refresh();
    } catch {
      toast.error('초대 발송에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          멤버 초대
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>
            이메일 주소를 입력하여 팀에 멤버를 초대하세요
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              초대 보내기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
