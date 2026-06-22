"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  conversationId?: string;
  initialArtworkSlug?: string;
  userId?: string;
  locale: Locale;
  dict: Dictionary;
}

export function ChatInterface({
  conversationId: initialConversationId,
  initialArtworkSlug,
  userId,
  locale,
  dict,
}: ChatInterfaceProps) {
  const t = dict.chat;
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: t.welcome },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialArtworkSlug) {
      const prompts: Record<Locale, string> = {
        es: `Cuéntame sobre la obra "${initialArtworkSlug}" de la galería.`,
        en: `Tell me about the work "${initialArtworkSlug}" in the gallery.`,
        ja: `ギャラリーの作品「${initialArtworkSlug}」について教えてください。`,
      };
      setInput(prompts[locale]);
    }
  }, [initialArtworkSlug, locale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
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
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col border border-neutral-200 bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[85%] px-1 py-2 text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-auto text-right text-neutral-900"
                : "text-neutral-600"
            )}
          >
            {msg.content}
          </div>
        ))}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
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
          className="flex-1 border-b border-neutral-300 bg-transparent px-1 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center text-neutral-900 transition hover:text-neutral-500 disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
