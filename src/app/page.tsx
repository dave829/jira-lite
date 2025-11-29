import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">JL</span>
          </div>
          <span className="font-semibold text-lg">Jira Lite</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">로그인</Button>
          </Link>
          <Link href="/signup">
            <Button>시작하기</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI 기반 이슈 트래킹
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          팀의 프로젝트를 효율적으로 관리하세요.
          AI가 이슈 요약, 해결 전략 제안, 자동 분류를 도와드립니다.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              무료로 시작하기
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">칸반 보드</h3>
            <p className="text-gray-600">
              드래그 앤 드롭으로 이슈 상태를 쉽게 관리하세요
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI 기능</h3>
            <p className="text-gray-600">
              AI가 이슈를 요약하고 해결 방법을 제안합니다
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">팀 협업</h3>
            <p className="text-gray-600">
              팀원을 초대하고 함께 프로젝트를 관리하세요
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
