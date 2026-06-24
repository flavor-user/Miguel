"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mic, MicOff, Plus, Send, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { localizedPath, type Locale } from "@/lib/i18n/config";
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
  initialMessages?: Message[];
  initialArtworkSlug?: string;
  focusArtworkTitle?: string;
  welcomeMessage: string;
  userId?: string;
  locale: Locale;
  dict: Dictionary;
}

export function ChatInterface({
  conversationId: initialConversationId,
  initialMessages,
  initialArtworkSlug,
  focusArtworkTitle,
  welcomeMessage,
  userId,
  locale,
  dict,
}: ChatInterfaceProps) {
  const t = dict.chat;
  const router = useRouter();
  const hasSavedHistory = Boolean(initialMessages?.length);
  const [messages, setMessages] = useState<Message[]>(
    hasSavedHistory
      ? initialMessages!
      : [{ id: "welcome", role: "assistant", content: welcomeMessage }],
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [showSuggestions, setShowSuggestions] = useState(!hasSavedHistory);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wasLoadingRef = useRef(false);
  const lastSpokenIdRef = useRef<string | null>(null);

  const {
    speakerEnabled,
    toggleSpeaker,
    speakAssistant,
    speakNow,
    previewVoice,
    isListening,
    isSpeaking,
    playingMessageId,
    toggleListening,
    stopListening,
    stopSpeaking,
    micSupported,
    speakerSupported,
    voiceProvider,
    openAiAvailable,
    selectVoiceProvider,
    voices,
    selectedVoiceURI,
    selectVoice,
    pitchPreset,
    selectPitch,
    showPitchControl,
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
                  if (typeof window !== "undefined" && userId) {
                    const url = new URL(window.location.href);
                    url.searchParams.set(
                      "conversacion",
                      parsed.conversationId,
                    );
                    window.history.replaceState({}, "", url.toString());
                  }
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
      userId,
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
        speakAssistant(last.content, last.id);
      }
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, messages, speakerEnabled, speakAssistant]);

  function handleNewConversation() {
    stopListening();
    stopSpeaking();

    const path = localizedPath(locale, "/chat");
    const query = initialArtworkSlug
      ? `?obra=${encodeURIComponent(initialArtworkSlug)}`
      : "";
    router.push(`${path}${query}`);
  }

  function handleReplayMessage(messageId: string, text: string) {
    void speakNow(text, messageId);
  }

  function handleSpeakerToggle() {
    toggleSpeaker(welcomeMessage);
  }

  function handleVoiceProviderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    selectVoiceProvider(e.target.value as "openai" | "browser");
  }

  function handleVoiceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    selectVoice(e.target.value);
  }

  function handlePitchChange(e: React.ChangeEvent<HTMLSelectElement>) {
    selectPitch(e.target.value as "low" | "normal" | "high");
  }

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
      {userId ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-neutral-100 px-4 py-2.5">
          <Link
            href={localizedPath(locale, "/cuenta")}
            className="text-xs text-neutral-500 transition hover:text-neutral-900"
          >
            {t.historyLink}
          </Link>
          <button
            type="button"
            onClick={handleNewConversation}
            disabled={isLoading || isListening}
            className="inline-flex cursor-pointer items-center gap-1.5 border border-neutral-300 px-3 py-1.5 text-xs text-neutral-800 transition hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.newChat}
          </button>
        </div>
      ) : null}

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
              {msg.role === "assistant" &&
              msg.content.trim() &&
              speakerSupported ? (
                <button
                  type="button"
                  onClick={() => handleReplayMessage(msg.id, msg.content)}
                  className={cn(
                    "mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs transition",
                    playingMessageId === msg.id && isSpeaking
                      ? "text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900",
                  )}
                  title={
                    playingMessageId === msg.id && isSpeaking
                      ? t.voiceStop
                      : t.voiceReplay
                  }
                >
                  {playingMessageId === msg.id && isSpeaking ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                  {playingMessageId === msg.id && isSpeaking
                    ? t.voiceStop
                    : t.voiceReplay}
                </button>
              ) : null}
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

        {speakerEnabled && speakerSupported ? (
          <div className="flex flex-wrap items-end gap-3 border-t border-neutral-100 px-4 py-3">
            {openAiAvailable ? (
              <label className="min-w-[10rem] flex-1">
                <span className="mb-1 block text-xs text-neutral-500">
                  {t.voiceProviderLabel}
                </span>
                <select
                  value={voiceProvider}
                  onChange={handleVoiceProviderChange}
                  className="w-full cursor-pointer border-b border-neutral-300 bg-white py-1.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="openai">{t.voiceProviderOpenAi}</option>
                  <option value="browser">{t.voiceProviderBrowser}</option>
                </select>
              </label>
            ) : null}

            <label className="min-w-[10rem] flex-1">
              <span className="mb-1 block text-xs text-neutral-500">
                {t.voiceLabel}
              </span>
              <select
                value={selectedVoiceURI ?? ""}
                onChange={handleVoiceChange}
                className="w-full cursor-pointer border-b border-neutral-300 bg-white py-1.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
              >
                {voices.length === 0 ? (
                  <option value="">{t.voiceDefault}</option>
                ) : (
                  voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            {showPitchControl ? (
              <label className="min-w-[7rem]">
                <span className="mb-1 block text-xs text-neutral-500">
                  {t.pitchLabel}
                </span>
                <select
                  value={pitchPreset}
                  onChange={handlePitchChange}
                  className="w-full cursor-pointer border-b border-neutral-300 bg-white py-1.5 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="low">{t.pitchLow}</option>
                  <option value="normal">{t.pitchNormal}</option>
                  <option value="high">{t.pitchHigh}</option>
                </select>
              </label>
            ) : null}

            <button
              type="button"
              onClick={() => previewVoice(welcomeMessage)}
              className="cursor-pointer border-b border-neutral-300 py-1.5 text-xs text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              {t.voicePreview}
            </button>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-neutral-200 p-4"
        >
          <button
            type="button"
            onClick={handleSpeakerToggle}
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
