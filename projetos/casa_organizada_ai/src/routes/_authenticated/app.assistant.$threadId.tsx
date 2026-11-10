import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { loadMessages } from "@/modules/ai/threads.functions";
import { ChatWindow } from "@/modules/ai/components/ChatWindow";
import { Loader2 } from "lucide-react";
import type { UIMessage } from "ai";

export const Route = createFileRoute("/_authenticated/app/assistant/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const loadFn = useServerFn(loadMessages);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-messages", threadId],
    queryFn: () => loadFn({ data: { threadId } }),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando conversa...
      </div>
    );
  }

  const initialMessages: UIMessage[] = (data ?? []).map((m) => ({
    id: m.id,
    role: m.role as UIMessage["role"],
    parts: (m.parts as unknown) as UIMessage["parts"],
  }));

  return <ChatWindow key={threadId} threadId={threadId} initialMessages={initialMessages} />;
}