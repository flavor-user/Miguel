"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ExternalLink, Loader2, Upload } from "lucide-react";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import {
  adminAsideClass,
  adminCheckboxLabelClass,
  adminDropzoneClass,
  adminInputClass,
  adminLabelClass,
  adminSectionClass,
  adminHintClass,
} from "@/components/admin/admin-form-classes";
import { WallTextTemplateGuide } from "@/components/admin/wall-text-template-guide";

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
  const [essay, setEssay] = useState("");

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
        setEssay(data.essay ?? "");
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

  const inputClass = adminInputClass;

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
        <section className={adminSectionClass}>
          <h2>Imagen</h2>
          <p className="text-sm text-stone-500">
            La imagen actual se mantiene. Elige otra solo si quieres reemplazarla.
          </p>
          <label className={adminDropzoneClass}>
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

        <section className={adminSectionClass}>
          <h2>Ficha de la obra</h2>
          <p className={`${adminHintClass} mb-4`}>
            El <strong>texto de sala</strong> es lo principal. La práctica
            general del artista se edita en el{" "}
            <Link
              href={localizedPath(locale, "/admin")}
              className="text-amber-500/90 underline underline-offset-2 hover:text-amber-400"
            >
              panel admin → Tu práctica artística
            </Link>
            .
          </p>

          <div>
            <label className={adminLabelClass}>Título *</label>
            <input
              name="title"
              required
              defaultValue={artwork.title}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={adminLabelClass}>Artista</label>
              <input
                name="artist"
                defaultValue={artwork.artist ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={adminLabelClass}>Año</label>
              <input
                name="year"
                type="number"
                defaultValue={artwork.year ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={adminLabelClass}>Técnica / soporte</label>
            <input
              name="medium"
              defaultValue={artwork.medium ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={adminLabelClass}>Descripción corta (ficha)</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={artwork.description ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={adminLabelClass}>Texto de sala (ensayo largo)</label>
            <textarea
              name="essay"
              rows={12}
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              className={inputClass}
              placeholder="Texto de sala — el curador habla desde aquí."
            />
          </div>
        </section>

        <section className={adminSectionClass}>
          <h2>Clasificación</h2>

          <div>
            <label className={adminLabelClass}>Etiquetas (separadas por comas)</label>
            <input
              name="tags"
              defaultValue={artwork.tags.join(", ")}
              className={inputClass}
            />
          </div>

          <div>
            <label className={adminLabelClass}>Conceptos (separados por comas)</label>
            <input
              name="concepts"
              defaultValue={artwork.concepts.join(", ")}
              className={inputClass}
            />
          </div>

          <div>
            <label className={adminLabelClass}>Texto alternativo de imagen</label>
            <input
              name="imageAlt"
              defaultValue={artwork.image_alt ?? artwork.title}
              className={inputClass}
            />
          </div>

          <div>
            <label className={adminLabelClass}>Enlace externo</label>
            <input
              name="sourceUrl"
              type="url"
              defaultValue={artwork.source_url ?? ""}
              className={inputClass}
            />
          </div>

          <label className={adminCheckboxLabelClass}>
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
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 text-stone-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-10"
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
        <div className={`sticky top-24 ${adminAsideClass}`}>
          <p className="mb-3 font-bold text-stone-50">Vista previa</p>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="block h-auto w-full" />
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-xl bg-stone-900 text-stone-600">
              Sin imagen
            </div>
          )}
        </div>

        <WallTextTemplateGuide onUseTemplate={setEssay} />
      </aside>
    </div>
  );
}
