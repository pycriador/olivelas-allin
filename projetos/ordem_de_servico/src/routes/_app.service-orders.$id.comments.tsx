import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, Send, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { serviceOrderService } from "@/modules/service-orders/service";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";

export const Route = createFileRoute("/_app/service-orders/$id/comments")({
  head: () => ({ meta: [{ title: "Comentários — ServiceForge" }] }),
  component: CommentsTab,
});

function CommentsTab() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: so, isLoading } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => serviceOrderService.get(id),
  });

  const addComment = useMutation({
    mutationFn: () => serviceOrderService.addComment(id, { author: "Admin", authorId: "admin", text: newComment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setNewComment("");
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_COMMENT_ADDED, "service-order", "service-orders", { id, text: newComment }).catch(() => {});
      toast("Comentário adicionado");
    },
    onError: () => toast("Erro ao adicionar comentário"),
  });

  const editComment = useMutation({
    mutationFn: () => serviceOrderService.editComment(id, editingId!, editText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      setEditingId(null);
      setEditText("");
      toast("Comentário editado");
    },
    onError: () => toast("Erro ao editar comentário"),
  });

  const removeComment = useMutation({
    mutationFn: (commentId: string) => serviceOrderService.removeComment(id, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-order", id] });
      toast("Comentário removido");
    },
    onError: () => toast("Erro ao remover comentário"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-sm text-muted-foreground">{t("common.loading")}</p></div>;

  const comments = so?.comments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("so.comments")}</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Textarea placeholder={t("so.addComment")} value={newComment} onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && newComment && addComment.mutate()} />
            <Button size="sm" disabled={!newComment} onClick={() => addComment.mutate()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {comments.length === 0 ? (
        <Card><CardContent><p className="py-8 text-center text-sm text-muted-foreground">Nenhum comentário.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {[...comments].reverse().map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-6">
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setEditText(""); }}>{t("common.cancel")}</Button>
                      <Button size="sm" onClick={() => editComment.mutate()} disabled={!editText}>{t("common.save")}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.author}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                        {c.editedAt && <span className="text-xs text-muted-foreground">(editado)</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(c.id); setEditText(c.text); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeComment.mutate(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{c.text}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
