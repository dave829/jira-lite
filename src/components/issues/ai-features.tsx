'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Issue, AICache } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sparkles, Lightbulb, MessageSquare, Loader2 } from 'lucide-react';
import { LIMITS } from '@/lib/constants';

interface AIFeaturesProps {
  issue: Issue;
  aiCache: AICache[];
  commentsCount: number;
}

export function AIFeatures({ issue, aiCache, commentsCount }: AIFeaturesProps) {
  const router = useRouter();
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isLoadingCommentSummary, setIsLoadingCommentSummary] = useState(false);

  const cachedSummary = aiCache.find((c) => c.type === 'summary');
  const cachedSuggestion = aiCache.find((c) => c.type === 'suggestion');
  const cachedCommentSummary = aiCache.find((c) => c.type === 'comment_summary');

  const descriptionLength = issue.description?.length || 0;
  const canUseAI = descriptionLength > LIMITS.AI_MIN_DESCRIPTION_LENGTH;
  const canSummarizeComments = commentsCount >= LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY;

  const checkRateLimit = async (): Promise<boolean> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Rate limit 확인
    const { data: rateLimit } = await supabase
      .from('ai_rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const now = new Date();
    const windowStart = rateLimit?.window_start ? new Date(rateLimit.window_start) : null;
    const minuteAgo = new Date(now.getTime() - 60000);

    if (windowStart && windowStart > minuteAgo) {
      // 같은 분 내
      if (rateLimit.count >= LIMITS.AI_RATE_LIMIT_PER_MINUTE) {
        const remainingSeconds = Math.ceil((windowStart.getTime() + 60000 - now.getTime()) / 1000);
        toast.error(`AI 요청 제한에 도달했습니다. ${remainingSeconds}초 후에 다시 시도하세요.`);
        return false;
      }
      // 카운트 증가
      await supabase
        .from('ai_rate_limits')
        .update({ count: rateLimit.count + 1 })
        .eq('user_id', user.id);
    } else {
      // 새 윈도우 시작
      await supabase
        .from('ai_rate_limits')
        .upsert({
          user_id: user.id,
          count: 1,
          window_start: now.toISOString(),
        });
    }

    return true;
  };

  const handleGenerateSummary = async () => {
    if (!canUseAI) {
      toast.error(`설명이 ${LIMITS.AI_MIN_DESCRIPTION_LENGTH}자 이상이어야 합니다`);
      return;
    }

    if (!(await checkRateLimit())) return;

    setIsLoadingSummary(true);
    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          description: issue.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI 요약 생성에 실패했습니다');
      }

      toast.success('요약이 생성되었습니다');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 요약 생성에 실패했습니다');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleGenerateSuggestion = async () => {
    if (!canUseAI) {
      toast.error(`설명이 ${LIMITS.AI_MIN_DESCRIPTION_LENGTH}자 이상이어야 합니다`);
      return;
    }

    if (!(await checkRateLimit())) return;

    setIsLoadingSuggestion(true);
    try {
      const response = await fetch('/api/ai/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          title: issue.title,
          description: issue.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI 제안 생성에 실패했습니다');
      }

      toast.success('제안이 생성되었습니다');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 제안 생성에 실패했습니다');
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleGenerateCommentSummary = async () => {
    if (!canSummarizeComments) {
      toast.error(`댓글이 ${LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY}개 이상이어야 합니다`);
      return;
    }

    if (!(await checkRateLimit())) return;

    setIsLoadingCommentSummary(true);
    try {
      const response = await fetch('/api/ai/comment-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: issue.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'AI 댓글 요약 생성에 실패했습니다');
      }

      toast.success('댓글 요약이 생성되었습니다');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 댓글 요약 생성에 실패했습니다');
    } finally {
      setIsLoadingCommentSummary(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI 기능
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI 요약 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              이슈 요약
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateSummary}
              disabled={!canUseAI || isLoadingSummary}
            >
              {isLoadingSummary ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cachedSummary ? (
                '재생성'
              ) : (
                '생성'
              )}
            </Button>
          </div>
          {cachedSummary ? (
            <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
              {cachedSummary.content}
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              {canUseAI ? '버튼을 클릭하여 AI 요약을 생성하세요' : `설명이 ${LIMITS.AI_MIN_DESCRIPTION_LENGTH}자 이상이어야 합니다`}
            </p>
          )}
        </div>

        {/* AI 제안 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              해결 전략 제안
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateSuggestion}
              disabled={!canUseAI || isLoadingSuggestion}
            >
              {isLoadingSuggestion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cachedSuggestion ? (
                '재생성'
              ) : (
                '생성'
              )}
            </Button>
          </div>
          {cachedSuggestion ? (
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
              {cachedSuggestion.content}
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              {canUseAI ? '버튼을 클릭하여 AI 제안을 받으세요' : `설명이 ${LIMITS.AI_MIN_DESCRIPTION_LENGTH}자 이상이어야 합니다`}
            </p>
          )}
        </div>

        {/* 댓글 요약 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              댓글 요약
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateCommentSummary}
              disabled={!canSummarizeComments || isLoadingCommentSummary}
            >
              {isLoadingCommentSummary ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cachedCommentSummary ? (
                '재생성'
              ) : (
                '생성'
              )}
            </Button>
          </div>
          {cachedCommentSummary ? (
            <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg whitespace-pre-wrap">
              {cachedCommentSummary.content}
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              {canSummarizeComments
                ? '버튼을 클릭하여 댓글 요약을 생성하세요'
                : `댓글이 ${LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY}개 이상이어야 합니다 (현재 ${commentsCount}개)`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
