import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ✅ 토큰 존재 여부만 확인 (빠름 ~10ms)
  // ❌ API 호출 없음 (이전: ~1000ms)

  // Supabase auth cookie pattern: sb-[project-ref]-auth-token
  // Chunked cookies: sb-[project-ref]-auth-token.0, .1, etc.
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((cookie) =>
    cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
  );

  const isProtectedPath = ['/dashboard', '/teams', '/projects', '/settings'].some(
    (path) => request.nextUrl.pathname.startsWith(path)
  );

  // 보호된 경로이고 토큰이 없으면 로그인으로 리다이렉트
  if (isProtectedPath && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 인증 페이지이고 토큰이 있으면 대시보드로 리다이렉트
  const isAuthPath = ['/login', '/signup'].some(
    (path) => request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/teams/:path*', '/projects/:path*', '/settings/:path*', '/login', '/signup'],
};
