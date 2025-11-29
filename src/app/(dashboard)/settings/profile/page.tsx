'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { profileSchema } from '@/lib/validations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { LIMITS } from '@/lib/constants';

type ProfileInput = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
    newPassword: z.string().min(LIMITS.PASSWORD_MIN, `${LIMITS.PASSWORD_MIN}자 이상`),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

type PasswordInput = z.infer<typeof passwordSchema>;

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string; profile_image: string | null } | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser(profile);
          profileForm.reset({ name: profile.name, profile_image: profile.profile_image });
        }

        // OAuth 사용자 확인
        setIsOAuthUser(authUser.app_metadata.provider === 'google');
      }
    };
    loadUser();
  }, []);

  const handleProfileUpdate = async (data: ProfileInput) => {
    if (!user) return;
    setIsLoadingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({ name: data.name, profile_image: data.profile_image || null })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('프로필이 업데이트되었습니다');
      router.refresh();
    } catch {
      toast.error('프로필 업데이트에 실패했습니다');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (data: PasswordInput) => {
    setIsLoadingPassword(true);
    try {
      const supabase = createClient();
      
      // 현재 비밀번호 확인을 위해 재로그인 시도
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error('현재 비밀번호가 올바르지 않습니다');
        return;
      }

      // 새 비밀번호로 변경
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success('비밀번호가 변경되었습니다');
      passwordForm.reset();
    } catch {
      toast.error('비밀번호 변경에 실패했습니다');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();

      // 소유한 팀 확인
      const { data: ownedTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('owner_id', user?.id)
        .is('deleted_at', null);

      if (ownedTeams && ownedTeams.length > 0) {
        toast.error('소유한 팀을 먼저 삭제하거나 소유권을 이전해주세요');
        return;
      }

      // Soft delete
      await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user?.id);

      await supabase.auth.signOut();
      toast.success('계정이 삭제되었습니다');
      router.push('/');
    } catch {
      toast.error('계정 삭제에 실패했습니다');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">프로필 설정</h1>
        <p className="text-gray-500">계정 정보를 관리하세요</p>
      </div>

      {/* 프로필 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>이름과 프로필 이미지를 수정하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profile_image || undefined} />
                <AvatarFallback className="text-xl">
                  {user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="profile_image">프로필 이미지 URL</Label>
                <Input
                  id="profile_image"
                  placeholder="https://example.com/image.jpg"
                  {...profileForm.register('profile_image')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={user.email} disabled />
              <p className="text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
            </div>
            <Button type="submit" disabled={isLoadingProfile}>
              {isLoadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      {!isOAuthUser && (
        <Card>
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
            <CardDescription>보안을 위해 주기적으로 비밀번호를 변경하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isLoadingPassword}>
                {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                비밀번호 변경
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 계정 삭제 */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">계정 삭제</CardTitle>
          <CardDescription>계정을 삭제하면 모든 데이터가 삭제됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            계정 삭제
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
