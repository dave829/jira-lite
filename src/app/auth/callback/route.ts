import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Google OAuth 사용자의 경우 users 테이블에 프로필 생성
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existingUser) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.full_name || data.user.user_metadata.name || data.user.email!.split('@')[0],
          profile_image: data.user.user_metadata.avatar_url || null,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
