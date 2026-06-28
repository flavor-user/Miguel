"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  GripVertical,
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

function reorderList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function AdminArtworkList({ locale }: { locale: Locale }) {
  const [artworks, setArtworks] = useState<ArtworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

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

  function handleDragStart(
    event: React.DragEvent<HTMLTableRowElement>,
    id: string,
  ) {
    if (orderSaving || actionId) {
      event.preventDefault();
      return;
    }
    setDragId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(
    event: React.DragEvent<HTMLTableRowElement>,
    targetId: string,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragId && dragId !== targetId) {
      setDropTargetId(targetId);
    }
  }

  function handleDrop(
    event: React.DragEvent<HTMLTableRowElement>,
    targetId: string,
  ) {
    event.preventDefault();
    const sourceId = dragId ?? event.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) {
      clearDragState();
      return;
    }

    const fromIndex = artworks.findIndex((a) => a.id === sourceId);
    const toIndex = artworks.findIndex((a) => a.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      clearDragState();
      return;
    }

    void saveOrder(reorderList(artworks, fromIndex, toIndex));
    clearDragState();
  }

  function clearDragState() {
    setDragId(null);
    setDropTargetId(null);
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
        Arrastra cada obra por la imagen o el asa{" "}
        <GripVertical className="inline h-4 w-4 align-text-bottom" /> para
        cambiar su posición en la galería y la portada.
        {orderSaving && (
          <span className="ml-2 text-amber-500/90">Guardando orden…</span>
        )}
      </p>

      <div className="overflow-hidden rounded-2xl border border-stone-800">
        <table className="w-full text-left ">
          <thead className="border-b border-stone-800 bg-stone-900/50 text-stone-500">
            <tr>
              <th className="w-10 px-2 py-3" />
              <th className="px-4 py-3 ">Obra</th>
              <th className="hidden px-4 py-3  sm:table-cell">Estado</th>
              <th className="px-4 py-3  text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {artworks.map((artwork, index) => {
              const isDragging = dragId === artwork.id;
              const isDropTarget = dropTargetId === artwork.id;

              return (
                <tr
                  key={artwork.id}
                  draggable={!orderSaving && actionId !== artwork.id}
                  onDragStart={(event) => handleDragStart(event, artwork.id)}
                  onDragOver={(event) => handleDragOver(event, artwork.id)}
                  onDrop={(event) => handleDrop(event, artwork.id)}
                  onDragEnd={clearDragState}
                  onDragLeave={() => {
                    if (dropTargetId === artwork.id) {
                      setDropTargetId(null);
                    }
                  }}
                  className={`transition-colors ${
                    isDragging
                      ? "opacity-40"
                      : isDropTarget
                        ? "bg-amber-950/40 ring-2 ring-inset ring-amber-500/60"
                        : "hover:bg-stone-900/30"
                  } ${!orderSaving && actionId !== artwork.id ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <td className="px-2 py-3 text-center text-xs tabular-nums text-stone-600">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <GripVertical
                        className="h-5 w-5 shrink-0 text-stone-600"
                        aria-hidden
                      />
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-700 bg-stone-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={artwork.image_url}
                          alt=""
                          draggable={false}
                          className="max-h-full max-w-full object-contain pointer-events-none select-none"
                        />
                      </div>
                      <div className="min-w-0">
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
                    <div
                      className="flex items-center justify-end gap-2"
                      draggable={false}
                      onDragStart={(event) => event.preventDefault()}
                    >
                      <Link
                        href={localizedPath(
                          locale,
                          `/admin/obras/${artwork.id}/editar`,
                        )}
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-800 hover:text-amber-300"
                        title="Editar ficha y textos"
                        draggable={false}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {artwork.is_published && (
                        <Link
                          href={localizedPath(
                            locale,
                            `/galeria/${artwork.slug}`,
                          )}
                          className="rounded-lg p-2 text-stone-500 hover:bg-stone-800 hover:text-stone-300"
                          title="Ver en galería"
                          draggable={false}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      )}
                      <button
                        type="button"
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
                        type="button"
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
