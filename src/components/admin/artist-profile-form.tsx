"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { ARTIST_BIO_TEMPLATE } from "@/lib/curator/wall-text-template";
import {
  adminInputClass,
  adminLabelClass,
  adminSectionClass,
  adminHintClass,
} from "@/components/admin/admin-form-classes";

export function ArtistProfileForm() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setBio(data.bio ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName, bio }),
    });

    setSaving(false);
    setMessage(
      res.ok
        ? "Perfil guardado. El curador usará este texto."
        : "Error al guardar.",
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando perfil…
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className={adminSectionClass}>
      <div>
        <h2>Tu práctica artística</h2>
        <p className={`mt-1 ${adminHintClass}`}>
          El curador de la web lee esto junto con los textos de cada obra.
          Cuanto más claro, menos inventará.
        </p>
      </div>

      <div>
        <label className={adminLabelClass}>Nombre / alias artístico</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={adminInputClass}
          placeholder="Ej. flavor user"
        />
      </div>

      <div>
        <label className={adminLabelClass}>
          Línea de trabajo (manifesto del curador)
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={10}
          className={adminInputClass}
          placeholder={ARTIST_BIO_TEMPLATE}
        />
        <details className="mt-2">
          <summary className={`cursor-pointer ${adminHintClass} text-amber-500/90 hover:text-amber-400`}>
            Ver plantilla para la bio del artista
          </summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-stone-700 bg-stone-950/60 p-3 text-xs text-stone-400">
            {ARTIST_BIO_TEMPLATE}
          </pre>
        </details>
      </div>

      {message && (
        <p className={message.includes("Error") ? "text-red-400" : "text-green-400"}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-stone-950 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Guardar perfil del curador
      </button>
    </form>
  );
}
