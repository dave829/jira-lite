import { createClient } from '@/lib/supabase/server';
import { generateSummary } from '@/lib/ai/gemini';
import { NextResponse } from 'next/server';
import { LIMITS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { issueId, description } = await request.json();

    if (!description || description.length <= LIMITS.AI_MIN_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `설명이 ${LIMITS.AI_MIN_DESCRIPTION_LENGTH}자 이상이어야 합니다` },
        { status: 400 }
      );
    }

    // AI 요약 생성
    const summary = await generateSummary(description);

    // 기존 캐시 무효화
    await supabase
      .from('ai_cache')
      .update({ invalidated_at: new Date().toISOString() })
      .eq('issue_id', issueId)
      .eq('type', 'summary');

    // 새 캐시 저장
    await supabase.from('ai_cache').insert({
      issue_id: issueId,
      type: 'summary',
      content: summary,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI Summary Error:', error);
    return NextResponse.json(
      { error: 'AI 요약 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
