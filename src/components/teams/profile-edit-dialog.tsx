'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';

interface ProfileEditDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
    profile_image: string | null;
  };
  children: React.ReactNode;
}

export function ProfileEditDialog({ user, children }: ProfileEditDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [profileImage, setProfileImage] = useState(user.profile_image);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다');
      return;
    }

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileImage(publicUrl);
      toast.success('이미지가 업로드되었습니다');
    } catch {
      toast.error('이미지 업로드에 실패했습니다');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('이름을 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({ name: name.trim(), profile_image: profileImage })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('프로필이 업데이트되었습니다');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('프로필 업데이트에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground">프로필 수정</DialogTitle>
          <DialogDescription>프로필 정보를 수정하세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border border-border/50">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="text-2xl bg-foreground/10 text-foreground">
                  {name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {profileImage && (
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
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">이메일</Label>
            <Input value={user.email} disabled className="bg-muted border-border" />
            <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-border">
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-foreground text-background hover:bg-foreground/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
