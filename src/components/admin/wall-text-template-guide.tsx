"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  WALL_TEXT_ESSAY_TEMPLATE,
  WALL_TEXT_SHORT_HINT,
} from "@/lib/curator/wall-text-template";
import { adminAsideClass, adminHintClass } from "@/components/admin/admin-form-classes";

type WallTextTemplateGuideProps = {
  onUseTemplate?: (text: string) => void;
};

export function WallTextTemplateGuide({
  onUseTemplate,
}: WallTextTemplateGuideProps) {
  const [copied, setCopied] = useState(false);

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(WALL_TEXT_ESSAY_TEMPLATE);
      setCopied(true);
      onUseTemplate?.(WALL_TEXT_ESSAY_TEMPLATE);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onUseTemplate?.(WALL_TEXT_ESSAY_TEMPLATE);
    }
  }

  return (
    <div className={`${adminAsideClass} text-stone-400`}>
      <p className="font-bold text-stone-50">Plantilla de texto de sala</p>
      <p className={`mt-2 ${adminHintClass}`}>
        Rellena cada apartado en tu voz. El curador habla solo desde lo que
        escribas — incluidas comparaciones con abstracción o historia del arte
        si las pones en «Marco».
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-amber-500/90 hover:text-amber-400">
          Ver plantilla completa
        </summary>
        <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-stone-700 bg-stone-950/60 p-3 text-xs leading-relaxed text-stone-300">
          {WALL_TEXT_ESSAY_TEMPLATE}
        </pre>
      </details>

      <button
        type="button"
        onClick={copyTemplate}
        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-stone-600 px-3 py-2 text-sm text-stone-200 transition hover:border-amber-600 hover:text-amber-100"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copiada — pega en texto de sala
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copiar plantilla al portapapeles
          </>
        )}
      </button>

      <p className={`mt-3 ${adminHintClass}`}>
        <strong className="text-stone-300">Ficha corta:</strong>{" "}
        {WALL_TEXT_SHORT_HINT}
      </p>
    </div>
  );
}

export { WALL_TEXT_SHORT_HINT };
