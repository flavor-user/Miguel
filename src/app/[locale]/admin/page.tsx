import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminArtworkList } from "@/components/admin/admin-artwork-list";
import { Plus, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Panel admin",
};

export default async function AdminPage() {
  const auth = await requireAdmin();

  if (auth.reason === "login") {
    redirect("/login?redirect=/admin");
  }

  if (auth.reason === "no_config") {
    return (
      <AdminShell>
        <div className="mx-auto max-w-lg rounded-2xl border border-amber-900/40 bg-amber-950/20 p-8">
          <Settings className="mb-4 h-8 w-8 text-amber-500" />
          <h1 className="font-serif text-2xl text-stone-100">Configura el admin</h1>
          <p className="mt-4 text-stone-400">
            Añade tu email en el archivo <code className="text-amber-400">.env.local</code>:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-stone-950 p-4 text-sm text-stone-300">
            ADMIN_EMAILS=tu@email.com
          </pre>
          <p className="mt-4 text-sm text-stone-500">
            Reinicia la app (<code>npm run dev</code>) y vuelve aquí con la misma cuenta.
          </p>
        </div>
      </AdminShell>
    );
  }

  if (auth.reason === "forbidden") {
    return (
      <AdminShell>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-serif text-2xl text-stone-100">Acceso denegado</h1>
          <p className="mt-4 text-stone-400">
            Tu cuenta ({auth.user?.email}) no está autorizada como administrador.
          </p>
          <Link href="/" className="mt-6 inline-block text-amber-400 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-500">Administración</p>
          <h1 className="mt-2 font-serif text-3xl text-stone-50">Panel de control</h1>
          <p className="mt-2 text-stone-500">Gestiona las obras de la galería.</p>
        </div>
        <Link
          href="/admin/obras/nueva"
          className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-medium text-stone-950 transition hover:bg-amber-500"
        >
          <Plus className="h-4 w-4" />
          Nueva obra
        </Link>
      </div>

      <AdminArtworkList />
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6 flex gap-4 border-b border-stone-800 pb-4 text-sm">
        <Link href="/admin" className="text-amber-400">
          Obras
        </Link>
        <Link href="/admin/obras/nueva" className="text-stone-500 hover:text-stone-300">
          Añadir obra
        </Link>
        <Link href="/galeria" className="ml-auto text-stone-500 hover:text-stone-300">
          Ver galería pública →
        </Link>
      </div>
      {children}
    </div>
  );
}
