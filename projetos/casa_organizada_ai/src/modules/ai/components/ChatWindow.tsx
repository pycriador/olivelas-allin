import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import assistantAvatar from "@/assets/assistant-avatar.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  threadId: string;
  initialMessages: UIMessage[];
};

export function ChatWindow({ threadId, initialMessages }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages, id, body }) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return {
            body: { messages, id, threadId, ...body },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          };
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => toast.error(err.message || "Falha na conversa"),
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isBusy) textareaRef.current?.focus();
  }, [isBusy, threadId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <img
                  src={assistantAvatar}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16"
                  loading="lazy"
                />
              }
              title="Como posso ajudar?"
              description="Peça rotinas, checklists e planejamentos em linguagem natural."
            />
          ) : (
            messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
                  {m.role === "user" ? (
                    <MessageContent>{text}</MessageContent>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  )}
                </Message>
              );
            })
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <div className="pl-1">
                <Shimmer>Pensando...</Shimmer>
              </div>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background p-3">
        <div className="mx-auto w-full max-w-3xl">
          <PromptInput
            onSubmit={(msg, e) => {
              e.preventDefault();
              const text = msg.text?.trim();
              if (!text || isBusy) return;
              sendMessage({ text });
              const form = e.currentTarget as HTMLFormElement;
              form.reset();
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              placeholder="Peça uma rotina, checklist, planner..."
              disabled={isBusy}
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={isBusy} />
            </PromptInputFooter>
          </PromptInput>
          {error && (
            <p className="mt-2 text-xs text-destructive">{error.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}