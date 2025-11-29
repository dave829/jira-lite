import { createClient } from '@/lib/supabase/server';
import { findDuplicates } from '@/lib/ai/gemini';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { projectId, title } = await request.json();

    // 기존 이슈 조회
    const { data: existingIssues } = await supabase
      .from('issues')
      .select('id, title, description')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!existingIssues || existingIssues.length === 0) {
      return NextResponse.json({ duplicates: [] });
    }

    // AI 중복 탐지
    const duplicates = await findDuplicates(title, existingIssues);

    return NextResponse.json({ duplicates });
  } catch (error) {
    console.error('AI Find Duplicates Error:', error);
    return NextResponse.json(
      { error: 'AI 중복 탐지에 실패했습니다' },
      { status: 500 }
    );
  }
}
