'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { resetPasswordSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error('비밀번호 재설정 이메일 발송에 실패했습니다');
        return;
      }

      setIsEmailSent(true);
      toast.success('비밀번호 재설정 이메일을 발송했습니다');
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">이메일을 확인하세요</CardTitle>
          <CardDescription>
            비밀번호 재설정 링크를 이메일로 발송했습니다.
            <br />
            링크는 1시간 동안 유효합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              로그인으로 돌아가기
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
        <CardDescription>
          가입한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            재설정 링크 보내기
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            <ArrowLeft className="mr-1 inline h-4 w-4" />
            로그인으로 돌아가기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
