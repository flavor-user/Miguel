"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { CuratorSuggestedPrompts } from "@/components/chat/curator-suggested-prompts";
import { getSuggestedPrompts } from "@/lib/curator/suggested-prompts";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  conversationId?: string;
  initialArtworkSlug?: string;
  focusArtworkTitle?: string;
  welcomeMessage: string;
  userId?: string;
  locale: Locale;
  dict: Dictionary;
}

export function ChatInterface({
  conversationId: initialConversationId,
  initialArtworkSlug,
  focusArtworkTitle,
  welcomeMessage,
  userId,
  locale,
  dict,
}: ChatInterfaceProps) {
  const t = dict.chat;
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = getSuggestedPrompts(locale, focusArtworkTitle);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setShowSuggestions(false);

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            conversationId,
            artworkSlug: initialArtworkSlug,
          }),
        });

        if (!response.ok) {
          throw new Error("Error en la respuesta");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const assistantId = crypto.randomUUID();
        let assistantContent = "";

        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

            for (const line of lines) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantContent += parsed.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }
                if (parsed.conversationId) {
                  setConversationId(parsed.conversationId);
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: t.error,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, initialArtworkSlug, isLoading, t.error]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  return (
    <div className="flex flex-col border border-neutral-200 bg-white">
      {showSuggestions && messages.length === 1 ? (
        <CuratorSuggestedPrompts
          locale={locale}
          prompts={suggestedPrompts}
          label={t.suggestedLabel}
          disabled={isLoading}
          onSelect={(prompt) => {
            setInput(prompt);
            void sendMessage(prompt);
          }}
        />
      ) : null}

      <div className="flex h-[calc(100vh-14rem)] flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[90%]  leading-relaxed",
                msg.role === "user"
                  ? "ml-auto text-right text-black"
                  : "border-l-2 border-neutral-200 pl-4 text-black"
              )}
            >
              {msg.role === "assistant" && msg.id !== "welcome" ? (
                <p className="mb-1 text-black">
                  {t.badge}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
          {isLoading ? (
            <div className="flex items-center gap-2 border-l-2 border-neutral-200 pl-4  text-black">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t.thinking}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-3 border-t border-neutral-200 p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={userId ? t.placeholderLoggedIn : t.placeholderGuest}
            className="flex-1 border-b border-neutral-300 bg-transparent px-1 py-2  text-black placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center text-black transition hover:text-black disabled:opacity-30"
            aria-label={t.send}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <p className="border-t border-neutral-100 px-6 py-3 text-xs leading-relaxed text-black">
        {t.principles}
      </p>
    </div>
  );
}
