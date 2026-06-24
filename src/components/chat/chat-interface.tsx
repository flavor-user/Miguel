"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { CuratorSuggestedPrompts } from "@/components/chat/curator-suggested-prompts";
import { getSuggestedPrompts } from "@/lib/curator/suggested-prompts";
import { useChatVoice } from "@/hooks/use-chat-voice";

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
  const wasLoadingRef = useRef(false);
  const lastSpokenIdRef = useRef<string | null>(null);

  const {
    speakerEnabled,
    toggleSpeaker,
    speakAssistant,
    isListening,
    toggleListening,
    stopListening,
    stopSpeaking,
    micSupported,
    speakerSupported,
  } = useChatVoice(locale);

  const suggestedPrompts = getSuggestedPrompts(locale, focusArtworkTitle);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      stopListening();
      stopSpeaking();
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
          credentials: "include",
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
            const lines = chunk
              .split("\n")
              .filter((l) => l.startsWith("data: "));

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
                        : m,
                    ),
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

        if (assistantContent.trim()) {
          lastSpokenIdRef.current = assistantId;
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
    [
      conversationId,
      initialArtworkSlug,
      isLoading,
      stopListening,
      stopSpeaking,
      t.error,
    ],
  );

  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && speakerEnabled) {
      const last = messages[messages.length - 1];
      if (
        last?.role === "assistant" &&
        last.id !== "welcome" &&
        last.content.trim() &&
        lastSpokenIdRef.current === last.id
      ) {
        speakAssistant(last.content);
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, messages, speakerEnabled, speakAssistant]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  function handleMicClick() {
    toggleListening((transcript) => {
      setInput(transcript);
      void sendMessage(transcript);
    });
  }

  const iconButtonClass =
    "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center transition hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex flex-col border border-neutral-200 bg-white">
      {showSuggestions && messages.length === 1 ? (
        <CuratorSuggestedPrompts
          locale={locale}
          prompts={suggestedPrompts}
          label={t.suggestedLabel}
          disabled={isLoading || isListening}
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
                "max-w-[90%] leading-relaxed",
                msg.role === "user"
                  ? "ml-auto text-right"
                  : "border-l-2 border-neutral-200 pl-4",
              )}
            >
              {msg.role === "assistant" && msg.id !== "welcome" ? (
                <p className="mb-1">{t.badge}</p>
              ) : null}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
          {isLoading ? (
            <div className="flex items-center gap-2 border-l-2 border-neutral-200 pl-4">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t.thinking}
            </div>
          ) : null}
          {isListening ? (
            <div className="flex items-center gap-2 border-l-2 border-neutral-200 pl-4 text-neutral-600">
              <Mic className="h-3.5 w-3.5 animate-pulse" />
              {t.listening}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-neutral-200 p-4"
        >
          <button
            type="button"
            onClick={toggleSpeaker}
            disabled={!speakerSupported}
            className={cn(iconButtonClass, speakerEnabled && "opacity-100")}
            aria-pressed={speakerEnabled}
            title={
              speakerSupported
                ? speakerEnabled
                  ? t.speakerOff
                  : t.speakerOn
                : t.speakerUnsupported
            }
          >
            {speakerEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleMicClick}
            disabled={!micSupported || isLoading}
            className={cn(
              iconButtonClass,
              isListening && "text-red-600 opacity-100",
            )}
            aria-pressed={isListening}
            title={
              micSupported
                ? isListening
                  ? t.micStop
                  : t.micStart
                : t.micUnsupported
            }
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={userId ? t.placeholderLoggedIn : t.placeholderGuest}
            className="min-w-0 flex-1 border-b border-neutral-300 bg-transparent px-1 py-2 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            disabled={isLoading || isListening}
          />

          <button
            type="submit"
            disabled={isLoading || isListening || !input.trim()}
            className={iconButtonClass}
            aria-label={t.send}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <p className="border-t border-neutral-100 px-6 py-3 text-xs leading-relaxed">
        {t.principles}
      </p>
    </div>
  );
}
