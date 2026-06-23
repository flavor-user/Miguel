"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ExternalLink, Loader2, Upload } from "lucide-react";
import { localizedPath, type Locale } from "@/lib/i18n/config";

interface ArtworkForEdit {
  id: string;
  slug: string;
  title: string;
  artist: string | null;
  year: number | null;
  medium: string | null;
  description: string | null;
  essay: string | null;
  image_url: string;
  image_alt: string | null;
  source_url: string | null;
  tags: string[];
  concepts: string[];
  is_published: boolean;
}

async function readApiError(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { error?: string };
    return data.error ?? "Error al guardar";
  } catch {
    return text.trim() || `Error ${response.status}`;
  }
}

export function ArtworkEditForm({
  locale,
  artworkId,
}: {
  locale: Locale;
  artworkId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artwork, setArtwork] = useState<ArtworkForEdit | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState("");
  const [imageHeight, setImageHeight] = useState("");
  const [replaceImage, setReplaceImage] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/artworks/${artworkId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(await readApiError(res));
        }
        const data = (await res.json()) as ArtworkForEdit;
        setArtwork(data);
        setPreview(data.image_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la obra");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [artworkId]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setReplaceImage(true);

    const img = new window.Image();
    img.onload = () => {
      setImageWidth(String(img.naturalWidth));
      setImageHeight(String(img.naturalHeight));
    };
    img.src = objectUrl;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!artwork) return;

    setSaving(true);
    setError("");
    setSavedSlug(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!formData.get("isPublished")) {
      formData.set("isPublished", "false");
    }

    if (!replaceImage) {
      formData.delete("image");
    }

    try {
      const response = await fetch(`/api/admin/artworks/${artworkId}`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = (await response.json()) as {
        artwork: { slug: string; title: string };
        url: string;
      };

      setSavedSlug(data.artwork.slug);
      setArtwork((prev) =>
        prev ? { ...prev, slug: data.artwork.slug, title: data.artwork.title } : prev,
      );
      setReplaceImage(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 placeholder:text-stone-600 focus:border-amber-600 focus:outline-none";

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-stone-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando obra…
      </div>
    );
  }

  if (!artwork) {
    return (
      <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        {error || "Obra no encontrada"}
      </p>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-stone-800 p-6">
          <h2 className="text-stone-100">Imagen</h2>
          <p className="text-sm text-stone-500">
            La imagen actual se mantiene. Elige otra solo si quieres reemplazarla.
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-stone-700 bg-stone-950/50 px-6 py-10 transition hover:border-amber-700/50">
            <Upload className="h-8 w-8 text-stone-500" />
            <span className="text-stone-400">
              Cambiar imagen (opcional — JPG, PNG, WebP — máx. 4 MB)
            </span>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp,image/gif"
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
            <label className="mb-1 block text-stone-400">Título *</label>
            <input
              name="title"
              required
              defaultValue={artwork.title}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-stone-400">Artista</label>
              <input
                name="artist"
                defaultValue={artwork.artist ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-stone-400">Año</label>
              <input
                name="year"
                type="number"
                defaultValue={artwork.year ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-stone-400">Técnica / soporte</label>
            <input
              name="medium"
              defaultValue={artwork.medium ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-stone-400">
              Descripción corta (ficha)
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={artwork.description ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-stone-400">
              Texto de sala (ensayo largo)
            </label>
            <textarea
              name="essay"
              rows={10}
              defaultValue={artwork.essay ?? ""}
              className={inputClass}
              placeholder="Aquí el curador encontrará el contexto de la obra…"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-stone-800 p-6">
          <h2 className="text-stone-100">Clasificación</h2>

          <div>
            <label className="mb-1 block text-stone-400">
              Etiquetas (separadas por comas)
            </label>
            <input
              name="tags"
              defaultValue={artwork.tags.join(", ")}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-stone-400">
              Conceptos (separados por comas)
            </label>
            <input
              name="concepts"
              defaultValue={artwork.concepts.join(", ")}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-stone-400">
              Texto alternativo de imagen
            </label>
            <input
              name="imageAlt"
              defaultValue={artwork.image_alt ?? artwork.title}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-stone-400">Enlace externo</label>
            <input
              name="sourceUrl"
              type="url"
              defaultValue={artwork.source_url ?? ""}
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-3 text-stone-300">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={artwork.is_published}
              className="h-4 w-4 rounded border-stone-600"
            />
            Publicada en la galería
          </label>
        </section>

        {error && (
          <p className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
            {error}
          </p>
        )}

        {savedSlug && (
          <div className="flex items-start gap-3 rounded-xl border border-green-900/50 bg-green-950/20 px-4 py-3 text-green-300">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>Cambios guardados.</p>
              <Link
                href={localizedPath(locale, `/galeria/${savedSlug}`)}
                className="mt-1 inline-flex items-center gap-1 hover:underline"
              >
                Ver en la galería <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 text-stone-950 transition hover:bg-amber-500 disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Guardando…
            </>
          ) : (
            "Guardar cambios"
          )}
        </button>
      </form>

      <aside className="space-y-4">
        <div className="sticky top-24 rounded-2xl border border-stone-800 p-4">
          <p className="mb-3 text-stone-500">Vista previa</p>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="block h-auto w-full" />
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-xl bg-stone-900 text-stone-600">
              Sin imagen
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
