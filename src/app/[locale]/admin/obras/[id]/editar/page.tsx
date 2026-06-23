import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArtworkEditForm } from "@/components/admin/artwork-edit-form";
import { requireAdmin } from "@/lib/admin/auth";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar obra",
};

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditArtworkPage({ params }: PageProps) {
  const { locale: raw, id } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const auth = await requireAdmin();

  if (auth.reason === "login") {
    redirect(
      localizedPath(
        locale,
        `/login?redirect=${encodeURIComponent(localizedPath(locale, `/admin/obras/${id}/editar`))}`,
      ),
    );
  }

  if (!auth.authorized) {
    redirect(localizedPath(locale, "/admin"));
  }

  return (
    <div>
      <div className="mb-6 flex gap-4 border-b border-neutral-200 pb-4">
        <Link href={localizedPath(locale, "/admin")}>← Panel</Link>
        <Link href={localizedPath(locale, "/admin/obras/nueva")}>Nueva obra</Link>
      </div>

      <div className="mb-8">
        <h1 className="mt-2">Editar obra</h1>
        <p className="mt-2">
          Añade o corrige ficha, texto de sala, conceptos e imagen.
        </p>
      </div>

      <ArtworkEditForm locale={locale} artworkId={id} />
    </div>
  );
}
