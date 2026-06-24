"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import {
  getSpeechRecognitionCtor,
  isMicrophoneSupported,
  isSpeakerSupported,
  speakText,
  stopSpeaking,
  voiceLangForLocale,
} from "@/lib/chat/voice";

export function useChatVoice(locale: Locale) {
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [speakerSupported, setSpeakerSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setMicSupported(isMicrophoneSupported());
    setSpeakerSupported(isSpeakerSupported());
    return () => {
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerEnabled((on) => {
      if (on) stopSpeaking();
      return !on;
    });
  }, []);

  const speakAssistant = useCallback(
    (text: string) => {
      if (!speakerEnabled) return;
      speakText(text, locale);
    },
    [locale, speakerEnabled],
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

  return {
    speakerEnabled,
    toggleSpeaker,
    speakAssistant,
    isListening,
    toggleListening,
    stopListening,
    stopSpeaking,
    micSupported,
    speakerSupported,
  };
}
