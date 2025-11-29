const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Gemini API 호출 실패');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function generateSummary(description: string): Promise<string> {
  const prompt = `당신은 이슈 트래킹 시스템의 AI 어시스턴트입니다. 다음 이슈 설명을 2-4문장으로 간결하게 한국어로 요약해주세요.

이슈 설명:
${description}

요약:`;

  return callGemini(prompt);
}

export async function generateSuggestion(title: string, description: string): Promise<string> {
  const prompt = `당신은 소프트웨어 개발 전문가입니다. 다음 이슈를 해결하기 위한 구체적인 접근 방식과 단계를 한국어로 제안해주세요.

이슈 제목: ${title}
이슈 설명: ${description}

해결 전략:`;

  return callGemini(prompt);
}

export async function generateCommentSummary(comments: string[]): Promise<string> {
  const prompt = `당신은 이슈 트래킹 시스템의 AI 어시스턴트입니다. 다음 댓글들의 논의 내용을 3-5문장으로 한국어로 요약하고, 주요 결정 사항이 있다면 함께 정리해주세요.

댓글들:
${comments.join('\n\n---\n\n')}

요약:`;

  return callGemini(prompt);
}

export async function suggestLabels(
  title: string,
  description: string,
  existingLabels: { name: string }[]
): Promise<string[]> {
  const labelNames = existingLabels.map((l) => l.name).join(', ');

  const prompt = `주어진 이슈에 적합한 라벨을 기존 라벨 목록에서 최대 3개까지 선택해주세요. 라벨 이름만 쉼표로 구분하여 답변하세요. 적합한 라벨이 없으면 "없음"이라고 답변하세요.

기존 라벨 목록: ${labelNames}
이슈 제목: ${title}
이슈 설명: ${description || '없음'}

추천 라벨:`;

  const result = await callGemini(prompt);
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
    .slice(0, 30)
    .map((i, idx) => `${idx + 1}. [${i.id}] ${i.title}`)
    .join('\n');

  const prompt = `새 이슈와 유사한 기존 이슈를 찾아주세요. 유사한 이슈가 있으면 해당 이슈의 ID와 유사도(높음/중간)를 JSON 배열로 답변하세요. 최대 3개까지만 선택하세요. 유사한 이슈가 없으면 빈 배열 []을 답변하세요.
예시: [{"id": "abc123", "similarity": "높음"}]

새 이슈 제목: ${title}

기존 이슈 목록:
${issueList}

JSON 응답:`;

  try {
    const result = await callGemini(prompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    const parsed = JSON.parse(jsonMatch[0]) as { id: string; similarity: string }[];
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
