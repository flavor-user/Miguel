"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  ARTWORK_PRACTICE_HINT,
  ARTWORK_PRACTICE_TEMPLATE,
  WALL_TEXT_ESSAY_TEMPLATE,
  WALL_TEXT_SHORT_HINT,
} from "@/lib/curator/wall-text-template";
import { adminAsideClass, adminHintClass } from "@/components/admin/admin-form-classes";

type WallTextTemplateGuideProps = {
  onUseTemplate?: (text: string) => void;
  onUsePracticeTemplate?: (text: string) => void;
};

export function WallTextTemplateGuide({
  onUseTemplate,
  onUsePracticeTemplate,
}: WallTextTemplateGuideProps) {
  const [copiedEssay, setCopiedEssay] = useState(false);
  const [copiedPractice, setCopiedPractice] = useState(false);

  async function copyEssayTemplate() {
    try {
      await navigator.clipboard.writeText(WALL_TEXT_ESSAY_TEMPLATE);
      setCopiedEssay(true);
      onUseTemplate?.(WALL_TEXT_ESSAY_TEMPLATE);
      setTimeout(() => setCopiedEssay(false), 2000);
    } catch {
      onUseTemplate?.(WALL_TEXT_ESSAY_TEMPLATE);
    }
  }

  async function copyPracticeTemplate() {
    try {
      await navigator.clipboard.writeText(ARTWORK_PRACTICE_TEMPLATE);
      setCopiedPractice(true);
      onUsePracticeTemplate?.(ARTWORK_PRACTICE_TEMPLATE);
      setTimeout(() => setCopiedPractice(false), 2000);
    } catch {
      onUsePracticeTemplate?.(ARTWORK_PRACTICE_TEMPLATE);
    }
  }

  return (
    <div className={`${adminAsideClass} text-stone-400`}>
      <p className="font-bold text-stone-50">Plantillas por obra</p>
      <p className={`mt-2 ${adminHintClass}`}>
        <strong className="text-stone-300">Marco y práctica</strong> sitúa la pieza
        en Flavor User Day X/30 y tus referencias.{" "}
        <strong className="text-stone-300">Texto de sala</strong> es el ensayo
        principal — el curador habla solo desde lo que escribas.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-stone-200">Marco y práctica</p>
          <p className={`mt-1 ${adminHintClass}`}>{ARTWORK_PRACTICE_HINT}</p>
          <button
            type="button"
            onClick={copyPracticeTemplate}
            className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone-600 px-3 py-2 text-sm text-stone-200 transition hover:border-amber-600 hover:text-amber-100"
          >
            {copiedPractice ? (
              <>
                <Check className="h-4 w-4" />
                Copiada — pega en marco y práctica
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar plantilla de marco
              </>
            )}
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold text-stone-200">Texto de sala</p>
          <details className="mt-1">
            <summary className="cursor-pointer text-sm text-amber-500/90 hover:text-amber-400">
              Ver plantilla completa
            </summary>
            <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-stone-700 bg-stone-950/60 p-3 text-xs leading-relaxed text-stone-300">
              {WALL_TEXT_ESSAY_TEMPLATE}
            </pre>
          </details>
          <button
            type="button"
            onClick={copyEssayTemplate}
            className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone-600 px-3 py-2 text-sm text-stone-200 transition hover:border-amber-600 hover:text-amber-100"
          >
            {copiedEssay ? (
              <>
                <Check className="h-4 w-4" />
                Copiada — pega en texto de sala
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar plantilla de texto de sala
              </>
            )}
          </button>
        </div>
      </div>

      <p className={`mt-4 ${adminHintClass}`}>
        <strong className="text-stone-300">Ficha corta:</strong>{" "}
        {WALL_TEXT_SHORT_HINT}
      </p>
    </div>
  );
}

export { WALL_TEXT_SHORT_HINT };
