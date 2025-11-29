import { createClient } from '@/lib/supabase/server';
import { generateCommentSummary } from '@/lib/ai/gemini';
import { NextResponse } from 'next/server';
import { LIMITS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { issueId } = await request.json();

    // 댓글 조회
    const { data: comments } = await supabase
      .from('comments')
      .select('content, user:users(name)')
      .eq('issue_id', issueId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (!comments || comments.length < LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY) {
      return NextResponse.json(
        { error: `댓글이 ${LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY}개 이상이어야 합니다` },
        { status: 400 }
      );
    }

    // 댓글 내용 포맷팅
    const commentTexts = comments.map(
      (c) => `${c.user?.name || '익명'}: ${c.content}`
    );

    // AI 댓글 요약 생성
    const summary = await generateCommentSummary(commentTexts);

    // 기존 캐시 무효화
    await supabase
      .from('ai_cache')
      .update({ invalidated_at: new Date().toISOString() })
      .eq('issue_id', issueId)
      .eq('type', 'comment_summary');

    // 새 캐시 저장
    await supabase.from('ai_cache').insert({
      issue_id: issueId,
      type: 'comment_summary',
      content: summary,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI Comment Summary Error:', error);
    return NextResponse.json(
      { error: 'AI 댓글 요약 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
