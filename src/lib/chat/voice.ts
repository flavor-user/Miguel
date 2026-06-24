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

let openAiAudio: HTMLAudioElement | null = null;

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

export function stopOpenAiAudio(): void {
  if (!openAiAudio) return;
  openAiAudio.pause();
  openAiAudio.src = "";
  openAiAudio = null;
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  stopOpenAiAudio();
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
): void {
  if (!isBrowserSpeakerSupported() || !text.trim()) return;

  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = voiceLangForLocale(locale);
  utterance.rate = options?.rate ?? 0.95;
  utterance.pitch = options?.pitch ?? 1;

  if (options?.voiceURI) {
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.voiceURI === options.voiceURI);
    if (voice) utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}

export async function speakTextOpenAi(
  text: string,
  voice: string,
): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  stopSpeaking();

  try {
    const res = await fetch("/api/chat/speech", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, voice }),
    });

    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    openAiAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (openAiAudio === audio) openAiAudio = null;
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (openAiAudio === audio) openAiAudio = null;
    };

    await audio.play();
    return true;
  } catch {
    return false;
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
  speakTextBrowser(text, locale, options);
}

/** @deprecated Use isBrowserSpeakerSupported */
export function isSpeakerSupported(): boolean {
  return isBrowserSpeakerSupported();
}
