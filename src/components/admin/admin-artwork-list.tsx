"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { localizedPath, type Locale } from "@/lib/i18n/config";

interface ArtworkRow {
  id: string;
  slug: string;
  title: string;
  artist: string | null;
  is_published: boolean;
  image_url: string;
  sort_order: number;
}

export function AdminArtworkList({ locale }: { locale: Locale }) {
  const [artworks, setArtworks] = useState<ArtworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/artworks", { credentials: "include" });
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

  async function saveOrder(next: ArtworkRow[]) {
    setOrderSaving(true);
    setArtworks(next);
    try {
      const res = await fetch("/api/admin/artworks/reorder", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((a) => a.id) }),
      });
      if (!res.ok) {
        await load();
      }
    } finally {
      setOrderSaving(false);
    }
  }

  function moveArtwork(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= artworks.length) return;

    const next = [...artworks];
    [next[index], next[target]] = [next[target], next[index]];
    void saveOrder(next);
  }

  async function togglePublish(id: string, publish: boolean) {
    setActionId(id);
    await fetch(`/api/admin/artworks/${id}`, {
      method: "PATCH",
      credentials: "include",
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
    await fetch(`/api/admin/artworks/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
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
    <div className="space-y-3">
      <p className="text-sm text-stone-500">
        El orden de arriba a abajo es el de la galería y la portada. Usa{" "}
        <strong className="text-stone-300">Subir</strong> y{" "}
        <strong className="text-stone-300">Bajar</strong> para cambiar la
        disposición.
        {orderSaving && (
          <span className="ml-2 text-amber-500/90">Guardando orden…</span>
        )}
      </p>

      <div className="overflow-hidden rounded-2xl border border-stone-800">
        <table className="w-full text-left ">
          <thead className="border-b border-stone-800 bg-stone-900/50 text-stone-500">
            <tr>
              <th className="w-20 px-2 py-3 text-center">Orden</th>
              <th className="px-4 py-3 ">Obra</th>
              <th className="hidden px-4 py-3  sm:table-cell">Estado</th>
              <th className="px-4 py-3  text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {artworks.map((artwork, index) => (
              <tr key={artwork.id} className="hover:bg-stone-900/30">
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveArtwork(index, -1)}
                      disabled={
                        index === 0 || orderSaving || actionId === artwork.id
                      }
                      className="rounded p-1 text-stone-500 hover:bg-stone-800 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Subir en la galería"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <span className="text-xs tabular-nums text-stone-600">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveArtwork(index, 1)}
                      disabled={
                        index === artworks.length - 1 ||
                        orderSaving ||
                        actionId === artwork.id
                      }
                      className="rounded p-1 text-stone-500 hover:bg-stone-800 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Bajar en la galería"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </td>
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
                    <Link
                      href={localizedPath(
                        locale,
                        `/admin/obras/${artwork.id}/editar`,
                      )}
                      className="rounded-lg p-2 text-stone-500 hover:bg-stone-800 hover:text-amber-300"
                      title="Editar ficha y textos"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
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
                      disabled={actionId === artwork.id || orderSaving}
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
                      disabled={actionId === artwork.id || orderSaving}
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
    </div>
  );
}
