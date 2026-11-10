import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { MessageSquare, CheckCircle2, Reply, Trash2, Edit3, Loader2 } from "lucide-react";
import { listComments, createComment, deleteComment, resolveComment } from "@/modules/comments/comments.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AvatarDisplay } from "@/modules/avatar/components/AvatarDisplay";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface CommentSectionProps {
  entityType: string;
  entityId: string;
}

export function CommentSection({ entityType, entityId }: CommentSectionProps) {
  const listFn = useServerFn(listComments);
  const createFn = useServerFn(createComment);
  const deleteFn = useServerFn(deleteComment);
  const resolveFn = useServerFn(resolveComment);
  const qc = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => listFn({ data: { entity_type: entityType, entity_id: entityId } }),
  });

  const createMut = useMutation({
    mutationFn: (data: { content: string; parent_id?: string }) =>
      createFn({ data: { entity_type: entityType, entity_id: entityId, ...data } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', entityType, entityId] });
      setNewComment('');
      setReplyTo(null);
      setReplyText('');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', entityType, entityId] }),
  });

  const resolveMut = useMutation({
    mutationFn: (params: { id: string; resolved: boolean }) => resolveFn({ data: params }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', entityType, entityId] }),
  });

  const topLevel = (comments ?? []).filter((c: { parent_id: string | null }) => !c.parent_id);
  const getReplies = (parentId: string) => (comments ?? []).filter((c: { parent_id: string | null }) => c.parent_id === parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageSquare className="h-4 w-4" />
        Comentários
        <span className="text-muted-foreground">({(comments ?? []).length})</span>
      </div>

      {/* New comment form */}
      <div className="flex gap-3">
        <div className="shrink-0 pt-1">
          <AvatarDisplay size="sm" />
        </div>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Adicione um comentário... Use @ para mencionar."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (!newComment.trim()) return;
                createMut.mutate({ content: newComment.trim() });
              }}
              disabled={createMut.isPending || !newComment.trim()}
            >
              {createMut.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Comentar
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : topLevel.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Nenhum comentário ainda. Seja o primeiro!
          </div>
        ) : (
          topLevel.map((comment: Record<string, unknown>) => (
            <CommentItem
              key={comment.id as string}
              comment={comment as any}
              replies={getReplies(comment.id as string) as any[]}
              replyTo={replyTo}
              replyText={replyText}
              onReply={(id) => { setReplyTo(id); setReplyText(''); }}
              onReplyTextChange={setReplyText}
              onSubmitReply={() => {
                if (!replyText.trim() || !replyTo) return;
                createMut.mutate({ content: replyText.trim(), parent_id: replyTo });
              }}
              onDelete={(id) => deleteMut.mutate(id)}
              onResolve={(id, resolved) => resolveMut.mutate({ id, resolved })}
              isPending={createMut.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment, replies, replyTo, replyText, onReply, onReplyTextChange, onSubmitReply, onDelete, onResolve, isPending,
}: {
  comment: { id: string; content: string; author_id: string; created_at: string; is_resolved: boolean; edited_at: string | null; author?: { full_name?: string; avatar_url?: string; avatar_type?: string } };
  replies: any[];
  replyTo: string | null;
  replyText: string;
  onReply: (id: string) => void;
  onReplyTextChange: (v: string) => void;
  onSubmitReply: () => void;
  onDelete: (id: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  isPending: boolean;
}) {
  const author = (comment.author ?? {}) as { full_name?: string; avatar_url?: string; avatar_type?: string };
  return (
    <div className={cn("rounded-lg border border-border bg-card p-3 transition", comment.is_resolved && "opacity-60")}>
      <div className="flex items-start gap-3">
        <AvatarDisplay
          size="sm"
          fullName={author.full_name}
          avatarType={author.avatar_type}
          photoUrl={author.avatar_url}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{author.full_name ?? 'Usuário'}</span>
            <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}</span>
            {comment.edited_at && <span className="italic">(editado)</span>}
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={() => onReply(comment.id)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Reply className="h-3 w-3" /> Responder
            </button>
            <button type="button" onClick={() => onResolve(comment.id, !comment.is_resolved)}
              className={cn("text-xs flex items-center gap-1", comment.is_resolved ? "text-success" : "text-muted-foreground hover:text-foreground")}>
              <CheckCircle2 className="h-3 w-3" /> {comment.is_resolved ? 'Resolvido' : 'Resolver'}
            </button>
            <button type="button" onClick={() => onDelete(comment.id)}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
              <Trash2 className="h-3 w-3" /> Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Reply form */}
      {replyTo === comment.id && (
        <div className="ml-11 mt-2 space-y-2">
          <Textarea
            placeholder="Escreva sua resposta..."
            value={replyText}
            onChange={(e) => onReplyTextChange(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => onReply('')}>Cancelar</Button>
            <Button size="sm" onClick={onSubmitReply} disabled={isPending || !replyText.trim()}>
              {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Responder
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-11 mt-3 space-y-2 border-l-2 border-muted pl-3">
          {replies.map((reply: Record<string, unknown>) => {
            const replyAuthor = (reply.author ?? {}) as { full_name?: string; avatar_url?: string; avatar_type?: string };
            return (
              <div key={reply.id as string} className="flex items-start gap-2">
                <AvatarDisplay size="sm" fullName={replyAuthor.full_name} avatarType={replyAuthor.avatar_type} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{replyAuthor.full_name ?? 'Usuário'}</span>
                    <span>{formatDistanceToNow(new Date(reply.created_at as string), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                  <p className="mt-0.5 text-sm">{reply.content as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
