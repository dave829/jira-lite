import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSummary(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 이슈 트래킹 시스템의 AI 어시스턴트입니다. 이슈 설명을 2-4문장으로 간결하게 요약해주세요. 한국어로 답변하세요.',
      },
      {
        role: 'user',
        content: `다음 이슈 설명을 요약해주세요:\n\n${description}`,
      },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '요약을 생성할 수 없습니다.';
}

export async function generateSuggestion(title: string, description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 소프트웨어 개발 전문가입니다. 이슈를 해결하기 위한 구체적인 접근 방식과 단계를 제안해주세요. 한국어로 답변하세요.',
      },
      {
        role: 'user',
        content: `이슈 제목: ${title}\n\n이슈 설명: ${description}\n\n이 이슈를 해결하기 위한 접근 방식을 제안해주세요.`,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '제안을 생성할 수 없습니다.';
}

export async function generateCommentSummary(comments: string[]): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 이슈 트래킹 시스템의 AI 어시스턴트입니다. 댓글들의 논의 내용을 3-5문장으로 요약하고, 주요 결정 사항이 있다면 함께 정리해주세요. 한국어로 답변하세요.',
      },
      {
        role: 'user',
        content: `다음 댓글들의 논의 내용을 요약해주세요:\n\n${comments.join('\n\n---\n\n')}`,
      },
    ],
    max_tokens: 400,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '요약을 생성할 수 없습니다.';
}

export async function suggestLabels(
  title: string,
  description: string,
  existingLabels: { name: string }[]
): Promise<string[]> {
  const labelNames = existingLabels.map((l) => l.name).join(', ');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 이슈 분류 전문가입니다. 주어진 이슈에 적합한 라벨을 기존 라벨 목록에서 최대 3개까지 선택해주세요. 라벨 이름만 쉼표로 구분하여 답변하세요. 적합한 라벨이 없으면 "없음"이라고 답변하세요.`,
      },
      {
        role: 'user',
        content: `기존 라벨 목록: ${labelNames}\n\n이슈 제목: ${title}\n이슈 설명: ${description || '없음'}`,
      },
    ],
    max_tokens: 100,
    temperature: 0.3,
  });

  const result = response.choices[0]?.message?.content || '';
  if (result === '없음' || !result) return [];

  return result
    .split(',')
    .map((l) => l.trim())
    .filter((l) => existingLabels.some((el) => el.name === l));
}

export async function findDuplicates(
  title: string,
  existingIssues: { id: string; title: string; description: string | null }[]
): Promise<{ id: string; title: string; similarity: string }[]> {
  if (existingIssues.length === 0) return [];

  const issueList = existingIssues
    .slice(0, 50) // 최대 50개만 비교
    .map((i, idx) => `${idx + 1}. [${i.id}] ${i.title}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 이슈 중복 탐지 전문가입니다. 새 이슈와 유사한 기존 이슈를 찾아주세요. 유사한 이슈가 있으면 해당 이슈의 ID와 유사도(높음/중간)를 JSON 배열로 답변하세요. 최대 3개까지만 선택하세요. 유사한 이슈가 없으면 빈 배열 []을 답변하세요.
예시: [{"id": "abc123", "similarity": "높음"}, {"id": "def456", "similarity": "중간"}]`,
      },
      {
        role: 'user',
        content: `새 이슈 제목: ${title}\n\n기존 이슈 목록:\n${issueList}`,
      },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  try {
    const result = response.choices[0]?.message?.content || '[]';
    const parsed = JSON.parse(result) as { id: string; similarity: string }[];
    return parsed.map((p) => {
      const issue = existingIssues.find((i) => i.id === p.id);
      return {
        id: p.id,
        title: issue?.title || '',
        similarity: p.similarity,
      };
    }).filter((p) => p.title);
  } catch {
    return [];
  }
}
