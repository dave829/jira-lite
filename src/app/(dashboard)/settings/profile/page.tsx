'use client';

import { useState, useEffect, useRef } from 'react';
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
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string; profile_image: string | null } | null>(null);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
          setPreviewImage(profile.profile_image);
        }

        // OAuth 사용자 확인
        setIsOAuthUser(authUser.app_metadata.provider === 'google');
      }
    };
    loadUser();
  }, [profileForm]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    // 이미지 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    setIsUploadingImage(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 기존 이미지 삭제 (있는 경우)
      if (user.profile_image?.includes('avatars/')) {
        const oldPath = user.profile_image.split('avatars/')[1]?.split('?')[0];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`avatars/${oldPath}`]);
        }
      }

      // 새 이미지 업로드
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 프로필 업데이트
      profileForm.setValue('profile_image', publicUrl);
      setPreviewImage(publicUrl);
      toast.success('이미지가 업로드되었습니다');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('이미지 업로드에 실패했습니다');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    profileForm.setValue('profile_image', '');
    setPreviewImage(null);
  };

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

      setUser({ ...user, profile_image: data.profile_image || null });
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
        <h1 className="text-2xl font-bold text-foreground">프로필 설정</h1>
        <p className="text-muted-foreground">계정 정보를 관리하세요</p>
      </div>

      {/* 프로필 정보 */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">프로필 정보</CardTitle>
          <CardDescription>이름과 프로필 이미지를 수정하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border border-border/50">
                  <AvatarImage src={previewImage || undefined} />
                  <AvatarFallback className="text-2xl bg-foreground/10 text-foreground">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {previewImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="border-border"
                >
                  {isUploadingImage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  이미지 업로드
                </Button>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF (최대 5MB)</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">이름</Label>
              <Input id="name" className="bg-background/50 border-border" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">이메일</Label>
              <Input value={user.email} disabled className="bg-muted border-border" />
              <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
            </div>
            <Button type="submit" disabled={isLoadingProfile} className="bg-foreground text-background hover:bg-foreground/90">
              {isLoadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      {!isOAuthUser && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">비밀번호 변경</CardTitle>
            <CardDescription>보안을 위해 주기적으로 비밀번호를 변경하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-foreground">현재 비밀번호</Label>
                <Input id="currentPassword" type="password" className="bg-background/50 border-border" {...passwordForm.register('currentPassword')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground">새 비밀번호</Label>
                <Input id="newPassword" type="password" className="bg-background/50 border-border" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">비밀번호 확인</Label>
                <Input id="confirmPassword" type="password" className="bg-background/50 border-border" {...passwordForm.register('confirmPassword')} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isLoadingPassword} className="bg-foreground text-background hover:bg-foreground/90">
                {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                비밀번호 변경
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 계정 삭제 */}
      <Card className="glass-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">계정 삭제</CardTitle>
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
