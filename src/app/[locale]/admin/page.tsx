import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminArtworkList } from "@/components/admin/admin-artwork-list";
import { ArtistProfileForm } from "@/components/admin/artist-profile-form";
import { Plus, Settings } from "lucide-react";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel admin",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const auth = await requireAdmin();

  if (auth.reason === "login") {
    redirect(
      localizedPath(
        locale,
        `/login?redirect=${encodeURIComponent(localizedPath(locale, "/admin"))}`,
      ),
    );
  }

  if (auth.reason === "no_config") {
    return (
      <AdminShell locale={locale}>
        <div className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
          <Settings className="mb-4 h-8 w-8 " />
          <h1>Configura el admin</h1>
          <p className="mt-4 ">
            Añade las variables de Supabase y <code>ADMIN_EMAILS</code> en
            Vercel, luego haz Redeploy.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-4  ">
            ADMIN_EMAILS=comidacodac@gmail.com
          </pre>
        </div>
      </AdminShell>
    );
  }

  if (auth.reason === "forbidden") {
    return (
      <AdminShell locale={locale}>
        <div className="mx-auto max-w-lg text-center">
          <h1>Acceso denegado</h1>
          <p className="mt-4 ">
            Tu cuenta ({auth.user?.email}) no está autorizada como
            administrador.
          </p>
          <Link
            href={localizedPath(locale, "/")}
            className="mt-6 inline-block  hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell locale={locale}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p>Administración</p>
          <h1 className="mt-2 ">Panel de control</h1>
          <p className="mt-2 ">
            Gestiona obras y el perfil que alimenta al curador.
          </p>
        </div>
        <Link
          href={localizedPath(locale, "/admin/obras/nueva")}
          className="inline-flex items-center gap-2 border border-neutral-900 px-5 py-2.5  transition hover:bg-neutral-900 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Nueva obra
        </Link>
      </div>

      <div className="mb-10">
        <ArtistProfileForm />
      </div>

      <AdminArtworkList locale={locale} />
    </AdminShell>
  );
}

function AdminShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <div>
      <div className="mb-6 flex gap-4 border-b border-neutral-200 pb-4 ">
        <Link href={localizedPath(locale, "/admin")}>Obras</Link>
        <Link href={localizedPath(locale, "/admin/obras/nueva")}>
          Añadir obra
        </Link>
        <Link href={localizedPath(locale, "/galeria")} className="ml-auto ">
          Ver galería pública →
        </Link>
      </div>
      {children}
    </div>
  );
}
