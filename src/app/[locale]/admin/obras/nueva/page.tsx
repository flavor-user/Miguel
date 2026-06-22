import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { ArtworkUploadForm } from "@/components/admin/artwork-upload-form";

export const metadata: Metadata = {
  title: "Añadir obra",
};

export default async function NewArtworkPage() {
  const auth = await requireAdmin();

  if (!auth.authorized) {
    redirect("/admin");
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin" className="text-sm text-stone-500 hover:text-amber-300">
          ← Volver al panel
        </Link>
        <h1 className="mt-4 font-serif text-3xl text-stone-50">Añadir obra a la galería</h1>
        <p className="mt-2 text-stone-500">
          Sube la imagen, escribe los textos y publícala sin tocar la base de datos.
        </p>
      </div>

      <ArtworkUploadForm />
    </div>
  );
}
