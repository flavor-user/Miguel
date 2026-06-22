import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { ArtworkUploadForm } from "@/components/admin/artwork-upload-form";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Añadir obra",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewArtworkPage({ params }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const auth = await requireAdmin();

  if (auth.reason === "login") {
    redirect(
      localizedPath(
        locale,
        `/login?redirect=${encodeURIComponent(localizedPath(locale, "/admin/obras/nueva"))}`
      )
    );
  }

  if (!auth.authorized) {
    redirect(localizedPath(locale, "/admin"));
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={localizedPath(locale, "/admin")}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Volver al panel
        </Link>
        <h1 className="mt-4 font-serif text-3xl text-neutral-900">Añadir obra a la galería</h1>
        <p className="mt-2 text-neutral-500">
          Sube la imagen, escribe los textos y publícala sin tocar la base de datos.
        </p>
      </div>

      <ArtworkUploadForm locale={locale} />
    </div>
  );
}
