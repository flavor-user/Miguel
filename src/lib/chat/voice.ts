import type { Locale } from "@/lib/i18n/config";

export type VoicePitchPreset = "low" | "normal" | "high";
export type VoiceProvider = "openai" | "browser";

export type VoiceOption = {
  id: string;
  name: string;
  lang: string;
};

export type SpeakOptions = {
  voiceURI?: string;
  pitch?: number;
  rate?: number;
};

const VOICE_URI_KEY = "fu-curator-voice-uri";
const VOICE_PITCH_KEY = "fu-curator-voice-pitch";
const VOICE_PROVIDER_KEY = "fu-curator-voice-provider";
const OPENAI_VOICE_KEY = "fu-curator-openai-voice";

export const OPENAI_VOICE_LABELS: Record<string, string> = {
  nova: "Nova (cálida)",
  shimmer: "Shimmer (suave)",
  alloy: "Alloy (neutra)",
  echo: "Echo (masculina)",
  fable: "Fable (narrativa)",
  onyx: "Onyx (grave)",
};

let activeSpeakSession = 0;
let openAiAbortController: AbortController | null = null;
let activeOpenAiAudio: HTMLAudioElement | null = null;

function cancelBrowserSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

function stopOpenAiAudio(): void {
  openAiAbortController?.abort();
  openAiAbortController = null;

  if (!activeOpenAiAudio) return;
  activeOpenAiAudio.pause();
  activeOpenAiAudio.removeAttribute("src");
  activeOpenAiAudio.load();
  activeOpenAiAudio = null;
}

function invalidatePendingPlayback(): void {
  activeSpeakSession += 1;
  stopOpenAiAudio();
  cancelBrowserSpeech();
}

function beginSpeakSession(): number {
  invalidatePendingPlayback();
  return activeSpeakSession;
}

function isActiveSession(session: number): boolean {
  return session === activeSpeakSession;
}

export function isSpeakingActive(): boolean {
  if (activeOpenAiAudio && !activeOpenAiAudio.paused && !activeOpenAiAudio.ended) {
    return true;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    return (
      window.speechSynthesis.speaking || window.speechSynthesis.pending
    );
  }
  return false;
}

export function voiceLangForLocale(locale: Locale): string {
  switch (locale) {
    case "es":
      return "es-ES";
    case "ja":
      return "ja-JP";
    default:
      return "en-US";
  }
}

export function pitchFromPreset(preset: VoicePitchPreset): number {
  switch (preset) {
    case "low":
      return 0.82;
    case "high":
      return 1.12;
    default:
      return 1;
  }
}

export function getStoredVoiceProvider(): VoiceProvider {
  if (typeof window === "undefined") return "openai";
  const value = localStorage.getItem(VOICE_PROVIDER_KEY);
  return value === "browser" ? "browser" : "openai";
}

export function storeVoiceProvider(provider: VoiceProvider): void {
  localStorage.setItem(VOICE_PROVIDER_KEY, provider);
}

export function getStoredOpenAiVoice(): string {
  if (typeof window === "undefined") return "nova";
  return localStorage.getItem(OPENAI_VOICE_KEY) ?? "nova";
}

export function storeOpenAiVoice(voice: string): void {
  localStorage.setItem(OPENAI_VOICE_KEY, voice);
}

export function getStoredVoiceUri(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VOICE_URI_KEY);
}

export function storeVoiceUri(voiceURI: string): void {
  localStorage.setItem(VOICE_URI_KEY, voiceURI);
}

export function getStoredPitchPreset(): VoicePitchPreset {
  if (typeof window === "undefined") return "normal";
  const value = localStorage.getItem(VOICE_PITCH_KEY);
  if (value === "low" || value === "high") return value;
  return "normal";
}

export function storePitchPreset(preset: VoicePitchPreset): void {
  localStorage.setItem(VOICE_PITCH_KEY, preset);
}

export function getSpeechRecognitionCtor():
  | (new () => SpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isMicrophoneSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function isBrowserSpeakerSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking(): void {
  invalidatePendingPlayback();
}

export function listVoicesForLocale(locale: Locale): VoiceOption[] {
  if (!isBrowserSpeakerSupported()) return [];

  const lang = voiceLangForLocale(locale);
  const langPrefix = lang.slice(0, 2);
  const all = window.speechSynthesis.getVoices();

  const matching = all.filter(
    (voice) =>
      voice.lang.startsWith(langPrefix) ||
      voice.lang.replace("_", "-").startsWith(lang),
  );

  const pool = matching.length > 0 ? matching : all;

  return pool
    .map((voice) => ({
      id: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function speakTextBrowser(
  text: string,
  locale: Locale,
  options?: SpeakOptions,
): Promise<boolean> {
  const trimmed = text.trim();
  if (!isBrowserSpeakerSupported() || !trimmed) {
    return Promise.resolve(false);
  }

  const session = beginSpeakSession();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = voiceLangForLocale(locale);
    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1;

    if (options?.voiceURI) {
      const voice = window.speechSynthesis
        .getVoices()
        .find((item) => item.voiceURI === options.voiceURI);
      if (voice) utterance.voice = voice;
    }

    const finish = (played: boolean) => {
      if (!isActiveSession(session)) {
        resolve(false);
        return;
      }
      resolve(played);
    };

    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);

    window.speechSynthesis.speak(utterance);
  });
}

export async function speakTextOpenAi(
  text: string,
  voice: string,
): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const session = beginSpeakSession();
  const controller = new AbortController();
  openAiAbortController = controller;

  try {
    const res = await fetch("/api/chat/speech", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, voice }),
      signal: controller.signal,
    });

    if (!isActiveSession(session)) return false;
    if (!res.ok) return false;

    const blob = await res.blob();
    if (!isActiveSession(session)) return false;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeOpenAiAudio = audio;

    return await new Promise<boolean>((resolve) => {
      const cleanup = () => {
        URL.revokeObjectURL(url);
        if (activeOpenAiAudio === audio) activeOpenAiAudio = null;
      };

      audio.onended = () => {
        cleanup();
        resolve(isActiveSession(session));
      };
      audio.onerror = () => {
        cleanup();
        resolve(false);
      };

      if (!isActiveSession(session)) {
        cleanup();
        resolve(false);
        return;
      }

      void audio.play().catch(() => {
        cleanup();
        resolve(false);
      });
    });
  } catch {
    return false;
  } finally {
    if (openAiAbortController === controller) {
      openAiAbortController = null;
    }
  }
}

export function buildSpeakOptions(
  voiceURI: string | null,
  pitchPreset: VoicePitchPreset,
): SpeakOptions {
  return {
    voiceURI: voiceURI ?? undefined,
    pitch: pitchFromPreset(pitchPreset),
    rate: 0.95,
  };
}

export function listOpenAiVoiceOptions(voices: string[]): VoiceOption[] {
  return voices.map((id) => ({
    id,
    name: OPENAI_VOICE_LABELS[id] ?? id,
    lang: "OpenAI",
  }));
}

/** @deprecated Use speakTextBrowser or speakTextOpenAi */
export function speakText(
  text: string,
  locale: Locale,
  options?: SpeakOptions,
): void {
  void speakTextBrowser(text, locale, options);
}

/** @deprecated Use isBrowserSpeakerSupported */
export function isSpeakerSupported(): boolean {
  return isBrowserSpeakerSupported();
}
