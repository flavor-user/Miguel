# Flavor User

Galería de arte con textos para leer + IA con memoria persistente.

> **¿Primera vez?** Lee la guía paso a paso: **[GUIA-INSTALACION.md](./GUIA-INSTALACION.md)**  
> (programas a instalar, Supabase, OpenAI y panel admin)

## Qué incluye la v1

- **Galería pública** — imágenes, fichas y textos de sala
- **Panel admin** — subir obras sin tocar la base de datos (`/admin`)
- **Conceptos relacionados** — red de ideas
- **Chat con Flavor User** — OpenAI + memoria
- **Usuarios e historial** — Supabase Auth

## Inicio rápido

```bash
cd ~/Projects/flavor-user
npm install
cp .env.example .env.local
npm run dev
```

Galería demo: [http://localhost:3000/galeria](http://localhost:3000/galeria)

## Panel admin

1. Configura `ADMIN_EMAILS=tu@email.com` en `.env.local`
2. Regístrate en `/registro` con ese email
3. Entra en `/admin` → **Nueva obra**

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/galeria` | Galería pública |
| `/galeria/[slug]` | Obra + texto de sala |
| `/admin` | Listado de obras (admin) |
| `/admin/obras/nueva` | Subir obra |
| `/chat` | Asistente IA |
| `/conceptos` | Red de conceptos |

Ver **GUIA-INSTALACION.md** para configuración completa de Supabase, OpenAI y despliegue.
