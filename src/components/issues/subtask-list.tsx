'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { LIMITS } from '@/lib/constants';

interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
  position: number;
}

interface SubtaskListProps {
  issueId: string;
  subtasks: Subtask[];
  canEdit: boolean;
}

export function SubtaskList({ issueId, subtasks, canEdit }: SubtaskListProps) {
  const router = useRouter();
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const completedCount = subtasks.filter((s) => s.is_completed).length;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    if (subtasks.length >= LIMITS.MAX_SUBTASKS_PER_ISSUE) {
      toast.error(`이슈당 최대 ${LIMITS.MAX_SUBTASKS_PER_ISSUE}개의 서브태스크만 추가할 수 있습니다`);
      return;
    }

    setIsAdding(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('subtasks').insert({
        issue_id: issueId,
        title: newTitle,
        position: subtasks.length,
      });

      if (error) throw error;

      setNewTitle('');
      toast.success('서브태스크가 추가되었습니다');
      router.refresh();
    } catch {
      toast.error('서브태스크 추가에 실패했습니다');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggle = async (subtask: Subtask) => {
    setLoadingId(subtask.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('subtasks')
        .update({ is_completed: !subtask.is_completed })
        .eq('id', subtask.id);

      if (error) throw error;
      router.refresh();
    } catch {
      toast.error('상태 변경에 실패했습니다');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (subtaskId: string) => {
    setLoadingId(subtaskId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      toast.success('서브태스크가 삭제되었습니다');
      router.refresh();
    } catch {
      toast.error('서브태스크 삭제에 실패했습니다');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>서브태스크</span>
          <span className="text-sm font-normal text-gray-500">
            {completedCount}/{subtasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 진행률 바 */}
        {subtasks.length > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / subtasks.length) * 100}%` }}
            />
          </div>
        )}

        {/* 서브태스크 목록 */}
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group"
            >
              <Checkbox
                checked={subtask.is_completed}
                onCheckedChange={() => canEdit && handleToggle(subtask)}
                disabled={!canEdit || loadingId === subtask.id}
              />
              <span
                className={`flex-1 ${
                  subtask.is_completed ? 'line-through text-gray-400' : ''
                }`}
              >
                {subtask.title}
              </span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(subtask.id)}
                  disabled={loadingId === subtask.id}
                >
                  {loadingId === subtask.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-500" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 새 서브태스크 추가 */}
        {canEdit && (
          <div className="flex gap-2">
            <Input
              placeholder="새 서브태스크 추가..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={isAdding || !newTitle.trim()}>
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
