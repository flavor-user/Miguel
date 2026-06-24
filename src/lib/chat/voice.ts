import type { Locale } from "@/lib/i18n/config";

export type VoicePitchPreset = "low" | "normal" | "high";

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

export function isSpeakerSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  window.speechSynthesis.cancel();
}

export function listVoicesForLocale(locale: Locale): VoiceOption[] {
  if (!isSpeakerSupported()) return [];

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

export function speakText(
  text: string,
  locale: Locale,
  options?: SpeakOptions,
): void {
  if (!isSpeakerSupported() || !text.trim()) return;

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
