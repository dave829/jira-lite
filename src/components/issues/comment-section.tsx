'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Comment, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CommentSectionProps {
  issueId: string;
  comments: (Comment & { user: User | null })[];
  currentUserId: string;
  currentUser?: User | null;
  canEdit: boolean;
}

export function CommentSection({
  issueId,
  comments,
  currentUserId,
  currentUser,
  canEdit,
}: CommentSectionProps) {
  const router = useRouter();
  const [localComments, setLocalComments] = useState(comments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const tempComment: Comment & { user: User | null } = {
      id: tempId,
      issue_id: issueId,
      user_id: currentUserId,
      content: newComment,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      user: currentUser ?? null,
    };

    // 낙관적 업데이트
    setLocalComments((prev) => [...prev, tempComment]);
    setNewComment('');
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('comments').insert({
        issue_id: issueId,
        user_id: currentUserId,
        content: tempComment.content,
      });

      if (error) throw error;

      // 댓글 추가 시 AI 댓글 요약 캐시 무효화
      await supabase
        .from('ai_cache')
        .update({ invalidated_at: new Date().toISOString() })
        .eq('issue_id', issueId)
        .eq('type', 'comment_summary');

      toast.success('댓글이 작성되었습니다');
      router.refresh();
    } catch {
      // 롤백
      setLocalComments((prev) => prev.filter((c) => c.id !== tempId));
      toast.error('댓글 작성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    // 임시 ID인 경우 무시
    if (commentId.startsWith('temp-')) return;

    const originalComment = localComments.find((c) => c.id === commentId);
    
    // 낙관적 업데이트
    setLocalComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, content: editContent, updated_at: new Date().toISOString() } : c
      )
    );
    setEditingId(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent })
        .eq('id', commentId);

      if (error) throw error;
      toast.success('댓글이 수정되었습니다');
      router.refresh();
    } catch {
      // 롤백
      if (originalComment) {
        setLocalComments((prev) =>
          prev.map((c) => (c.id === commentId ? originalComment : c))
        );
      }
      toast.error('댓글 수정에 실패했습니다');
    }
  };

  const handleDelete = async (commentId: string) => {
    // 임시 ID인 경우 로컬에서만 삭제
    if (commentId.startsWith('temp-')) {
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
      return;
    }

    const deletedComment = localComments.find((c) => c.id === commentId);
    
    // 낙관적 업데이트
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
      toast.success('댓글이 삭제되었습니다');
      router.refresh();
    } catch {
      // 롤백
      if (deletedComment) {
        setLocalComments((prev) => [...prev, deletedComment]);
      }
      toast.error('댓글 삭제에 실패했습니다');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">댓글</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 댓글 목록 */}
        {localComments.length > 0 ? (
          <div className="space-y-4">
            {localComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.profile_image || undefined} />
                  <AvatarFallback>
                    {comment.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.user?.name}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(comment.created_at), 'M월 d일 HH:mm', { locale: ko })}
                    </span>
                    {comment.updated_at !== comment.created_at && (
                      <span className="text-xs text-gray-400">(수정됨)</span>
                    )}
                  </div>
                  {editingId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(comment.id)}
                          disabled={loadingId === comment.id}
                        >
                          {loadingId === comment.id && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 group">
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      {comment.user_id === currentUserId && canEdit && (
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => startEdit(comment)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-red-500"
                            onClick={() => handleDelete(comment.id)}
                            disabled={loadingId === comment.id}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            삭제
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">아직 댓글이 없습니다</p>
        )}

        {/* 새 댓글 작성 */}
        {canEdit && (
          <div className="flex gap-3 pt-4 border-t">
            <Textarea
              placeholder="댓글을 작성하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
            />
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              className="shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
