'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getTaskComments, addTaskComment, TaskComment } from '@/app/(dashboard)/tasks/comments-actions';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Activity, Send } from 'lucide-react';
import { toast } from 'sonner';

interface TaskActivityProps {
    taskId: string;
}

export function TaskActivity({ taskId }: TaskActivityProps) {
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        let isMounted = true;

        async function loadComments() {
            try {
                const data = await getTaskComments(taskId);
                if (isMounted) {
                    setComments(data);
                }
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadComments();

        return () => {
            isMounted = false;
        };
    }, [taskId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim()) return;

        startTransition(async () => {
            try {
                // Optimistic update
                const optimisticComment: TaskComment = {
                    id: 'temp-' + Date.now(),
                    task_id: taskId,
                    user_id: 'current-user', // we don't know it here, but it's just optimistic
                    team_id: 'current-team',
                    content: newComment,
                    activity_type: 'comment',
                    metadata: {},
                    created_at: new Date().toISOString(),
                    user: {
                        full_name: 'Posting...',
                        email: ''
                    }
                };

                setComments(prev => [...prev, optimisticComment]);
                setNewComment('');

                await addTaskComment(taskId, newComment);

                // Reload real comments to get the correct user and IDs
                const freshComments = await getTaskComments(taskId);
                setComments(freshComments);

            } catch (error) {
                toast.error("Failed to post comment");
                // In real app, we'd revert optimistic update here
            }
        });
    };

    return (
        <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Activity Options
            </h4>

            <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                    placeholder="Ask a question or post an update..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px] text-sm resize-none"
                    disabled={isPending}
                />
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!newComment.trim() || isPending}
                        className="gap-2"
                    >
                        <Send className="h-3.5 w-3.5" />
                        {isPending ? 'Posting...' : 'Comment'}
                    </Button>
                </div>
            </form>

            <div className="space-y-4 mt-6">
                {isLoading ? (
                    <div className="text-sm text-center text-muted-foreground py-4">Loading activity...</div>
                ) : comments.length === 0 ? (
                    <div className="text-sm text-center text-muted-foreground py-4">No activity yet.</div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 text-sm">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-medium text-xs">
                                {comment.user?.full_name?.charAt(0) || comment.user?.email?.charAt(0) || <Activity className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline justify-between">
                                    <span className="font-medium">{comment.user?.full_name || 'System'}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-lg text-sm border border-border/50">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
