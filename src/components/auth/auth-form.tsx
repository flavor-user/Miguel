"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { localizedPath, type Locale } from "@/lib/i18n/config";

export function AuthForm({
  mode,
  locale,
  dict,
  redirectTo,
}: {
  mode: "login" | "register";
  locale: Locale;
  dict: Dictionary;
  redirectTo?: string;
}) {
  const t = dict.auth;
  const accountPath = redirectTo ?? localizedPath(locale, "/cuenta");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error">("ok");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("ok");

    try {
      if (!isSupabaseConfigured()) {
        throw new Error(
          locale === "es"
            ? "Supabase no está configurado en el servidor. Revisa las variables en Vercel y vuelve a desplegar."
            : locale === "ja"
              ? "Supabaseがサーバーで設定されていません。Vercelの環境変数を確認して再デプロイしてください。"
              : "Supabase is not configured on the server. Check Vercel environment variables and redeploy.",
        );
      }

      const supabase = createClient();

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}${localizedPath(locale, "/cuenta")}`,
          },
        });
        if (error) throw error;

        if (data.session) {
          setMessage(t.entering);
          window.location.href = localizedPath(locale, "/cuenta");
          return;
        }

        setMessage(t.accountCreated);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        window.location.href = accountPath;
      }
    } catch (err) {
      setMessageType("error");
      const text = err instanceof Error ? err.message : "Error";
      if (text.toLowerCase().includes("invalid login credentials")) {
        setMessage(t.invalidCredentials);
      } else if (text.toLowerCase().includes("already registered")) {
        setMessage(t.alreadyRegistered);
      } else {
        setMessage(text);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "register" && (
        <div>
          <label className="mb-1 block  ">{t.name}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border-b border-neutral-300 bg-transparent px-1 py-2  focus:border-neutral-900 focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block  ">{t.email}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-b border-neutral-300 bg-transparent px-1 py-2  focus:border-neutral-900 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block  ">{t.password}</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-b border-neutral-300 bg-transparent px-1 py-2  focus:border-neutral-900 focus:outline-none"
          placeholder={t.passwordHint}
        />
      </div>

      {message && (
        <p className={` ${messageType === "error" ? "text-red-600" : ""}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full border border-neutral-900 py-3  transition hover:bg-neutral-900 hover:text-white disabled:opacity-40"
      >
        {loading ? t.waiting : mode === "register" ? t.createAccount : t.signIn}
      </button>

      <p className="text-center  ">
        {mode === "register" ? (
          <>
            {t.hasAccount}{" "}
            <Link
              href={localizedPath(locale, "/login")}
              className=" hover:underline"
            >
              {t.signIn}
            </Link>
          </>
        ) : (
          <>
            {t.noAccount}{" "}
            <Link
              href={localizedPath(locale, "/registro")}
              className=" hover:underline"
            >
              {t.createAccount}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

export function SignOutButton({
  label,
  locale,
}: {
  label: string;
  locale: Locale;
}) {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = localizedPath(locale, "/");
  }

  return (
    <button onClick={handleSignOut} className="transition">
      {label}
    </button>
  );
}
