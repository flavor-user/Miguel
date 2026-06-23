"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

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
    setMessage(res.ok ? "Perfil guardado. El curador usará este texto." : "Error al guardar.");
  }

  const inputClass =
    "w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3  text-stone-100 placeholder:text-stone-600 focus:border-amber-600 focus:outline-none";

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-stone-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando perfil…
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-stone-800 p-6">
      <div>
        <h2 className="text-stone-100">Tu práctica artística</h2>
        <p className="mt-1  text-stone-500">
          El curador de la web lee esto junto con los textos de cada obra. Cuanto más claro, menos
          inventará.
        </p>
      </div>

      <div>
        <label className="mb-1 block  text-stone-400">Nombre / alias artístico</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
          placeholder="Ej. flavor user"
        />
      </div>

      <div>
        <label className="mb-1 block  text-stone-400">
          Línea de trabajo (manifesto del curador)
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={8}
          className={inputClass}
          placeholder={`Describe tu estilo, materiales recurrentes, temas, referencias y cómo entiendes tu propio trabajo.\n\nEjemplo: "Trabajo con objetos cotidianos y fotografía. Me interesa la fragilidad mecánica y la relación entre lo doméstico y lo industrial…"`}
        />
      </div>

      {message && (
        <p className={` ${message.includes("Error") ? "text-red-400" : "text-green-400"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5   text-stone-950 hover:bg-amber-500 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar perfil del curador
      </button>
    </form>
  );
}
