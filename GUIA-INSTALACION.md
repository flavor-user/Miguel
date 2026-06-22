# Flavor User — Guía completa de instalación

Esta guía está pensada para **personas que no programan**. Sigue los pasos en orden.

---

## Parte A — Programas que debes instalar

### Obligatorios

| Programa | Para qué sirve | Dónde descargarlo |
|----------|----------------|-------------------|
| **Node.js (LTS)** | Ejecuta la aplicación web en tu Mac | [https://nodejs.org](https://nodejs.org) — botón verde «LTS» |
| **Un navegador moderno** | Ver la galería y el panel admin | Chrome, Safari o Firefox (ya lo tienes) |
| **Cursor** | Editar configuración con ayuda de IA | Ya lo estás usando |

### Cuentas online (gratis al inicio)

| Servicio | Para qué sirve | Enlace |
|----------|----------------|--------|
| **Supabase** | Usuarios, base de datos, imágenes | [https://supabase.com](https://supabase.com) |
| **OpenAI** | Chat inteligente y memoria | [https://platform.openai.com](https://platform.openai.com) |
| **Vercel** (opcional) | Publicar la web en internet | [https://vercel.com](https://vercel.com) |

### Opcionales (más adelante)

| Programa | Para qué |
|----------|----------|
| **Git** | Subir el proyecto a GitHub y desplegar en Vercel. En Mac: abre Terminal y escribe `xcode-select --install` si te lo pide el sistema. |
| **GitHub** | Guardar el código en la nube |

**No necesitas** instalar Supabase ni OpenAI como programas — son servicios web a los que te conectas con claves.

---

## Parte B — Instalar Node.js (paso a paso)

1. Abre [https://nodejs.org](https://nodejs.org)
2. Descarga la versión **LTS** (recomendada para la mayoría)
3. Abre el archivo `.pkg` descargado y sigue el asistente (Siguiente → Instalar)
4. Abre la app **Terminal** en tu Mac (Spotlight → escribe «Terminal»)
5. Comprueba que funciona:

```bash
node -v
npm -v
```

Deberías ver números de versión (por ejemplo `v22.x.x` y `10.x.x`).

---

## Parte C — Arrancar Flavor User en tu Mac

1. En Terminal:

```bash
cd ~/Projects/flavor-user
npm install
cp .env.example .env.local
```

2. Abre el proyecto en Cursor (File → Open Folder → `Projects/flavor-user`)
3. Edita el archivo `.env.local` — lo completarás en las partes D y E
4. Arranca la app:

```bash
npm run dev
```

5. Abre el navegador en [http://localhost:3000/galeria](http://localhost:3000/galeria)

La galería demo funciona **antes** de configurar Supabase u OpenAI.

---

## Parte D — Crear cuenta y proyecto en Supabase

### D.1 Registro

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. «Start your project» → regístrate con **GitHub** o **email**
3. Confirma el email si te lo piden

### D.2 Crear proyecto

1. «New project»
2. **Name:** `flavor-user`
3. **Database password:** inventa una contraseña fuerte y **guárdala** (solo la necesitas para acceso directo a la BD; la app usa claves API)
4. **Region:** elige el más cercano (ej. West EU si estás en España)
5. «Create new project» — espera 1-2 minutos

### D.3 Copiar claves API

1. Menú izquierdo → **Project Settings** (engranaje)
2. **API**
3. Copia en tu `.env.local`:

| Campo en Supabase | Variable en `.env.local` |
|-------------------|--------------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role (Reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ **Nunca compartas** `service_role` ni la subas a internet.

### D.4 Crear las tablas (base de datos)

1. Menú izquierdo → **SQL Editor**
2. «New query»
3. Abre en Cursor el archivo `supabase/migrations/001_initial_schema.sql`
4. Copia **todo** el contenido y pégalo en el editor SQL de Supabase
5. Pulsa **Run** (debe decir «Success»)
6. Repite con `supabase/migrations/002_storage.sql` (bucket de imágenes)

### D.5 Activar login por email

1. **Authentication** → **Providers**
2. **Email** debe estar activado (ON)
3. Para pruebas locales: **Authentication** → **URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: añade `http://localhost:3000/**`

---

## Parte E — Crear cuenta y API key en OpenAI

### E.1 Registro

1. [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Crea cuenta y verifica email/teléfono si lo piden

### E.2 Añadir método de pago

OpenAI es de pago por uso (unos pocos euros al mes con uso normal):

1. [https://platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing)
2. Añade tarjeta y un límite de gasto mensual (ej. 10 €) para tranquilidad

### E.3 Crear API key

1. [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. «Create new secret key» → nombre: `flavor-user`
3. Copia la clave (empieza por `sk-`) en `.env.local`:

```
OPENAI_API_KEY=sk-proj-...
```

Solo se muestra una vez — si la pierdes, crea otra.

---

## Parte F — Configurar tu acceso de administrador

En `.env.local` añade **tu email** (el mismo con el que te registrarás en la app):

```
ADMIN_EMAILS=tu@email.com
```

Puedes poner varios separados por coma:

```
ADMIN_EMAILS=uno@email.com,otro@email.com
```

Reinicia la app (`Ctrl+C` en Terminal, luego `npm run dev`).

---

## Parte G — Probar todo

1. **Galería demo:** [http://localhost:3000/galeria](http://localhost:3000/galeria)
2. **Registro:** [http://localhost:3000/registro](http://localhost:3000/registro) — usa el email de `ADMIN_EMAILS`
3. **Panel admin:** [http://localhost:3000/admin](http://localhost:3000/admin)
4. **Añadir obra:** [http://localhost:3000/admin/obras/nueva](http://localhost:3000/admin/obras/nueva)
   - Sube imagen, rellena título, descripción, texto de sala
   - Marca «Publicar en la galería»
5. **Chat:** [http://localhost:3000/chat](http://localhost:3000/chat) — pregunta sobre una obra

---

## Parte H — Panel admin (sin tocar la base de datos)

Una vez configurado Supabase y `ADMIN_EMAILS`:

| Acción | Dónde |
|--------|--------|
| Ver todas las obras | `/admin` |
| Subir nueva obra | `/admin/obras/nueva` |
| Publicar / ocultar | Botón ojo en el listado |
| Borrar obra | Botón papelera |
| Ver en galería pública | Botón ojo → enlace a `/galeria/[slug]` |

Campos del formulario:

- **Imagen** — obligatoria (JPG, PNG, WebP)
- **Título** — obligatorio
- **Texto de sala** — el ensayo largo que la gente lee
- **Conceptos** — ej. `Impresionismo, Color, Paisaje` (se crean solos)

---

## Parte I — Publicar en internet (Vercel)

1. Crea repositorio en GitHub y sube el proyecto (o pide ayuda en Cursor)
2. [https://vercel.com](https://vercel.com) → Import → elige el repo
3. En Vercel → **Settings → Environment Variables** — copia **todas** las variables de `.env.local`
4. Cambia `NEXT_PUBLIC_APP_URL` a tu URL de Vercel (ej. `https://flavor-user.vercel.app`)
5. En Supabase → **Authentication → URL Configuration** — añade la URL de Vercel
6. Deploy

---

## Resumen de archivos importantes

| Archivo | Qué es |
|---------|--------|
| `.env.local` | Tus claves secretas (no compartir) |
| `supabase/migrations/*.sql` | Estructura de la base de datos |
| `src/app/galeria/` | Páginas de la galería pública |
| `src/app/admin/` | Panel de administración |
| `README.md` | Referencia técnica breve |

---

## ¿Problemas frecuentes?

| Síntoma | Solución |
|---------|----------|
| `command not found: npm` | Instala Node.js (Parte B) |
| Galería vacía tras subir obra | Marca «Publicar» y comprueba Supabase configurado |
| «No autorizado» en admin | Email en `ADMIN_EMAILS` = email de tu cuenta |
| Error al subir imagen | Ejecuta `002_storage.sql` en Supabase |
| Chat no responde bien | Comprueba `OPENAI_API_KEY` y saldo en OpenAI |
| Email de registro no llega | Revisa spam; en Supabase mira Authentication → Logs |

Si te atasacas en un paso concreto, dime en qué parte (B, D, E…) y lo vemos juntos.
