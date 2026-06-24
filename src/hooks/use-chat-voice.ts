"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import {
  buildSpeakOptions,
  getSpeechRecognitionCtor,
  getStoredOpenAiVoice,
  getStoredPitchPreset,
  getStoredVoiceProvider,
  getStoredVoiceUri,
  isBrowserSpeakerSupported,
  isMicrophoneSupported,
  listOpenAiVoiceOptions,
  listVoicesForLocale,
  speakTextBrowser,
  speakTextOpenAi,
  stopSpeaking,
  storeOpenAiVoice,
  storePitchPreset,
  storeVoiceProvider,
  storeVoiceUri,
  voiceLangForLocale,
  type VoiceOption,
  type VoicePitchPreset,
  type VoiceProvider,
} from "@/lib/chat/voice";

export function useChatVoice(locale: Locale) {
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [browserSpeakerSupported, setBrowserSpeakerSupported] = useState(false);
  const [openAiAvailable, setOpenAiAvailable] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>("openai");
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [selectedOpenAiVoice, setSelectedOpenAiVoice] = useState("nova");
  const [pitchPreset, setPitchPreset] = useState<VoicePitchPreset>("normal");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speakerSupported = openAiAvailable || browserSpeakerSupported;

  const speakOptions = useMemo(
    () => buildSpeakOptions(selectedVoiceURI, pitchPreset),
    [pitchPreset, selectedVoiceURI],
  );

  useEffect(() => {
    setMicSupported(isMicrophoneSupported());
    setBrowserSpeakerSupported(isBrowserSpeakerSupported());
    setPitchPreset(getStoredPitchPreset());
    setVoiceProvider(getStoredVoiceProvider());
    setSelectedOpenAiVoice(getStoredOpenAiVoice());

    function refreshBrowserVoices() {
      const next = listVoicesForLocale(locale);
      setVoices(next);

      const stored = getStoredVoiceUri();
      const storedValid = stored && next.some((voice) => voice.id === stored);
      if (storedValid) {
        setSelectedVoiceURI(stored);
      } else if (next[0]) {
        setSelectedVoiceURI(next[0].id);
      }
    }

    refreshBrowserVoices();

    fetch("/api/chat/speech")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.available && Array.isArray(data.voices)) {
          setOpenAiAvailable(true);
          setVoices(listOpenAiVoiceOptions(data.voices));
          const stored = getStoredOpenAiVoice();
          if (data.voices.includes(stored)) {
            setSelectedOpenAiVoice(stored);
          } else if (data.voices[0]) {
            setSelectedOpenAiVoice(data.voices[0]);
          }
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = refreshBrowserVoices;
    }

    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [locale]);

  useEffect(() => {
    if (voiceProvider === "openai" && openAiAvailable) {
      fetch("/api/chat/speech")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.voices) {
            setVoices(listOpenAiVoiceOptions(data.voices));
          }
        })
        .catch(() => {});
    } else if (voiceProvider === "browser") {
      setVoices(listVoicesForLocale(locale));
    }
  }, [voiceProvider, openAiAvailable, locale]);

  const speakNow = useCallback(
    async (text: string) => {
      if (!speakerSupported || !text.trim()) return;

      if (voiceProvider === "openai" && openAiAvailable) {
        const ok = await speakTextOpenAi(text, selectedOpenAiVoice);
        if (ok) return;
      }

      if (browserSpeakerSupported) {
        speakTextBrowser(text, locale, speakOptions);
      }
    },
    [
      browserSpeakerSupported,
      locale,
      openAiAvailable,
      selectedOpenAiVoice,
      speakOptions,
      speakerSupported,
      voiceProvider,
    ],
  );

  const disableSpeaker = useCallback(() => {
    stopSpeaking();
    setSpeakerEnabled(false);
  }, []);

  const enableSpeaker = useCallback(
    (sampleText?: string) => {
      setSpeakerEnabled(true);
      if (sampleText?.trim()) {
        void speakNow(sampleText);
      }
    },
    [speakNow],
  );

  const toggleSpeaker = useCallback(
    (sampleText?: string) => {
      setSpeakerEnabled((on) => {
        if (on) {
          stopSpeaking();
          return false;
        }
        if (sampleText?.trim()) {
          setTimeout(() => void speakNow(sampleText), 0);
        }
        return true;
      });
    },
    [speakNow],
  );

  const speakAssistant = useCallback(
    (text: string) => {
      if (!speakerEnabled) return;
      void speakNow(text);
    },
    [speakerEnabled, speakNow],
  );

  const selectVoiceProvider = useCallback((provider: VoiceProvider) => {
    setVoiceProvider(provider);
    storeVoiceProvider(provider);
  }, []);

  const selectVoice = useCallback(
    (voiceId: string) => {
      if (voiceProvider === "openai") {
        setSelectedOpenAiVoice(voiceId);
        storeOpenAiVoice(voiceId);
      } else {
        setSelectedVoiceURI(voiceId);
        storeVoiceUri(voiceId);
      }
    },
    [voiceProvider],
  );

  const selectPitch = useCallback((preset: VoicePitchPreset) => {
    setPitchPreset(preset);
    storePitchPreset(preset);
  }, []);

  const previewVoice = useCallback(
    (sampleText: string) => {
      void speakNow(sampleText);
    },
    [speakNow],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onFinalTranscript: (text: string) => void) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor || isListening) return false;

      stopSpeaking();
      const recognition = new Ctor();
      recognition.lang = voiceLangForLocale(locale);
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal && transcript.trim()) {
            onFinalTranscript(transcript.trim());
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
        return true;
      } catch {
        setIsListening(false);
        return false;
      }
    },
    [isListening, locale],
  );

  const toggleListening = useCallback(
    (onFinalTranscript: (text: string) => void) => {
      if (isListening) {
        stopListening();
        return;
      }
      startListening(onFinalTranscript);
    },
    [isListening, startListening, stopListening],
  );

  const activeVoiceId =
    voiceProvider === "openai" ? selectedOpenAiVoice : selectedVoiceURI;

  return {
    speakerEnabled,
    toggleSpeaker,
    disableSpeaker,
    enableSpeaker,
    speakAssistant,
    speakNow,
    previewVoice,
    isListening,
    toggleListening,
    stopListening,
    stopSpeaking,
    micSupported,
    speakerSupported,
    voiceProvider,
    openAiAvailable,
    selectVoiceProvider,
    voices,
    selectedVoiceURI: activeVoiceId,
    selectVoice,
    pitchPreset,
    selectPitch,
    showPitchControl: voiceProvider === "browser",
  };
}
