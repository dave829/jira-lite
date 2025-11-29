'use client';

import { useState } from 'react';
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
  canEdit: boolean;
}

export function CommentSection({
  issueId,
  comments,
  currentUserId,
  canEdit,
}: CommentSectionProps) {
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('comments').insert({
        issue_id: issueId,
        user_id: currentUserId,
        content: newComment,
      });

      if (error) throw error;

      // 댓글 추가 시 AI 댓글 요약 캐시 무효화
      await supabase
        .from('ai_cache')
        .update({ invalidated_at: new Date().toISOString() })
        .eq('issue_id', issueId)
        .eq('type', 'comment_summary');

      setNewComment('');
      toast.success('댓글이 작성되었습니다');
      router.refresh();
    } catch {
      toast.error('댓글 작성에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setLoadingId(commentId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent })
        .eq('id', commentId);

      if (error) throw error;

      setEditingId(null);
      toast.success('댓글이 수정되었습니다');
      router.refresh();
    } catch {
      toast.error('댓글 수정에 실패했습니다');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    setLoadingId(commentId);
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
      toast.error('댓글 삭제에 실패했습니다');
    } finally {
      setLoadingId(null);
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
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
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
