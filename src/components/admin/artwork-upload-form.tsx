"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Upload, CheckCircle, ExternalLink } from "lucide-react";
import { localizedPath, type Locale } from "@/lib/i18n/config";

export function ArtworkUploadForm({ locale }: { locale: Locale }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState("");
  const [imageHeight, setImageHeight] = useState("");
  const [result, setResult] = useState<{ url: string; title: string } | null>(
    null,
  );
  const [error, setError] = useState("");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const img = new window.Image();
    img.onload = () => {
      setImageWidth(String(img.naturalWidth));
      setImageHeight(String(img.naturalHeight));
    };
    img.src = objectUrl;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/admin/artworks", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const text = await response.text();
      let data: { error?: string; url?: string; artwork?: { title: string } };
      try {
        data = JSON.parse(text) as typeof data;
      } catch {
        throw new Error(text.trim() || `Error ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error ?? "Error al guardar");
      }

      setResult({ url: data.url!, title: data.artwork!.title });
      form.reset();
      setPreview(null);
      setImageWidth("");
      setImageHeight("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3  text-stone-100 placeholder:text-stone-600 focus:border-amber-600 focus:outline-none";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-stone-800 p-6">
          <h2 className="text-stone-100">Imagen</h2>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-stone-700 bg-stone-950/50 px-6 py-10 transition hover:border-amber-700/50">
            <Upload className="h-8 w-8 text-stone-500" />
            <span className=" text-stone-400">
              Haz clic para elegir imagen (JPG, PNG, WebP — máx. 4 MB)
            </span>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp,image/gif"
              required
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
          <input type="hidden" name="imageWidth" value={imageWidth} />
          <input type="hidden" name="imageHeight" value={imageHeight} />
        </section>

        <section className="space-y-4 rounded-2xl border border-stone-800 p-6">
          <h2 className="text-stone-100">Ficha de la obra</h2>

          <div>
            <label className="mb-1 block  text-stone-400">Título *</label>
            <input
              name="title"
              required
              className={inputClass}
              placeholder="Ej. Esferas Gomu"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block  text-stone-400">Artista</label>
              <input
                name="artist"
                className={inputClass}
                placeholder="Ej. flavor user"
              />
            </div>
            <div>
              <label className="mb-1 block  text-stone-400">Año</label>
              <input
                name="year"
                type="number"
                className={inputClass}
                placeholder="1889"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block  text-stone-400">
              Técnica / soporte
            </label>
            <input
              name="medium"
              className={inputClass}
              placeholder="Ej. Óleo sobre lienzo"
            />
          </div>

          <div>
            <label className="mb-1 block  text-stone-400">
              Descripción corta (ficha)
            </label>
            <textarea
              name="description"
              rows={3}
              className={inputClass}
              placeholder="2–3 frases: qué se ve, de qué trata la pieza en una línea…"
            />
          </div>

          <div>
            <label className="mb-1 block  text-stone-400">
              Texto de sala (ensayo largo)
            </label>
            <textarea
              name="essay"
              rows={8}
              className={inputClass}
              placeholder="Texto de sala para el curador y los visitantes: materiales, proceso, intención, referencias, relación con otras obras tuyas…"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-stone-800 p-6">
          <h2 className="text-stone-100">Clasificación</h2>

          <div>
            <label className="mb-1 block  text-stone-400">
              Etiquetas (separadas por comas)
            </label>
            <input
              name="tags"
              className={inputClass}
              placeholder="fragilidad, objeto, mesa, serie 2024"
            />
          </div>

          <div>
            <label className="mb-1 block  text-stone-400">
              Conceptos (separados por comas)
            </label>
            <input
              name="concepts"
              className={inputClass}
              placeholder="Fragilidad, Objeto, Material"
            />
            <p className="mt-1 text-xs text-stone-600">
              Se crean automáticamente si no existen. Conectan la obra con la
              red de conceptos.
            </p>
          </div>

          <div>
            <label className="mb-1 block  text-stone-400">
              Texto alternativo de imagen (accesibilidad)
            </label>
            <input
              name="imageAlt"
              className={inputClass}
              placeholder="Describe la imagen brevemente"
            />
          </div>

          <div>
            <label className="mb-1 block  text-stone-400">
              Enlace externo (opcional)
            </label>
            <input
              name="sourceUrl"
              type="url"
              className={inputClass}
              placeholder="https://…"
            />
          </div>

          <label className="flex items-center gap-3  text-stone-300">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked
              className="h-4 w-4 rounded border-stone-600"
            />
            Publicar en la galería inmediatamente
          </label>
        </section>

        {error && (
          <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3  text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="flex items-start gap-3 rounded-xl border border-green-900/50 bg-green-950/20 px-4 py-3  text-green-300">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>«{result.title}» guardada correctamente.</p>
              <Link
                href={localizedPath(locale, result.url)}
                className="mt-1 inline-flex items-center gap-1  hover:underline"
              >
                Ver en la galería <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5  text-stone-950 transition hover:bg-amber-500 disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Subiendo…
            </>
          ) : (
            "Publicar obra en la galería"
          )}
        </button>
      </form>

      <aside className="space-y-4">
        <div className="sticky top-24 rounded-2xl border border-stone-800 p-4">
          <p className="mb-3 text-stone-500">Vista previa</p>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Vista previa"
              className="block h-auto w-full"
            />
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-xl bg-stone-900  text-stone-600">
              Sin imagen
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-stone-800 p-4  text-stone-500">
          <p className=" text-stone-400">Consejos</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              El <strong>texto de sala</strong> es lo que el curador usa para
              hablar de la obra.
            </li>
            <li>
              Sin texto, el curador dirá que falta documentación — no inventará.
            </li>
            <li>Los conceptos conectan obras entre sí en conversaciones.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
