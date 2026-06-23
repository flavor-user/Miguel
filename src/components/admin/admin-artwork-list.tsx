"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { localizedPath, type Locale } from "@/lib/i18n/config";

interface ArtworkRow {
  id: string;
  slug: string;
  title: string;
  artist: string | null;
  is_published: boolean;
  image_url: string;
  created_at: string;
}

export function AdminArtworkList({ locale }: { locale: Locale }) {
  const [artworks, setArtworks] = useState<ArtworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/artworks");
      if (res.ok) {
        setArtworks(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(id: string, publish: boolean) {
    setActionId(id);
    await fetch(`/api/admin/artworks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: publish }),
    });
    await load();
    setActionId(null);
  }

  async function remove(id: string, title: string) {
    if (!confirm(`¿Borrar «${title}»? Esta acción no se puede deshacer.`))
      return;
    setActionId(id);
    await fetch(`/api/admin/artworks/${id}`, { method: "DELETE" });
    await load();
    setActionId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-stone-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando obras…
      </div>
    );
  }

  if (!artworks.length) {
    return (
      <p className="py-10 text-stone-500">
        Aún no hay obras en la base de datos.{" "}
        <Link
          href={localizedPath(locale, "/admin/obras/nueva")}
          className=" hover:underline"
        >
          Añade la primera
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-800">
      <table className="w-full text-left ">
        <thead className="border-b border-stone-800 bg-stone-900/50 text-stone-500">
          <tr>
            <th className="px-4 py-3 ">Obra</th>
            <th className="hidden px-4 py-3  sm:table-cell">Estado</th>
            <th className="px-4 py-3  text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800">
          {artworks.map((artwork) => (
            <tr key={artwork.id} className="hover:bg-stone-900/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artwork.image_url}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className=" text-stone-200">{artwork.title}</p>
                    <p className="text-xs text-stone-500">
                      {artwork.artist ?? "—"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    artwork.is_published
                      ? "bg-green-950 text-green-400"
                      : "bg-stone-800 text-stone-500"
                  }`}
                >
                  {artwork.is_published ? "Publicada" : "Borrador"}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {artwork.is_published && (
                    <Link
                      href={localizedPath(locale, `/galeria/${artwork.slug}`)}
                      className="rounded-lg p-2 text-stone-500 hover:bg-stone-800 hover:text-stone-300"
                      title="Ver en galería"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  )}
                  <button
                    onClick={() =>
                      togglePublish(artwork.id, !artwork.is_published)
                    }
                    disabled={actionId === artwork.id}
                    className="rounded-lg p-2 text-stone-500 hover:bg-stone-800 hover:text-amber-300"
                    title={artwork.is_published ? "Ocultar" : "Publicar"}
                  >
                    {artwork.is_published ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => remove(artwork.id, artwork.title)}
                    disabled={actionId === artwork.id}
                    className="rounded-lg p-2 text-stone-500 hover:bg-red-950 hover:text-red-400"
                    title="Borrar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
