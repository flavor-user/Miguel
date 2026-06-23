"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";

export function SiteAccessForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.access;
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? `/${locale}/galeria`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/site-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        setError(t.wrongCode);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-16">
      <p className="text-neutral-400">{t.badge}</p>
      <h1 className="mt-3 text-neutral-900">{t.title}</h1>
      <p className="mt-4  leading-relaxed text-neutral-500">{t.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <div>
          <label htmlFor="access-code" className="mb-1 block  text-neutral-600">
            {t.label}
          </label>
          <input
            id="access-code"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full border-b border-neutral-300 bg-transparent py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
            placeholder={t.placeholder}
          />
        </div>

        {error ? <p className=" text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full border border-neutral-900 py-3  text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:opacity-40"
        >
          {loading ? t.waiting : t.submit}
        </button>
      </form>

      <p className="mt-8 text-xs leading-relaxed text-neutral-400">{t.note}</p>
    </div>
  );
}
