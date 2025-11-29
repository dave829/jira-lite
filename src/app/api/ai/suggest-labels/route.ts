import { createClient } from '@/lib/supabase/server';
import { suggestLabels } from '@/lib/ai/gemini';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { projectId, title, description } = await request.json();

    // 프로젝트 라벨 조회
    const { data: labels } = await supabase
      .from('project_labels')
      .select('id, name')
      .eq('project_id', projectId);

    if (!labels || labels.length === 0) {
      return NextResponse.json({ labels: [] });
    }

    // AI 라벨 추천
    const suggestedNames = await suggestLabels(title, description || '', labels);

    // 추천된 라벨 ID 찾기
    const suggestedLabels = labels.filter((l) => suggestedNames.includes(l.name));

    return NextResponse.json({ labels: suggestedLabels });
  } catch (error) {
    console.error('AI Suggest Labels Error:', error);
    return NextResponse.json(
      { error: 'AI 라벨 추천에 실패했습니다' },
      { status: 500 }
    );
  }
}
