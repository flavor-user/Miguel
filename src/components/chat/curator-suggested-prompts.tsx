"use client";

import type { Locale } from "@/lib/i18n/config";

interface Props {
  locale: Locale;
  prompts: string[];
  label: string;
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function CuratorSuggestedPrompts({
  prompts,
  label,
  onSelect,
  disabled,
}: Props) {
  return (
    <div className="border-b border-neutral-100 px-6 py-4">
      <p className="mb-3 text-black">{label}</p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt)}
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-left text-xs leading-snug text-black transition hover:border-neutral-400 hover:text-black disabled:opacity-40"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
