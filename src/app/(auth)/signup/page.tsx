'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { signUpSchema, type SignUpInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Home } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.name },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('이미 등록된 이메일입니다');
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (authData.user) {
        toast.success('회원가입이 완료되었습니다!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('회원가입 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('[SignUp] handleGoogleLogin clicked');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        console.error('[SignUp] Google OAuth error', error);
        toast.error('Google 로그인 중 오류가 발생했습니다');
        return;
      }
      if (data?.url) {
        console.log('[SignUp] redirecting to', data.url);
        window.location.href = data.url;
      } else {
        console.log('[SignUp] signInWithOAuth completed without url; SDK may have already redirected');
      }
    } catch (err) {
      console.error('[SignUp] Google OAuth exception', err);
      toast.error('Google 로그인 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="glass-card p-8 relative">
      <Link href="/" className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Home className="h-4 w-4 mr-2" />
          홈으로
        </Button>
      </Link>

      <div className="text-center mb-8 pt-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-foreground mb-4">
          <span className="text-background font-bold text-lg">JL</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">회원가입</h1>
        <p className="text-muted-foreground mt-1">새 계정을 만들어 시작하세요</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">이름</Label>
          <Input
            id="name"
            type="text"
            placeholder="홍길동"
            className="bg-background/50 border-border focus:border-foreground transition-colors"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            className="bg-background/50 border-border focus:border-foreground transition-colors"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">비밀번호</Label>
          <Input
            id="password"
            type="password"
            placeholder="6자 이상"
            className="bg-background/50 border-border focus:border-foreground transition-colors"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <Button 
          type="submit" 
          className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all" 
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          회원가입
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">또는</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-border hover:bg-accent transition-all"
        onClick={handleGoogleLogin}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google로 계속하기
      </Button>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
